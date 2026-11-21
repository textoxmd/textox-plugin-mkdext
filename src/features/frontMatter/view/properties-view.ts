import type { Node as PMNode } from "prosemirror-model";
import { Selection, TextSelection } from "prosemirror-state";
import type { EditorView, NodeView, ViewMutationRecord } from "prosemirror-view";

import { buildValueControl } from "./controls";
import { parseEntries } from "./entry-model";
import { t } from "./i18n";
import { buildKeyIcon, buildToggleIcon, buildTrashIcon } from "./icons";
import { attachKeySuggest, collectKeyCandidates, type KeySuggestHandle } from "./key-suggest";
import { isBuiltinKey, normalizeValue, resolveEntryType } from "./key-presets";
import { readViewMode, subscribeViewMode, writeViewMode } from "./mode";
import { applyEdit } from "./splice";
import type { EditAction, Entry, ViewMode } from "./types";

/** 新建空属性块时自动展开一行待输入属性（一次性；按视图归属，由 `---` 转换路径请求）。 */
let pendingView: EditorView | null = null;

/** 请求指定编辑器视图的下一个属性块挂载时自动展开待输入行（非空/源码态会消费后丢弃）。 */
export function requestPendingPropertyRow(view: EditorView): void {
  pendingView = view;
}

/** 清除指定视图尚未消费的待输入行标记（dispatch 被拒/抛错时兜底）。 */
export function clearPendingPropertyRow(view: EditorView): void {
  if (pendingView === view) pendingView = null;
}

/** 由 feature.ts 构造并注册。 */
export function makePropertiesView(
  node: PMNode,
  view: EditorView,
  getPos: () => number | undefined,
): NodeView {
  return new PropertiesView(node, view, getPos);
}

/**
 * 合法键名：非空、不含 `:` 与 `#`、首字符非空白。
 * 尾随空白由 `isValidKey` 的 `raw === raw.trim()` 兜底（此正则的 `[^#:]*` 允许内部空白）。
 * `splice` 的 rename/add 不对键名做 YAML 转义，故写回前须另经 `commitEdit` 的可解析性守卫。
 */
const KEY_OK = /^[^\s#:][^#:]*$/;

/** 键名是否可安全写入（非空、无首尾空白、首字符非空白、不含 `:`/`#`）。 */
function isValidKey(raw: string): boolean {
  return raw === raw.trim() && raw !== "" && KEY_OK.test(raw);
}

/** 编辑器锁定时把值控件变为只读：输入框 readOnly、勾选框与按钮 disabled（含控件自身）。 */
function applyReadOnly(control: HTMLElement): void {
  for (const el of [control, ...Array.from(control.querySelectorAll("*"))]) {
    if (el instanceof HTMLTextAreaElement) {
      el.readOnly = true;
    } else if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox") el.disabled = true;
      else el.readOnly = true;
    } else if (el instanceof HTMLButtonElement) {
      el.disabled = true;
    }
  }
}

class PropertiesView implements NodeView {
  readonly dom: HTMLElement;
  readonly contentDOM: HTMLElement;
  private readonly actions: HTMLElement;
  private readonly deleteBtn: HTMLButtonElement;
  private readonly addBtn: HTMLButtonElement;
  private readonly toggle: HTMLButtonElement;
  private readonly panel: HTMLElement;
  private readonly source: HTMLElement;
  private node: PMNode;
  private mode: ViewMode;
  private unsubscribe: () => void;
  /** 列表值提交后待恢复焦点的行 key（整块重建会丢焦点，用于连续输入）。 */
  private pendingListFocus: string | null = null;
  /** 静默写回进行中：期间不重建面板（避免打断单值控件的输入）。 */
  private silentUpdate = false;
  /** 编辑器是否处于锁定（不可编辑）状态。 */
  private locked = false;
  /** 监听编辑器锁定态变化（PM 的 editable prop 反映在 `.ProseMirror` 的 contenteditable 上）。 */
  private lockObserver: MutationObserver | null = null;

  constructor(
    node: PMNode,
    private readonly view: EditorView,
    private readonly getPos: () => number | undefined,
  ) {
    this.node = node;

    // 根元素沿用 `yaml-block`（spec DSL 依赖标签）。
    this.dom = document.createElement("yaml-block");

    // 右上角操作按钮组 [删除整块][添加属性][切换]：绝对定位浮在属性框右上角，不占垂直空间（悬停浮现）。
    // 「删除整块」：位于操作区最左，悬停浮现；点击移除整个 front matter 节点。
    this.deleteBtn = document.createElement("button");
    this.deleteBtn.type = "button";
    this.deleteBtn.className = "fm-delete-block";
    // 图标在交给 ProseMirror 之前就绪（NodeView 的 DOM 结构不可在挂载后变化）。
    this.deleteBtn.appendChild(buildTrashIcon());
    const removeLabel = t("frontMatter.removeBlock", "Remove document properties");
    this.deleteBtn.title = removeLabel;
    this.deleteBtn.setAttribute("aria-label", removeLabel);
    this.deleteBtn.addEventListener("mousedown", (e) => e.preventDefault());
    this.deleteBtn.addEventListener("click", () => this.removeBlock());
    this.addBtn = document.createElement("button");
    this.addBtn.type = "button";
    this.addBtn.className = "fm-add-btn";
    this.addBtn.textContent = `+ ${t("frontMatter.addProperty", "Add property")}`;
    this.addBtn.addEventListener("mousedown", (e) => e.preventDefault());
    this.addBtn.addEventListener("click", () => this.addPendingRow());
    // 视图切换按钮：面板态 `</>`（去源码），源码态列表图标（回面板），悬停块时浮现。
    this.toggle = document.createElement("button");
    this.toggle.type = "button";
    this.toggle.className = "fm-toggle";
    this.toggle.addEventListener("mousedown", (e) => e.preventDefault());
    this.toggle.addEventListener("click", () => {
      void writeViewMode(this.mode === "panel" ? "source" : "panel");
    });
    this.actions = document.createElement("div");
    this.actions.className = "fm-actions";
    this.actions.setAttribute("contenteditable", "false");
    this.actions.append(this.deleteBtn, this.addBtn, this.toggle);
    this.dom.appendChild(this.actions);

    // 面板容器（表单）
    // PM 只在「无 contentDOM」的 NodeView 上自动设 contenteditable=false（prosemirror-view 源码），
    // 本视图有 contentDOM，故须对非内容区显式标记，否则属性名等文本会出现插入符/可被选中。
    this.panel = document.createElement("div");
    this.panel.className = "fm-panel";
    this.panel.setAttribute("contenteditable", "false");
    this.dom.appendChild(this.panel);

    // 源码容器：contentDOM 为唯一子节点——不再渲染 `---` 围栏，外观直接对齐编辑器代码块。
    this.source = document.createElement("div");
    this.source.className = "fm-source";
    this.contentDOM = document.createElement("div");
    this.contentDOM.className = "fm-source-body";
    this.source.appendChild(this.contentDOM);
    this.dom.appendChild(this.source);

    // 锁定态：PM 的 editable prop 反映在编辑器根的 contenteditable 上；
    // 监听其变化以同步面板的只读态（锁定时不可编辑、不可切换源码）。
    this.locked = this.readLocked();
    if (typeof MutationObserver === "function") {
      this.lockObserver = new MutationObserver(() => {
        const locked = this.readLocked();
        if (locked === this.locked) return;
        this.locked = locked;
        this.render();
      });
      this.lockObserver.observe(this.view.dom, {
        attributes: true,
        attributeFilter: ["contenteditable"],
      });
    }

    this.mode = readViewMode();
    this.unsubscribe = subscribeViewMode((m) => {
      this.mode = m;
      this.render();
    });
    this.render();
    this.openPendingRowIfRequested();
  }

  update(node: PMNode): boolean {
    if (node.type !== this.node.type) return false;
    const changed = node.textContent !== this.node.textContent;
    this.node = node;
    // 自己触发的静默写回（单值控件输入即提交）不重建面板，否则会打断正在进行的输入。
    if (changed && !this.silentUpdate) this.render();
    else this.refreshSourceAttr();
    return true;
  }

  stopEvent(event: Event): boolean {
    // 面板、右上角按钮组的交互都不交给 PM。
    const target = event.target as Node;
    return this.panel.contains(target) || this.actions.contains(target);
  }

  ignoreMutation(mutation: ViewMutationRecord): boolean {
    // 根 / contentDOM 的属性变更（data-source / data-mode / style / class）均由本视图自身造成，
    // 必须忽略，否则 PM 会重解析该节点（WebKit 下可能触发重建循环）。
    if (
      mutation.type === "attributes" &&
      (mutation.target === this.dom || mutation.target === this.contentDOM)
    ) {
      return true;
    }
    // 只有源码编辑区内部的变更交给 PM；面板等其余一律忽略。
    return !this.contentDOM.contains(mutation.target);
  }

  selectNode(): void {
    this.dom.classList.add("fm-selected");
  }

  deselectNode(): void {
    this.dom.classList.remove("fm-selected");
  }

  destroy(): void {
    this.lockObserver?.disconnect();
    this.lockObserver = null;
    this.unsubscribe();
  }

  /** 编辑器是否锁定：PM 在 editable=false 时把编辑器根的 contenteditable 置为 "false"。 */
  private readLocked(): boolean {
    return this.view.dom.getAttribute("contenteditable") === "false";
  }

  // ── 内部 ─────────────────────────────────────────────
  private refreshSourceAttr(): void {
    this.dom.setAttribute("data-source", this.node.textContent);
    this.dom.setAttribute("data-mode", this.mode);
  }

  private render(): void {
    this.refreshSourceAttr();
    // 锁定态以编辑器根为准：PM 的 editable prop 只反映在 `.ProseMirror` 的 contenteditable 上，
    // 每次渲染重读一次，避免依赖 MutationObserver 的异步投递。
    this.locked = this.readLocked();
    const panel = this.mode === "panel";
    // 锁定态：整块标记只读，并禁用三个操作按钮（不可删除、不可添加属性、不可切换源码）。
    this.dom.setAttribute("data-locked", this.locked ? "true" : "false");
    this.addBtn.disabled = this.locked;
    this.toggle.disabled = this.locked;
    this.deleteBtn.disabled = this.locked;
    // 「添加属性」仅在面板态有意义。
    this.addBtn.style.display = panel ? "" : "none";
    // 切换按钮内容为 SVG 图标（文本 `</>` 在 WKWebView 窄宽下会折行）。
    this.toggle.textContent = "";
    this.toggle.appendChild(buildToggleIcon(panel ? "panel" : "source"));
    this.toggle.setAttribute(
      "title",
      panel ? t("frontMatter.toggleToSource", "View source") : t("frontMatter.toggleToPanel", "View properties"),
    );
    this.panel.style.display = panel ? "" : "none";
    this.source.style.display = panel ? "none" : "";
    if (panel) this.renderPanel();
  }

  /** 删除整个 front matter 节点；跳过原子叶落笔，文档删空时补一个空段落。 */
  private removeBlock(): void {
    // 用实时锁定态判断（而非缓存），避免刚切只读的极短窗口内仍可删。
    if (this.readLocked()) return;
    const pos = this.getPos();
    if (pos == null) return;
    const paragraph = this.node.type.schema.nodes.paragraph!;
    const tr = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
    // 向后找可落笔的 textblock（跳过分隔线/TOC 等原子叶），避免把光标落成 NodeSelection；
    // 找不到时在文档末尾补一个空段落（保持原子块不被破坏）。
    const target = Selection.findFrom(tr.doc.resolve(pos), 1, true);
    if (target) {
      tr.setSelection(target);
    } else {
      const end = tr.doc.content.size;
      tr.insert(end, paragraph.create());
      tr.setSelection(TextSelection.create(tr.doc, end + 1));
    }
    tr.scrollIntoView();
    this.view.dispatch(tr);
    this.view.focus();
  }

  /** 面板最后一个可编辑输入行（单值输入 / tag）按 Enter：提交后把光标送到属性块下方的正文。 */
  private exitBlock(): void {
    if (this.readLocked()) return;
    const pos = this.getPos();
    if (pos == null) return;
    const after = pos + this.node.nodeSize;
    const tr = this.view.state.tr;
    // 向后找可落笔的 textblock；跳过分隔线/TOC 等原子叶，避免把光标落成 NodeSelection。
    const target = Selection.findFrom(tr.doc.resolve(after), 1, true);
    if (target) {
      tr.setSelection(target);
    } else {
      // 后面没有可落笔的 textblock（文末或只剩原子叶）：追加空段落，保留尾部原子块。
      const end = tr.doc.content.size;
      tr.insert(end, this.node.type.schema.nodes.paragraph!.create());
      tr.setSelection(TextSelection.create(tr.doc, end + 1));
    }
    tr.scrollIntoView();
    this.view.dispatch(tr);
    this.view.focus();
  }

  /** 消费一次性标记：新建的空块在 DOM 挂载后展开待输入行（联想浮层按真实布局定位）。 */
  private openPendingRowIfRequested(): void {
    if (pendingView !== this.view) return;
    pendingView = null;
    if (this.mode !== "panel" || this.readLocked() || this.node.textContent !== "") return;
    const open = () => {
      if (!this.dom.isConnected || this.mode !== "panel" || this.readLocked()) return;
      this.addPendingRow();
    };
    if (typeof queueMicrotask === "function") queueMicrotask(open);
    else setTimeout(open, 0);
  }

  private renderPanel(): void {
    const parsed = parseEntries(this.node.textContent);
    this.panel.textContent = "";

    if (!parsed.ok) {
      const warn = document.createElement("div");
      warn.className = "fm-panel-warn";
      warn.textContent = t("frontMatter.invalidYaml", "Invalid YAML — switch to source to edit");
      this.panel.appendChild(warn);
      return;
    }

    const list = document.createElement("div");
    list.className = "fm-list";
    const entries = parsed.entries;
    // 「最后一行」指最后一个可编辑输入行（单值输入或列表 tag；raw/boolean 不参与）：
    // tags/categories 等列表行在末尾时，前面的文本输入框按 Enter 只提交；
    // 末尾 tag 输入框为空时按 Enter 退出属性块。raw/boolean 末尾不改变“最后一行”的归属。
    let lastInputIndex = -1;
    entries.forEach((entry, index) => {
      const type = resolveEntryType(entry.key, entry);
      if (type !== "raw" && type !== "boolean") lastInputIndex = index;
    });
    entries.forEach((entry, index) => {
      list.appendChild(this.buildRow(entry, index === lastInputIndex));
    });
    this.panel.appendChild(list);

    // 列表编辑后会整块重建：把焦点还给同一行的值输入框，支持连续输入 tag。
    if (this.pendingListFocus !== null) {
      const key = this.pendingListFocus;
      this.pendingListFocus = null;
      for (const row of Array.from(this.panel.querySelectorAll<HTMLElement>(".fm-row"))) {
        if (row.querySelector(".fm-key-label")?.textContent !== key) continue;
        row.querySelector<HTMLInputElement>(".fm-chips .fm-add-input")?.focus();
        break;
      }
    }
  }

  /**
   * 属性名联想候选：内置常用名 ∪ 本文已用属性名（去重）。
   * - 改名（`excludeKey` 非空）：排除正在编辑自身的 key，本文已用名优先靠前。
   * - 新增（`excludeKey` 为空）：排除文档里已存在的 key，避免建议出重复属性。
   */
  private suggestKeys(excludeKey: string): string[] {
    const parsed = parseEntries(this.node.textContent);
    const entries = parsed.ok ? parsed.entries : [];
    const candidates = collectKeyCandidates(entries, excludeKey);
    if (excludeKey !== "") return candidates;
    const used = new Set(entries.map((entry) => entry.key));
    return candidates.filter((key) => !used.has(key));
  }

  /**
   * 「添加属性」：直接新增一行（无需先填属性名）。行内 key 列为编辑态输入框、光标就位，
   * Enter/失焦提交（合法键名写回）；空值/非法/Escape 撤销该行。提交成功后整块重建。
   */
  private addPendingRow(): void {
    // 编辑器锁定时不可添加属性（按钮也已禁用，这里再兜底一层）。
    if (this.readLocked() || this.mode !== "panel") return;
    const list = this.panel.querySelector(".fm-list") as HTMLElement | null;
    if (!list || list.querySelector(".fm-add-row")) return;

    const row = document.createElement("div");
    row.className = "fm-row fm-add-row";
    row.appendChild(buildKeyIcon(""));

    const keyCell = document.createElement("div");
    keyCell.className = "fm-key";
    const input = document.createElement("input");
    input.className = "fm-key-edit";
    input.placeholder = t("frontMatter.addPropertyKeyPrompt", "Property name");
    // 行首图标随输入同步：命中内置名换成专属图标，否则圆标显示首字符。
    input.addEventListener("input", () => {
      if (!row.firstChild) return;
      row.replaceChild(buildKeyIcon(input.value), row.firstChild);
    });
    // commit/cancel 先声明（闭包引用 input/row），供下方监听器使用。
    let handle: KeySuggestHandle | null = null;
    const cancel = (focusEditor = false) => {
      handle?.destroy();
      handle = null;
      const wasFocused = row.contains(document.activeElement);
      row.remove();
      // 显式 Escape 取消才把焦点还给编辑器；失焦提交路径不抢焦点。
      if (focusEditor && wasFocused) this.view.focus();
    };
    const commit = () => {
      if (!row.isConnected) return;
      const stillFocused = input === document.activeElement;
      handle?.destroy();
      handle = null;
      const key = input.value;
      // 只接受合法键名；写回守卫拒绝（如 `- a`）时同样撤销该行。
      if (key && isValidKey(key) && this.commitEdit({ kind: "add", key, value: "", type: "text" })) {
        // 键盘提交（Enter）：写回后整块重建、输入框被卸载，把焦点交给新行的值控件，
        // 形成「属性名 → Enter → 直接输入值」的键盘闭环；失焦提交不抢焦点。
        if (stillFocused) queueMicrotask(() => this.focusValueOf(key));
        return; // 写回成功后整块重建，无需手动移除。
      }
      cancel(stillFocused);
    };
    // 属性名联想：输入即过滤（见 key-suggest.ts）。
    handle = attachKeySuggest(input, {
      container: this.panel,
      candidates: () => this.suggestKeys(""),
      onSubmit: commit,
      onCancel: () => cancel(true),
    });
    input.addEventListener("blur", commit);
    keyCell.appendChild(input);
    row.appendChild(keyCell);

    const val = document.createElement("div");
    val.className = "fm-val";
    row.appendChild(val);

    list.appendChild(row);
    input.focus();
    // 空属性名时直接列出候选（无需先输入内容）。
    handle?.open();
  }

  /** 提交新增行后把焦点交给该 key 的值控件（防御：写回后若出现同名行，取最后一行）。 */
  private focusValueOf(key: string): void {
    const rows = Array.from(this.panel.querySelectorAll<HTMLElement>(".fm-row"));
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i]!;
      if (row.querySelector(".fm-key-label")?.textContent !== key) continue;
      const control = row.querySelector<HTMLElement>(
        ".fm-val .fm-input, .fm-chips .fm-add-input, .fm-checkbox",
      );
      if (control) control.focus();
      else this.view.focus();
      return;
    }
  }

  /** 单行：类型图标 + 键名单元（默认文本，点击编辑）+ 值控件 + 删除按钮。 */
  private buildRow(entry: Entry, isLastInput: boolean): HTMLElement {
    const row = document.createElement("div");
    row.className = "fm-row";
    const locked = this.locked;

    const ico = buildKeyIcon(entry.key);

    // 键名单元：默认弱化文本，点击/聚焦切换为可编辑 input（贴合原地编辑，不占第二列宽）。
    // 内置属性名（tags/status/…）在面板内锁定改名；编辑器锁定时所有属性名都不可改。
    const lockedKey = locked || isBuiltinKey(entry.key);
    const keyCell = document.createElement("div");
    keyCell.className = lockedKey ? "fm-key fm-key-locked" : "fm-key";
    if (!lockedKey) keyCell.tabIndex = 0;
    // 改名态的联想浮层句柄（离开编辑态时销毁）。
    let keySuggest: KeySuggestHandle | null = null;
    const renderKeyLabel = () => {
      keySuggest?.destroy();
      keySuggest = null;
      keyCell.textContent = "";
      const label = document.createElement("span");
      label.className = "fm-key-label";
      label.textContent = entry.key;
      keyCell.appendChild(label);
    };
    const commitKey = () => {
      keySuggest?.destroy();
      keySuggest = null;
      const input = keyCell.querySelector(".fm-key-edit") as HTMLInputElement | null;
      if (!input) return;
      const raw = input.value;
      // 键名校验对「原始输入」进行：含首尾空白者拒绝而非静默规范化。
      if (!isValidKey(raw) || raw === entry.key) {
        renderKeyLabel(); // 非法/未改动：回退，不提交
        return;
      }
      // 写回守卫可能拒绝（如 `- a` 等会破坏 YAML 的键），此时同样回退。
      if (!this.commitEdit({ kind: "rename", key: entry.key, nextKey: raw })) {
        renderKeyLabel();
      }
    };
    const activateKeyEdit = () => {
      if (keyCell.querySelector(".fm-key-edit")) return;
      const input = document.createElement("input");
      input.className = "fm-key-edit";
      input.value = entry.key;
      // 属性名联想：输入即过滤；排除正在编辑自身的 key。
      keySuggest = attachKeySuggest(input, {
        container: this.panel,
        candidates: () => this.suggestKeys(entry.key),
        onSubmit: commitKey,
        onCancel: renderKeyLabel,
      });
      input.addEventListener("change", commitKey);
      input.addEventListener("blur", () => {
        // 失焦时未改动则还原为文本（改动由 change 处理）。
        if (keyCell.contains(input) && input.value === entry.key) renderKeyLabel();
      });
      keyCell.textContent = "";
      keyCell.appendChild(input);
      input.focus();
      input.select();
    };
    renderKeyLabel();
    if (!lockedKey) {
      // 不让 PM 窃取键名交互（沿用既有点击不落笔的做法）；
      // 但编辑框内的 mousedown 需放行，否则无法放置光标。
      keyCell.addEventListener("mousedown", (e) => {
        if ((e.target as HTMLElement).classList.contains("fm-key-edit")) return;
        e.preventDefault();
      });
      keyCell.addEventListener("click", activateKeyEdit);
      keyCell.addEventListener("focus", activateKeyEdit);
    }

    // 预设类型优先（如 tags 恒用数组控件）；值归一化后交给控件，写回同样按解析后的类型。
    const type = resolveEntryType(entry.key, entry);
    const viewEntry: Entry = {
      ...entry,
      type,
      // 已解析为可编辑类型时清掉 complex（空值曾被推断为 raw）；raw 保持只读降级。
      complex: type === "raw",
      value: normalizeValue(type, entry.value),
    };
    const val = document.createElement("div");
    val.className = "fm-val";
    const control = buildValueControl(viewEntry, {
      commit: (value) => {
        const action: EditAction = { kind: "setValue", key: entry.key, value, type };
        if (type === "list") {
          // 列表值提交后需要重建 chips；记下 key，重建后把焦点还给它的输入框（支持连续输入）。
          this.pendingListFocus = entry.key;
          void this.commitEdit(action);
          return;
        }
        // 单值控件（输入框/勾选框）：输入即写回，但不重建面板，避免打断正在进行的输入。
        this.commitValueSilent(action);
      },
      // 最后一个可编辑输入行：单值输入 Enter 提交后跳出；列表 tag 空输入 Enter 跳出。
      onEnter: isLastInput && type !== "list" ? () => this.exitBlock() : undefined,
      onEmptyEnter: isLastInput && type === "list" ? () => this.exitBlock() : undefined,
    });
    if (locked) applyReadOnly(control);
    val.appendChild(control);

    row.append(ico, keyCell, val);
    if (!locked) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "fm-remove";
      remove.textContent = "×";
      remove.title = t("frontMatter.removeProperty", "Remove property");
      remove.addEventListener("mousedown", (e) => e.preventDefault());
      remove.addEventListener("click", () => void this.commitEdit({ kind: "remove", key: entry.key }));
      row.appendChild(remove);
    }
    return row;
  }

  /** 值控件的静默写回：落事务但不重建面板（避免打断输入 / 中文 IME）。 */
  private commitValueSilent(action: EditAction): boolean {
    this.silentUpdate = true;
    try {
      return this.commitEdit(action);
    } finally {
      this.silentUpdate = false;
    }
  }

  /** 把一次编辑写回节点文本；写回被拒（无效/会破坏 YAML）返回 false。 */
  private commitEdit(action: EditAction): boolean {
    const pos = this.getPos();
    if (pos == null) return false;
    const parsed = parseEntries(this.node.textContent);
    const next = applyEdit(parsed, action);
    if (next == null) return false;
    // 写回后的 body 必须是仍可解析的 YAML 映射，避免产生非法 front matter。
    if (!parseEntries(next).ok) return false;
    const from = pos + 1;
    const to = pos + this.node.nodeSize - 1;
    const tr = this.view.state.tr.replaceWith(from, to, next ? this.node.type.schema.text(next) : []);
    this.view.dispatch(tr);
    return true;
  }
}
