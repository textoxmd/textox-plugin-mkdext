import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Node as PMNode } from "prosemirror-model";
import { Schema } from "prosemirror-model";
import { EditorState, Plugin, TextSelection } from "prosemirror-state";
import type { ViewMutationRecord } from "prosemirror-view";
import { EditorView } from "prosemirror-view";

import { frontMatterSyntaxFeature } from "../syntax/feature";
import { setTranslator } from "./i18n";
import { configureViewMode } from "./mode";
import {
  clearPendingPropertyRow,
  makePropertiesView,
  requestPendingPropertyRow,
} from "./properties-view";
import type { ViewMode } from "./types";

/** 视图模式内存桩：与注入端口等价（写回即通知订阅者）。 */
let viewMode: ViewMode = "panel";
const viewModeListeners = new Set<(mode: ViewMode) => void>();

/** 设置模式并通知订阅者（等价于宿主写入 `view` 配置后的推送）。 */
function setViewMode(mode: ViewMode): void {
  viewMode = mode;
  for (const listener of viewModeListeners) listener(mode);
}

/** 每个用例前安装干净的端口（读回默认 panel）。 */
function installViewModePort(): void {
  viewMode = "panel";
  viewModeListeners.clear();
  configureViewMode({
    read: () => viewMode,
    write: (mode) => setViewMode(mode),
    subscribe: (listener) => {
      viewModeListeners.add(listener);
      return () => viewModeListeners.delete(listener);
    },
  });
}

// NodeView 的 `dom`/`contentDOM` 在 PM 类型里是宽泛的 `Node`，且可选方法带必填参数；
// 测试里按本视图的真实结构收窄，便于直接调用与查询。
interface ViewUnderTest {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  update(node: PMNode): boolean;
  stopEvent(event: Event): boolean;
  ignoreMutation(mutation: ViewMutationRecord): boolean;
  destroy(): void;
}

// 本测试独立于 feature 接线（任务 7），直接内联注册 NodeView。
const nodeViewsPlugin = new Plugin({
  props: { nodeViews: { front_matter: makePropertiesView } },
});

function makeSchema(): Schema {
  return new Schema({
    nodes: {
      doc: { content: "block+" },
      paragraph: { group: "block", content: "text*", toDOM: () => ["p", 0] },
      horizontal_rule: { group: "block", atom: true, toDOM: () => ["hr"] },
      text: { group: "inline" },
      ...frontMatterSyntaxFeature.nodes,
    },
  });
}

function mount(
  body: string,
  after: string[] = [],
): { view: EditorView; dom: HTMLElement; destroy(): void } {
  const schema = makeSchema();
  const node = schema.nodes.front_matter!.create(null, body ? schema.text(body) : undefined);
  const following = after.map((text) =>
    schema.nodes.paragraph!.create(null, text ? schema.text(text) : undefined),
  );
  const doc = schema.nodes.doc!.create(null, [node, ...following]);
  const state = EditorState.create({ schema, doc, plugins: [nodeViewsPlugin] });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const view = new EditorView(host, { state });
  const dom = view.dom.querySelector("yaml-block") as HTMLElement;
  return { view, dom, destroy: () => { view.destroy(); host.remove(); } };
}

function mountWithParagraph(): {
  view: EditorView;
  dom: HTMLElement | null;
  destroy(): void;
} {
  const schema = makeSchema();
  const doc = schema.nodes.doc!.create(null, [schema.nodes.paragraph!.create()]);
  const state = EditorState.create({ schema, doc, plugins: [nodeViewsPlugin] });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const view = new EditorView(host, { state });
  const dom = view.dom.querySelector("yaml-block") as HTMLElement;
  return { view, dom, destroy: () => { view.destroy(); host.remove(); } };
}

/** 在已挂载的视图里把文档替换成空的 front_matter（此时才构造 NodeView）。 */
function insertFrontMatter(view: EditorView): HTMLElement {
  const schema = view.state.schema;
  const fm = schema.nodes.front_matter!.create();
  view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, fm));
  return view.dom.querySelector("yaml-block") as HTMLElement;
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** 点击第 index 行的键名单元进入编辑，返回其 key 输入框。 */
function openKeyEditor(dom: HTMLElement, index = 0): HTMLInputElement {
  const cell = dom.querySelectorAll(".fm-row .fm-key")[index] as HTMLElement;
  cell.click();
  const input = cell.querySelector(".fm-key-edit") as HTMLInputElement | null;
  if (!input) throw new Error("key editor not opened");
  return input;
}

/** 点击头部「添加属性」新增一行，返回新行 key 编辑输入框。 */
function openAddInput(dom: HTMLElement): HTMLInputElement {
  const addBtn = dom.querySelector(".fm-add-btn") as HTMLButtonElement;
  addBtn.click();
  const row = dom.querySelector(".fm-add-row") as HTMLElement | null;
  const input = row?.querySelector(".fm-key-edit") as HTMLInputElement | null;
  if (!row || !input) throw new Error("add row not opened");
  return input;
}

/** 模拟真实键入（触发 input 事件，联想浮层据此过滤）。 */
function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

/** 当前联想浮层里的候选项文本。 */
function suggestItems(dom: HTMLElement): string[] {
  return Array.from(dom.querySelectorAll(".fm-suggest-item")).map(
    (el) => el.textContent ?? "",
  );
}

describe("PropertiesView", () => {
  beforeEach(installViewModePort);

  afterEach(() => {
    vi.restoreAllMocks();
    configureViewMode(null);
    setTranslator(null);
  });

  it("面板模式渲染属性行，root 暴露 data-source/data-mode", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("title: Hello\ndraft: false");
    try {
      expect(dom.getAttribute("data-mode")).toBe("panel");
      expect(dom.getAttribute("data-source")).toBe("title: Hello\ndraft: false");
      const rows = dom.querySelectorAll(".fm-row");
      expect(rows.length).toBe(2);
      // 键名默认渲染为弱化文本（点击才进入编辑），非常驻 input。
      const keyCell = rows[0]!.querySelector(".fm-key") as HTMLElement;
      expect(keyCell.tagName.toLowerCase()).toBe("div");
      expect(keyCell.querySelector(".fm-key-label")!.textContent).toBe("title");
      expect(rows[0]!.querySelector(".fm-key-edit")).toBeNull();
      expect(rows[1]!.querySelector("input[type=checkbox]")).toBeTruthy();
      // 面板模式：面板可见、源码隐藏（互斥断言）。
      expect((dom.querySelector(".fm-panel") as HTMLElement).style.display).not.toBe("none");
      expect((dom.querySelector(".fm-source") as HTMLElement).style.display).toBe("none");
      // 非内容区（面板/右上角按钮组）显式不可编辑：属性名不会出现插入符或被选中。
      expect((dom.querySelector(".fm-panel") as HTMLElement).getAttribute("contenteditable")).toBe("false");
      expect((dom.querySelector(".fm-actions") as HTMLElement).getAttribute("contenteditable")).toBe("false");
    } finally {
      destroy();
    }
  });

  it("源码模式渲染可编辑原文（不再有 --- 围栏，contentDOM 直接作为唯一子节点）", () => {
    setViewMode("source");
    const { dom, destroy } = mount("title: Hello\n");
    try {
      expect(dom.getAttribute("data-mode")).toBe("source");
      // 源码模式：源码可见、面板隐藏（互斥断言）。
      expect((dom.querySelector(".fm-panel") as HTMLElement).style.display).toBe("none");
      const source = dom.querySelector(".fm-source") as HTMLElement;
      expect(source.style.display).not.toBe("none");
      // 外观对齐代码块：不再有围栏 chrome，contentDOM 就是源码容器的唯一子节点。
      expect(source.querySelectorAll(".fm-fence").length).toBe(0);
      expect(source.firstElementChild!.className).toBe("fm-source-body");
      expect(source.textContent).toBe("title: Hello\n");
      expect((dom.querySelector(".fm-source-body") as HTMLElement).getAttribute("contenteditable")).toBeNull();
    } finally {
      destroy();
    }
  });

  it("面板内编辑值经 setValue 写回节点文本，data-source 同步", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\n");
    try {
      const input = dom.querySelector(".fm-val .fm-input") as HTMLTextAreaElement;
      input.value = "Bye";
      input.dispatchEvent(new Event("change"));
      expect(view.state.doc.firstChild!.textContent).toBe("title: Bye\n");
      expect(dom.getAttribute("data-source")).toBe("title: Bye\n");
    } finally {
      destroy();
    }
  });

  it("值输入即（防抖）写回，且不重建面板（焦点保留、可继续输入）", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\n");
    vi.useFakeTimers();
    try {
      const input = dom.querySelector(".fm-val .fm-input") as HTMLTextAreaElement;
      input.value = "Bye";
      input.dispatchEvent(new Event("input"));
      // 防抖期内不写回。
      expect(view.state.doc.firstChild!.textContent).toBe("title: Hello\n");
      vi.advanceTimersByTime(300);
      expect(view.state.doc.firstChild!.textContent).toBe("title: Bye\n");
      // 面板未重建：同一元素仍在文档中（输入/焦点不被打断）。
      expect(dom.querySelector(".fm-val .fm-input")).toBe(input);
      // data-source 同步更新。
      expect(dom.getAttribute("data-source")).toBe("title: Bye\n");
    } finally {
      vi.useRealTimers();
      destroy();
    }
  });

  it("无尾换行的节点文本：编辑后仍无尾换行（避免序列化多出空行）", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello");
    try {
      const input = dom.querySelector(".fm-val .fm-input") as HTMLTextAreaElement;
      input.value = "Bye";
      input.dispatchEvent(new Event("change"));
      expect(view.state.doc.firstChild!.textContent).toBe("title: Bye");
      expect(dom.getAttribute("data-source")).toBe("title: Bye");
    } finally {
      destroy();
    }
  });

  it("最后一行值输入框按 Enter：提交后跳到属性块下方正文开头", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\n", ["body"]);
    try {
      const input = dom.querySelector(".fm-row .fm-val .fm-input") as HTMLTextAreaElement;
      input.focus();
      input.value = "Hi";
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe("title: Hi\n");
      const sel = view.state.selection;
      expect(sel.$from.parent.type.name).toBe("paragraph");
      expect(sel.$from.parent.textContent).toBe("body");
      expect(sel.$from.parentOffset).toBe(0);
      expect(document.activeElement).toBe(view.dom);
    } finally {
      destroy();
    }
  });

  it("最后一行值输入框按 Enter：块后无内容时补一个空段落并落笔其中", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      const input = dom.querySelector(".fm-row .fm-val .fm-input") as HTMLTextAreaElement;
      input.focus();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.childCount).toBe(2);
      const para = view.state.doc.child(1);
      expect(para.type.name).toBe("paragraph");
      expect(para.textContent).toBe("");
      const sel = view.state.selection;
      expect(sel.$from.parent).toBe(para);
      expect(sel.$from.parentOffset).toBe(0);
      expect(document.activeElement).toBe(view.dom);
    } finally {
      destroy();
    }
  });

  it("IME 组合期 Enter 不提交也不退出属性块", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\n", ["body"]);
    try {
      const input = dom.querySelector(".fm-row .fm-val .fm-input") as HTMLTextAreaElement;
      input.focus();
      // 不派发普通 input 事件：避免调度 300ms 防抖提交干扰「组合期未提交」断言。
      input.value = "Hi";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true }));
      expect(view.state.doc.firstChild!.textContent).toBe("title: Hello\n");
      expect(view.state.doc.childCount).toBe(2);
      expect(view.state.selection.$from.parent.type.name).toBe("front_matter");
      expect(document.activeElement).toBe(input);
    } finally {
      destroy();
    }
  });

  it("非最后一行值输入框按 Enter 只提交，不跳出属性块", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\nb: 2\n");
    try {
      const input = dom.querySelectorAll(".fm-row .fm-val .fm-input")[0] as HTMLTextAreaElement;
      input.focus();
      input.value = "2";
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe("a: 2\nb: 2\n");
      expect(view.state.doc.childCount).toBe(1);
      expect(document.activeElement).toBe(input);
    } finally {
      destroy();
    }
  });

  it("最后一行 Enter 跳过分隔线落到后续正文", () => {
    setViewMode("panel");
    const schema = makeSchema();
    const fm = schema.nodes.front_matter!.create(null, schema.text("a: 1\n"));
    const hr = schema.nodes.horizontal_rule!.create();
    const para = schema.nodes.paragraph!.create(null, schema.text("body"));
    const doc = schema.nodes.doc!.create(null, [fm, hr, para]);
    const state = EditorState.create({ schema, doc, plugins: [nodeViewsPlugin] });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const view = new EditorView(host, { state });
    try {
      const dom = view.dom.querySelector("yaml-block") as HTMLElement;
      const input = dom.querySelector(".fm-row .fm-val .fm-input") as HTMLTextAreaElement;
      input.focus();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.selection).toBeInstanceOf(TextSelection);
      expect(view.state.selection.$from.parent.textContent).toBe("body");
      expect(view.state.doc.child(1).type.name).toBe("horizontal_rule");
    } finally {
      view.destroy();
      host.remove();
    }
  });

  it("属性块后只有分隔线时 Enter 补段落且保留分隔线", () => {
    setViewMode("panel");
    const schema = makeSchema();
    const fm = schema.nodes.front_matter!.create(null, schema.text("a: 1\n"));
    const hr = schema.nodes.horizontal_rule!.create();
    const doc = schema.nodes.doc!.create(null, [fm, hr]);
    const state = EditorState.create({ schema, doc, plugins: [nodeViewsPlugin] });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const view = new EditorView(host, { state });
    try {
      const dom = view.dom.querySelector("yaml-block") as HTMLElement;
      const input = dom.querySelector(".fm-row .fm-val .fm-input") as HTMLTextAreaElement;
      input.focus();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.child(1).type.name).toBe("horizontal_rule");
      expect(view.state.doc.child(2).type.name).toBe("paragraph");
      expect(view.state.selection).toBeInstanceOf(TextSelection);
      expect(view.state.selection.$from.parent.type.name).toBe("paragraph");
    } finally {
      view.destroy();
      host.remove();
    }
  });

  it("末行是列表时，前面的单值输入行按 Enter 只提交，不跳出", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\ntags:\n  - a\n");
    try {
      const input = dom.querySelectorAll(".fm-row .fm-val .fm-input")[0] as HTMLTextAreaElement;
      input.focus();
      input.value = "Hi";
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toContain("title: Hi");
      expect(view.state.doc.childCount).toBe(1);
      expect(document.activeElement).toBe(input);
    } finally {
      destroy();
    }
  });

  it("末行是 tag 时，空输入 Enter 跳出属性块", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\ntags:\n  - a\n");
    try {
      const input = dom.querySelector(".fm-chips .fm-add-input") as HTMLInputElement;
      input.focus();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toContain("tags:");
      expect(view.state.doc.firstChild!.textContent).toContain("  - a");
      expect(view.state.doc.childCount).toBe(2);
      expect(view.state.doc.child(1).type.name).toBe("paragraph");
      expect(view.state.selection).toBeInstanceOf(TextSelection);
      expect(view.state.selection.$from.parent.type.name).toBe("paragraph");
      expect(document.activeElement).toBe(view.dom);
    } finally {
      destroy();
    }
  });

  it("末行是 tag 时，仅空白输入 Enter 同样退出并清空输入", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("tags:\n  - a\n");
    try {
      const input = dom.querySelector(".fm-chips .fm-add-input") as HTMLInputElement;
      input.focus();
      input.value = "   ";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.childCount).toBe(2);
      expect(view.state.doc.child(1).type.name).toBe("paragraph");
      expect(document.activeElement).toBe(view.dom);
      expect(input.value).toBe("");
    } finally {
      destroy();
    }
  });

  it("锁定态 tag 空 Enter 不退出属性块", async () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("tags:\n  - a\n");
    try {
      view.dom.setAttribute("contenteditable", "false");
      await new Promise((resolve) => setTimeout(resolve, 0));
      const input = dom.querySelector(".fm-chips .fm-add-input") as HTMLInputElement;
      input.focus();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.childCount).toBe(1);
      expect(document.activeElement).toBe(input);
    } finally {
      destroy();
    }
  });

  it("tag 输入框 IME 组合期 Enter 不追加也不退出", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("tags:\n  - a\n");
    try {
      const input = dom.querySelector(".fm-chips .fm-add-input") as HTMLInputElement;
      input.focus();
      input.value = "b";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true }));
      expect(view.state.doc.firstChild!.textContent).toBe("tags:\n  - a\n");
      expect(view.state.doc.childCount).toBe(1);
      expect(document.activeElement).toBe(input);
    } finally {
      destroy();
    }
  });

  it("非最后 tag 行空输入 Enter 不退出属性块", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("tags:\n  - a\nstatus: draft\n");
    try {
      const input = dom.querySelector(".fm-chips .fm-add-input") as HTMLInputElement;
      input.focus();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.childCount).toBe(1);
      expect(document.activeElement).toBe(input);
    } finally {
      destroy();
    }
  });

  it("配置切换在 panel/source 间重渲染（互斥可见性 + data-mode）", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("title: Hello\n");
    try {
      const panel = dom.querySelector(".fm-panel") as HTMLElement;
      const source = dom.querySelector(".fm-source") as HTMLElement;
      expect(panel.style.display).not.toBe("none");
      expect(source.style.display).toBe("none");

      setViewMode("source");
      expect(dom.getAttribute("data-mode")).toBe("source");
      expect(panel.style.display).toBe("none");
      expect(source.style.display).not.toBe("none");

      setViewMode("panel");
      expect(dom.getAttribute("data-mode")).toBe("panel");
      expect(panel.style.display).not.toBe("none");
      expect(source.style.display).toBe("none");
    } finally {
      destroy();
    }
  });

  it("无效 YAML：面板模式显示告警且不渲染属性列表", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("a: [1, 2\n");
    try {
      expect(dom.querySelector(".fm-panel-warn")).toBeTruthy();
      expect(dom.querySelector(".fm-list")).toBeNull();
    } finally {
      destroy();
    }
  });

  it("stopEvent / ignoreMutation 作用域对齐既有惯例", () => {
    setViewMode("panel");
    const { view, destroy } = mount("title: Hello\n");
    const nv = makePropertiesView(view.state.doc.firstChild!, view, () => 0) as unknown as ViewUnderTest;
    try {
      const panel = nv.dom.querySelector(".fm-panel") as HTMLElement;

      // 面板内的交互交给本视图，不进 PM。
      expect(nv.stopEvent({ target: panel } as unknown as Event)).toBe(true);
      // 右上角按钮组在 panel 之外，同样不能交给 PM。
      expect(
        nv.stopEvent({ target: nv.dom.querySelector(".fm-actions") } as unknown as Event),
      ).toBe(true);
      expect(
        nv.stopEvent({ target: nv.dom.querySelector(".fm-toggle") } as unknown as Event),
      ).toBe(true);
      // 源码编辑区交给 PM。
      expect(nv.stopEvent({ target: nv.contentDOM } as unknown as Event)).toBe(false);

      // 根 / contentDOM 的属性变更由本视图自身造成，必须忽略。
      expect(
        nv.ignoreMutation({ type: "attributes", target: nv.dom } as unknown as ViewMutationRecord),
      ).toBe(true);
      expect(
        nv.ignoreMutation({ type: "attributes", target: nv.contentDOM } as unknown as ViewMutationRecord),
      ).toBe(true);
      // 源码编辑区内部的字符变更交给 PM。
      expect(
        nv.ignoreMutation({
          type: "characterData",
          target: nv.contentDOM.querySelector(".fm-source-body") ?? nv.contentDOM,
        } as unknown as ViewMutationRecord),
      ).toBe(false);
      // 面板等其余变更一律忽略。
      expect(
        nv.ignoreMutation({ type: "childList", target: panel } as unknown as ViewMutationRecord),
      ).toBe(true);
    } finally {
      nv.destroy();
      destroy();
    }
  });

  it("update 短路：文本未变不重建，文本变化同步 data-source", () => {
    setViewMode("panel");
    const { view, destroy } = mount("title: Hello\n");
    const nv = makePropertiesView(view.state.doc.firstChild!, view, () => 0) as unknown as ViewUnderTest;
    try {
      const listBefore = nv.dom.querySelector(".fm-list");
      expect(listBefore).toBeTruthy();

      // 同文本 update：不重建列表（引用不变）。
      nv.update(view.state.doc.firstChild!);
      expect(nv.dom.querySelector(".fm-list")).toBe(listBefore);

      // 文本变化：data-source 同步为新文本。
      const next = view.state.schema.nodes.front_matter!.create(
        null,
        view.state.schema.text("title: Bye\n"),
      );
      nv.update(next);
      expect(nv.dom.getAttribute("data-source")).toBe("title: Bye\n");
    } finally {
      nv.destroy();
      destroy();
    }
  });

  it("改键名写回 rename", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("myfield: Hello\n");
    try {
      const input = openKeyEditor(dom);
      input.value = "name";
      input.dispatchEvent(new Event("change"));
      expect(view.state.doc.firstChild!.textContent).toBe("name: Hello\n");
    } finally {
      destroy();
    }
  });

  it("非法键名被拒绝，不写回且还原为文本", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("myfield: Hello\n");
    try {
      const input = openKeyEditor(dom);
      input.value = "a: b";
      input.dispatchEvent(new Event("change"));
      expect(view.state.doc.firstChild!.textContent).toBe("myfield: Hello\n");
      // 回车/取消后回到文本态。
      expect(dom.querySelector(".fm-key-edit")).toBeNull();
      expect(dom.querySelector(".fm-key .fm-key-label")!.textContent).toBe("myfield");
    } finally {
      destroy();
    }
  });

  it("删除行写回 remove", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\nb: 2\n");
    try {
      const removeBtns = dom.querySelectorAll(".fm-row .fm-remove");
      (removeBtns[0] as HTMLButtonElement).click();
      expect(view.state.doc.firstChild!.textContent).toBe("b: 2\n");
    } finally {
      destroy();
    }
  });

  it("含首尾空白的键名被拒绝（不静默规范化）", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("myfield: Hello\n");
    try {
      const input = openKeyEditor(dom);
      input.value = " name";
      input.dispatchEvent(new Event("change"));
      expect(view.state.doc.firstChild!.textContent).toBe("myfield: Hello\n");
      expect(dom.querySelector(".fm-key .fm-key-label")!.textContent).toBe("myfield");
    } finally {
      destroy();
    }
  });

  it("Enter 提交改名", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("myfield: Hello\n");
    try {
      const input = openKeyEditor(dom);
      input.value = "name";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe("name: Hello\n");
    } finally {
      destroy();
    }
  });

  it("Escape 取消编辑，还原为文本", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("myfield: Hello\n");
    try {
      const input = openKeyEditor(dom);
      input.value = "name";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(view.state.doc.firstChild!.textContent).toBe("myfield: Hello\n");
      expect(dom.querySelector(".fm-key-edit")).toBeNull();
      expect(dom.querySelector(".fm-key .fm-key-label")!.textContent).toBe("myfield");
    } finally {
      destroy();
    }
  });

  it("键名编辑框内 mousedown 不被 preventDefault（可放置光标）", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("myfield: Hello\n");
    try {
      const input = openKeyEditor(dom);
      const onInput = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      input.dispatchEvent(onInput);
      expect(onInput.defaultPrevented).toBe(false);

      // 键名单元格本身（文本态）仍拦截 mousedown，避免 PM 抢占。
      const cell = dom.querySelector(".fm-key") as HTMLElement;
      const onCell = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      cell.dispatchEvent(onCell);
      expect(onCell.defaultPrevented).toBe(true);
    } finally {
      destroy();
    }
  });

  it("含 # 的键名被拒绝", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("myfield: Hello\n");
    try {
      const input = openKeyEditor(dom);
      input.value = "x#";
      input.dispatchEvent(new Event("change"));
      expect(view.state.doc.firstChild!.textContent).toBe("myfield: Hello\n");
      expect(dom.querySelector(".fm-key .fm-key-label")!.textContent).toBe("myfield");
    } finally {
      destroy();
    }
  });

  it("添加属性直接新增一行，key 列内联编辑（无需先填属性名）", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      const input = openAddInput(dom);
      // 新行立即出现：key 编辑框 + 空值列；文档尚未写入。
      const row = dom.querySelector(".fm-add-row") as HTMLElement;
      // 新行图标为「圆标 + 首字符」占位（输入前无字符）。
      const ico = row.querySelector(".fm-ico") as HTMLElement;
      expect(ico).toBeTruthy();
      expect(ico.classList.contains("fm-ico-letter")).toBe(true);
      expect(ico.textContent).toBe("");
      expect((input.parentElement as HTMLElement).className).toBe("fm-key");
      expect(input.value).toBe("");
      expect(input.placeholder).toBe("Property name");
      expect(view.state.doc.firstChild!.textContent).toBe("a: 1\n");
      // 重复点击不产生第二行。
      (dom.querySelector(".fm-add-btn") as HTMLButtonElement).click();
      expect(dom.querySelectorAll(".fm-add-row").length).toBe(1);
    } finally {
      destroy();
    }
  });

  it("新增行 Enter 提交写回 add", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      const input = openAddInput(dom);
      typeInto(input, "b"); // 模拟真实输入：无匹配候选 → 浮层收起，Enter 提交输入值
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe('a: 1\nb: ""\n');
      expect(dom.querySelector(".fm-add-row")).toBeNull();
    } finally {
      destroy();
    }
  });

  it("新增行：含空白键名被拒绝；空值/Escape 撤销该行", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      // 含首尾空白键名：拒绝且行撤销，文档不变。
      const input = openAddInput(dom);
      typeInto(input, " b"); // "b" 无匹配候选 → 浮层收起
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe("a: 1\n");
      expect(dom.querySelector(".fm-add-row")).toBeNull();

      // 空值 + Enter：撤销。
      openAddInput(dom).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe("a: 1\n");
      expect(dom.querySelector(".fm-add-row")).toBeNull();

      // Escape：即使已输入也撤销（用无候选输入，浮层未开，一次 Escape 即撤销）。
      const input3 = openAddInput(dom);
      typeInto(input3, "zzz");
      input3.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(view.state.doc.firstChild!.textContent).toBe("a: 1\n");
      expect(dom.querySelector(".fm-add-row")).toBeNull();
    } finally {
      destroy();
    }
  });

  it("新增行属性名联想：空属性名即列出候选，输入过滤、Enter 补全并提交", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      const input = openAddInput(dom);
      // 空属性名打开即列出候选（无需先输入）；不含文档里已存在的 key。
      expect((dom.querySelector(".fm-suggest") as HTMLElement).hidden).toBe(false);
      expect(suggestItems(dom)).toContain("title");
      expect(suggestItems(dom)).not.toContain("a");

      typeInto(input, "ti");
      expect((dom.querySelector(".fm-suggest") as HTMLElement).hidden).toBe(false);
      // "ti" 会同时匹配 description（子串），故只断言包含 title 且前缀命中排在前。
      expect(suggestItems(dom)[0]).toBe("title");
      // 匹配段用 <mark> 高亮。
      expect(dom.querySelector(".fm-suggest-item mark")!.textContent).toBe("ti");
      // 行首图标随输入更新：自定义名前是首字符圆标。
      expect((dom.querySelector(".fm-add-row .fm-ico") as HTMLElement).textContent).toBe("T");

      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(input.value).toBe("title");
      expect(view.state.doc.firstChild!.textContent).toBe('a: 1\ntitle: ""\n');
    } finally {
      destroy();
    }
  });

  it("新增行：空属性名可直接下拉选择（↓ 点亮 + Enter 采用）；裸 Enter 不误建", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      // 空输入直接 Enter：不采用第一个候选，撤销该行（文档不变）。
      openAddInput(dom).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe("a: 1\n");
      expect(dom.querySelector(".fm-add-row")).toBeNull();

      // 重新打开 → ↓ 点亮第一项（title）→ Enter 采用。
      const input = openAddInput(dom);
      expect(suggestItems(dom)[0]).toBe("title");
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe('a: 1\ntitle: ""\n');
    } finally {
      destroy();
    }
  });

  it("新增行属性名联想：Esc 先关浮层，再 Esc 才撤销该行", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      const input = openAddInput(dom);
      typeInto(input, "ti");
      expect((dom.querySelector(".fm-suggest") as HTMLElement).hidden).toBe(false);

      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect((dom.querySelector(".fm-suggest") as HTMLElement).hidden).toBe(true);
      expect(dom.querySelector(".fm-add-row")).not.toBeNull(); // 行未被撤销

      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(dom.querySelector(".fm-add-row")).toBeNull();
      expect(view.state.doc.firstChild!.textContent).toBe("a: 1\n");
    } finally {
      destroy();
    }
  });

  it("改名时联想：候选排除正在编辑自身的 key，且本文已有 key 优先", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("myfield: x\nother: y\n");
    try {
      const input = openKeyEditor(dom);
      typeInto(input, "ta");
      const items = suggestItems(dom);
      expect(items).toContain("tags"); // 内置兜底
      expect(items).not.toContain("myfield"); // 自身被排除
      // 补全后 Enter 提交改名。
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe("tags: x\nother: y\n");
    } finally {
      destroy();
    }
  });

  it("面板态渲染删除整块按钮，位于操作区最前", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("title: Hello\n");
    try {
      const actions = dom.querySelector(".fm-actions") as HTMLElement;
      const btn = actions.querySelector(".fm-delete-block") as HTMLButtonElement | null;
      expect(btn).not.toBeNull();
      expect(Array.from(actions.children)[0]).toBe(btn);
      expect(btn!.getAttribute("aria-label")).toBeTruthy();
    } finally {
      destroy();
    }
  });

  it("删除按钮使用与表格一致的动画图标（React 渲染的 14px SVG）", async () => {
    setViewMode("panel");
    const { dom, destroy } = mount("title: Hello\n");
    try {
      const btn = dom.querySelector(".fm-delete-block") as HTMLButtonElement;
      await vi.waitFor(() => {
        const svg = btn.querySelector("svg");
        expect(svg).not.toBeNull();
        expect(svg!.getAttribute("width")).toBe("14");
      });
      // 旧的手绘图标 class 不应再出现。
      expect(btn.querySelector(".fm-delete-icon")).toBeNull();
    } finally {
      destroy();
    }
  });

  it("点击删除整块：移除节点并把光标放到后一块开头", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\n", ["body"]);
    try {
      (dom.querySelector(".fm-delete-block") as HTMLButtonElement).click();
      expect(view.state.doc.childCount).toBe(1);
      const para = view.state.doc.child(0);
      expect(para.type.name).toBe("paragraph");
      expect(para.textContent).toBe("body");
      const sel = view.state.selection;
      expect(sel.$from.parent.type.name).toBe("paragraph");
      expect(sel.$from.parentOffset).toBe(0);
    } finally {
      destroy();
    }
  });

  it("删除唯一块后补一个空段落，光标落在其中", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      (dom.querySelector(".fm-delete-block") as HTMLButtonElement).click();
      expect(view.state.doc.childCount).toBe(1);
      const para = view.state.doc.child(0);
      expect(para.type.name).toBe("paragraph");
      expect(para.textContent).toBe("");
      const sel = view.state.selection;
      expect(sel.$from.parent.type.name).toBe("paragraph");
      expect(sel.$from.parentOffset).toBe(0);
    } finally {
      destroy();
    }
  });

  it("无效 YAML 时仍可删除整块", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("key: [1\n");
    try {
      expect(dom.querySelector(".fm-panel-warn")).not.toBeNull();
      (dom.querySelector(".fm-delete-block") as HTMLButtonElement).click();
      expect(view.state.doc.childCount).toBe(1);
      expect(view.state.doc.child(0).type.name).toBe("paragraph");
    } finally {
      destroy();
    }
  });

  it("删除整块跳过后续原子块", () => {
    setViewMode("panel");
    const schema = makeSchema();
    const fm = schema.nodes.front_matter!.create(null, schema.text("a: 1\n"));
    const hr = schema.nodes.horizontal_rule!.create();
    const doc = schema.nodes.doc!.create(null, [fm, hr]);
    const state = EditorState.create({ schema, doc, plugins: [nodeViewsPlugin] });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const view = new EditorView(host, { state });
    try {
      const dom = view.dom.querySelector("yaml-block") as HTMLElement;
      (dom.querySelector(".fm-delete-block") as HTMLButtonElement).click();
      expect(view.state.doc.childCount).toBe(2);
      expect(view.state.doc.child(0).type.name).toBe("horizontal_rule");
      expect(view.state.doc.child(1).type.name).toBe("paragraph");
      expect(view.state.selection).toBeInstanceOf(TextSelection);
      expect(view.state.selection.$from.parent.type.name).toBe("paragraph");
    } finally {
      view.destroy();
      host.remove();
    }
  });

  it("删除最后一个属性得到空节点文本", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\n");
    try {
      const btn = dom.querySelector(".fm-row .fm-remove") as HTMLButtonElement;
      btn.click();
      expect(view.state.doc.firstChild!.textContent).toBe("");
    } finally {
      destroy();
    }
  });

  it("删除块式列表 entry 移除整段", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("a: 1\ntags:\n  - x\n  - y\n");
    try {
      const removeBtns = dom.querySelectorAll(".fm-row .fm-remove");
      (removeBtns[1] as HTMLButtonElement).click();
      expect(view.state.doc.firstChild!.textContent).toBe("a: 1\n");
    } finally {
      destroy();
    }
  });

  it("破坏 YAML 的键名被拒绝（写回守卫）", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("myfield: Hello\n");
    try {
      const input = openKeyEditor(dom);
      input.value = "- a";
      input.dispatchEvent(new Event("change"));
      expect(view.state.doc.firstChild!.textContent).toBe("myfield: Hello\n");
      expect(dom.querySelector(".fm-key .fm-key-label")!.textContent).toBe("myfield");
    } finally {
      destroy();
    }
  });

  it("预设类型：tags/categories 恒按数组控件渲染（标量视为单元素，空值可输入）", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("tags: work\ncategories:\n");
    try {
      const rows = Array.from(dom.querySelectorAll(".fm-row"));
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row.querySelector(".fm-chips")).not.toBeNull();
        expect(row.querySelector("input.fm-input")).toBeNull(); // 不是单值文本输入
      }
      // 标量值按单个 tag 渲染。
      expect(rows[0]!.querySelectorAll(".fm-chip")).toHaveLength(1);
      expect(rows[0]!.querySelector(".fm-chip")!.textContent).toContain("work");
      // 空值 → 0 个 tag，但仍可输入。
      expect(rows[1]!.querySelectorAll(".fm-chip")).toHaveLength(0);
      expect(rows[1]!.querySelector(".fm-add-input")).not.toBeNull();
    } finally {
      destroy();
    }
  });

  it("数组值：常驻输入 Enter 追加 tag 并写回（保持块式）", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("tags:\n  - a\n");
    try {
      const input = dom.querySelector(".fm-chips .fm-add-input") as HTMLInputElement;
      input.value = "b";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(view.state.doc.firstChild!.textContent).toBe("tags:\n  - a\n  - b\n");
      // 追加 tag 后不退出属性块，焦点回到重建后的新 tag 输入框（支持连续输入）。
      expect(view.state.doc.childCount).toBe(1);
      expect((document.activeElement as HTMLElement).classList.contains("fm-add-input")).toBe(true);
    } finally {
      destroy();
    }
  });

  it("内置属性名在面板内锁定改名（点击不进入编辑），仍可删除、可切源码", () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("tags:\n  - a\nstatus: draft\n");
    try {
      const cells = Array.from(dom.querySelectorAll(".fm-row .fm-key")) as HTMLElement[];
      expect(cells).toHaveLength(2);
      for (const cell of cells) {
        expect(cell.classList.contains("fm-key-locked")).toBe(true);
        cell.click();
        expect(cell.querySelector(".fm-key-edit")).toBeNull(); // 不进入编辑态
      }
      // 删除仍是面板内可用入口。
      (dom.querySelectorAll(".fm-row .fm-remove")[0] as HTMLButtonElement).click();
      expect(view.state.doc.firstChild!.textContent).toBe("status: draft\n");
    } finally {
      destroy();
    }
  });

  it("编辑器锁定时整块只读（不可编辑/增删/切换源码），解锁后恢复", async () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\n");
    try {
      // 初始未锁定。
      expect(dom.getAttribute("data-locked")).toBe("false");
      expect((dom.querySelector(".fm-add-btn") as HTMLButtonElement).disabled).toBe(false);
      expect((dom.querySelector(".fm-toggle") as HTMLButtonElement).disabled).toBe(false);

      // 模拟编辑器锁定：PM 的 editable=false 反映为编辑器根 contenteditable=false。
      view.dom.setAttribute("contenteditable", "false");
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dom.getAttribute("data-locked")).toBe("true");
      expect((dom.querySelector(".fm-add-btn") as HTMLButtonElement).disabled).toBe(true);
      expect((dom.querySelector(".fm-toggle") as HTMLButtonElement).disabled).toBe(true);
      // 值控件只读、删除按钮不渲染、属性名不可进入编辑。
      expect((dom.querySelector(".fm-val .fm-input") as HTMLTextAreaElement).readOnly).toBe(true);
      expect(dom.querySelector(".fm-remove")).toBeNull();
      const keyCell = dom.querySelector(".fm-key") as HTMLElement;
      keyCell.click();
      expect(keyCell.querySelector(".fm-key-edit")).toBeNull();
      // 切换按钮已禁用：点击不改变模式。
      (dom.querySelector(".fm-toggle") as HTMLButtonElement).click();
      expect(dom.getAttribute("data-mode")).toBe("panel");
      // 「添加属性」已禁用：不产生新行。
      (dom.querySelector(".fm-add-btn") as HTMLButtonElement).click();
      expect(dom.querySelector(".fm-add-row")).toBeNull();

      // 解锁后恢复。
      view.dom.removeAttribute("contenteditable");
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(dom.getAttribute("data-locked")).toBe("false");
      expect((dom.querySelector(".fm-add-btn") as HTMLButtonElement).disabled).toBe(false);
      expect((dom.querySelector(".fm-val .fm-input") as HTMLTextAreaElement).readOnly).toBe(false);
      expect(dom.querySelector(".fm-remove")).not.toBeNull();
    } finally {
      destroy();
    }
  });

  it("锁定态禁用删除整块按钮且点击无效", async () => {
    setViewMode("panel");
    const { view, dom, destroy } = mount("title: Hello\n");
    try {
      const btn = dom.querySelector(".fm-delete-block") as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
      // 实时锁定守卫：MutationObserver 回调前立即点击也不得删除。
      view.dom.setAttribute("contenteditable", "false");
      btn.click();
      expect(view.state.doc.firstChild!.type.name).toBe("front_matter");
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(btn.disabled).toBe(true);
      btn.click();
      expect(view.state.doc.firstChild!.type.name).toBe("front_matter");
      // 解锁后恢复可点。
      view.dom.removeAttribute("contenteditable");
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(btn.disabled).toBe(false);
    } finally {
      destroy();
    }
  });

  it("源码模式仍提供删除整块按钮", () => {
    setViewMode("source");
    const { view, dom, destroy } = mount("title: Hello\n");
    try {
      expect(dom.querySelector(".fm-delete-block")).not.toBeNull();
      // 源码态不提供「添加属性」（面板专属，inline 隐藏）。
      expect((dom.querySelector(".fm-add-btn") as HTMLElement).style.display).toBe("none");
      expect(dom.querySelector(".fm-add-row")).toBeNull();
      // 删除整块在源码态同样可用。
      (dom.querySelector(".fm-delete-block") as HTMLButtonElement).click();
      expect(view.state.doc.childCount).toBe(1);
      expect(view.state.doc.child(0).type.name).toBe("paragraph");
      expect(view.state.doc.child(0).textContent).toBe("");
    } finally {
      destroy();
    }
  });

  it("行首图标按属性名给出：内置名用专属 SVG，自定义名用圆标首字符", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("title: Hello\nstatus: draft\ntags:\n  - a\n  - b\nMyField: 1\n");
    try {
      const rows = Array.from(dom.querySelectorAll(".fm-row"));
      expect(rows.length).toBe(4);
      const icoOf = (i: number) => rows[i]!.querySelector(".fm-ico") as HTMLElement;

      // 内置名：内联 SVG，且不同属性名形状不同（title 3 个子节点 / status 2）。
      for (const i of [0, 1, 2]) {
        const ico = icoOf(i);
        expect(ico.tagName.toLowerCase()).toBe("svg");
        expect(ico.children.length).toBeGreaterThan(0);
      }
      expect(icoOf(0).children.length).toBe(3);
      expect(icoOf(1).children.length).toBe(2);
      expect(icoOf(0).children.length).not.toBe(icoOf(1).children.length);

      // 自定义名：圆底 + 首字符（大写），不是 SVG。
      const custom = icoOf(3);
      expect(custom.tagName.toLowerCase()).toBe("span");
      expect(custom.classList.contains("fm-ico-letter")).toBe(true);
      expect(custom.textContent).toBe("M");
    } finally {
      destroy();
    }
  });

  it("别名命中内置图标（tag → tags）", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("tag:\n  - a\n");
    try {
      const ico = dom.querySelector(".fm-row .fm-ico") as HTMLElement;
      expect(ico.tagName.toLowerCase()).toBe("svg");
    } finally {
      destroy();
    }
  });

  it("时间类属性名：date 为日历（rect），created 为时钟（circle），形状可区分", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("date: 2024-01-01\ncreated: 2024-01-01T10:30\n");
    try {
      const rows = Array.from(dom.querySelectorAll(".fm-row"));
      expect(rows.length).toBe(2);
      const dateIco = rows[0]!.querySelector(".fm-ico") as SVGElement;
      const createdIco = rows[1]!.querySelector(".fm-ico") as SVGElement;
      // 日历：rect 表身、无圆；时钟：表盘圆、无 rect。
      expect(dateIco.querySelectorAll("circle").length).toBe(0);
      expect(dateIco.querySelectorAll("rect").length).toBe(1);
      expect(createdIco.querySelectorAll("circle").length).toBe(1);
      expect(createdIco.querySelectorAll("rect").length).toBe(0);
    } finally {
      destroy();
    }
  });

  it("切换按钮在面板 ⇄ 源码间双向切换", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("a: 1\n");
    try {
      // 结构护栏：切换按钮必须常驻在 panel/source 之外的按钮组（`.fm-actions`）内，
      // 否则切到源码后按钮随面板隐藏，回切路径消失（happy-dom 对 display:none 的
      // 元素 .click() 仍会触发，故仅靠行为断言锁不住该结构）。
      const assertResidentToggle = () => {
        const toggle = dom.querySelector(".fm-toggle") as HTMLButtonElement;
        expect(toggle.parentElement!.className).toBe("fm-actions");
        expect((dom.querySelector(".fm-panel") as HTMLElement).contains(toggle)).toBe(false);
        expect((dom.querySelector(".fm-source") as HTMLElement).contains(toggle)).toBe(false);
      };

      assertResidentToggle(); // 面板态
      (dom.querySelector(".fm-toggle") as HTMLButtonElement).click();
      expect(dom.getAttribute("data-mode")).toBe("source");
      assertResidentToggle(); // 源码态
      (dom.querySelector(".fm-toggle") as HTMLButtonElement).click();
      expect(dom.getAttribute("data-mode")).toBe("panel");
      assertResidentToggle(); // 回切面板态
    } finally {
      destroy();
    }
  });

  it("切换按钮使用 SVG 图标，两态图形不同且无文本（不折行）", () => {
    setViewMode("panel");
    const { dom, destroy } = mount("a: 1\n");
    try {
      const toggle = () => dom.querySelector(".fm-toggle") as HTMLElement;
      const pathsOf = () =>
        Array.from(toggle().querySelectorAll("path"))
          .map((p) => p.getAttribute("d"))
          .join("|");

      const panelSvg = toggle().querySelector("svg");
      expect(panelSvg).toBeTruthy();
      expect(panelSvg!.tagName.toLowerCase()).toBe("svg");
      // 按钮内不再是裸文本 `</>`（真机上会折行）。
      expect(toggle().textContent).toBe("");
      const panelPaths = pathsOf();
      expect(panelPaths).not.toBe("");

      toggle().click();
      expect(dom.getAttribute("data-mode")).toBe("source");
      expect(toggle().querySelector("svg")).toBeTruthy();
      expect(pathsOf()).not.toBe(panelPaths);
    } finally {
      destroy();
    }
  });

  it("新建空块后自动展开一行待输入属性并聚焦", async () => {
    setViewMode("panel");
    const { view, destroy } = mountWithParagraph();
    try {
      requestPendingPropertyRow(view);
      const dom = insertFrontMatter(view);
      await flush();
      const row = dom.querySelector(".fm-add-row") as HTMLElement | null;
      expect(row).not.toBeNull();
      const input = row!.querySelector(".fm-key-edit") as HTMLInputElement;
      expect(document.activeElement).toBe(input);
      input.value = "title";
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      // 空文本值按既有序列化写为 `key: ""`。
      expect(view.state.doc.firstChild!.textContent).toBe('title: ""');
      // 提交后焦点交给新行的值控件（输入框已随重建卸载）。
      await flush();
      const value = dom.querySelector(".fm-row .fm-val .fm-input") as HTMLTextAreaElement;
      expect(value).not.toBeNull();
      expect(document.activeElement).toBe(value);
    } finally {
      destroy();
    }
  });

  it("未请求时打开空块不自动展开待输入行", async () => {
    setViewMode("panel");
    const { dom, destroy } = mount("");
    try {
      await flush();
      expect(dom.querySelector(".fm-add-row")).toBeNull();
    } finally {
      destroy();
    }
  });

  it("待输入行只自动展开一次", async () => {
    setViewMode("panel");
    const first = mountWithParagraph();
    try {
      requestPendingPropertyRow(first.view);
      const dom = insertFrontMatter(first.view);
      await flush();
      expect(dom.querySelector(".fm-add-row")).not.toBeNull();
    } finally {
      first.destroy();
    }
    const second = mountWithParagraph();
    try {
      const dom = insertFrontMatter(second.view);
      await flush();
      expect(dom.querySelector(".fm-add-row")).toBeNull();
    } finally {
      second.destroy();
    }
  });

  it("标记按视图归属：其他视图的请求不会在本视图展开", async () => {
    setViewMode("panel");
    const a = mountWithParagraph();
    const b = mountWithParagraph();
    try {
      requestPendingPropertyRow(b.view);
      const domA = insertFrontMatter(a.view);
      await flush();
      expect(domA.querySelector(".fm-add-row")).toBeNull();
      // 标记仍归属 b，b 自己插入时消费并展开。
      const domB = insertFrontMatter(b.view);
      await flush();
      expect(domB.querySelector(".fm-add-row")).not.toBeNull();
    } finally {
      a.destroy();
      b.destroy();
    }
  });

  it("源码态消费标记后不泄漏到后续面板视图", async () => {
    setViewMode("source");
    const source = mountWithParagraph();
    try {
      requestPendingPropertyRow(source.view);
      const dom = insertFrontMatter(source.view);
      await flush();
      expect(dom.querySelector(".fm-add-row")).toBeNull();
    } finally {
      source.destroy();
    }
    setViewMode("panel");
    const panel = mountWithParagraph();
    try {
      const dom = insertFrontMatter(panel.view);
      await flush();
      expect(dom.querySelector(".fm-add-row")).toBeNull();
    } finally {
      panel.destroy();
    }
  });

  it("待输入行空键名 Enter 取消后焦点回到编辑器", async () => {
    setViewMode("panel");
    const { view, destroy } = mountWithParagraph();
    try {
      requestPendingPropertyRow(view);
      const dom = insertFrontMatter(view);
      await flush();
      const input = dom.querySelector(".fm-add-row .fm-key-edit") as HTMLInputElement;
      expect(document.activeElement).toBe(input);
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(dom.querySelector(".fm-add-row")).toBeNull();
      await flush();
      expect(document.activeElement).toBe(view.dom);
    } finally {
      destroy();
    }
  });

  it("待输入行失焦提交不抢焦点（用户已点到别处）", async () => {
    setViewMode("panel");
    const { view, destroy } = mountWithParagraph();
    try {
      requestPendingPropertyRow(view);
      const dom = insertFrontMatter(view);
      await flush();
      const input = dom.querySelector(".fm-add-row .fm-key-edit") as HTMLInputElement;
      typeInto(input, "title");
      input.blur();
      await flush();
      // 失焦提交写回成功，但不应把焦点夺回新行的值控件。
      expect(view.state.doc.firstChild!.textContent).toBe('title: ""');
      const value = dom.querySelector(".fm-row .fm-val .fm-input");
      expect(document.activeElement).not.toBe(value);
      expect(document.activeElement).toBe(document.body);
    } finally {
      destroy();
    }
  });

  it("clearPendingPropertyRow 只清除指定视图的待输入行标记", async () => {
    setViewMode("panel");
    const a = mountWithParagraph();
    const b = mountWithParagraph();
    try {
      requestPendingPropertyRow(a.view);
      // 清除其他视图不会影响本视图的标记。
      clearPendingPropertyRow(b.view);
      const domA = insertFrontMatter(a.view);
      await flush();
      expect(domA.querySelector(".fm-add-row")).not.toBeNull();

      // 清除本视图后不再展开。
      requestPendingPropertyRow(b.view);
      clearPendingPropertyRow(b.view);
      const domB = insertFrontMatter(b.view);
      await flush();
      expect(domB.querySelector(".fm-add-row")).toBeNull();
    } finally {
      a.destroy();
      b.destroy();
    }
  });

  it("真实 keymap 接线：--- + Enter 在面板态自动展开待输入行", async () => {
    setViewMode("panel");
    const schema = makeSchema();
    const para = schema.nodes.paragraph!.create(null, schema.text("---"));
    const doc = schema.nodes.doc!.create(null, [para]);
    const state = EditorState.create({
      schema,
      doc,
      selection: TextSelection.create(doc, 4),
      plugins: [nodeViewsPlugin],
    });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const view = new EditorView(host, { state });
    try {
      const enter = frontMatterSyntaxFeature.keymap!(schema).Enter!;
      // 与 prosemirror-keymap 一致：第三个参数传 view。
      enter(view.state, view.dispatch, view);
      expect(view.state.doc.firstChild!.type.name).toBe("front_matter");
      await flush();
      const dom = view.dom.querySelector("yaml-block") as HTMLElement;
      const row = dom.querySelector(".fm-add-row") as HTMLElement | null;
      expect(row).not.toBeNull();
      expect(document.activeElement).toBe(row!.querySelector(".fm-key-edit"));
    } finally {
      view.destroy();
      host.remove();
    }
  });

  it("转换事务被拒后标记被清理，不泄漏到同视图的下一次挂载", async () => {
    setViewMode("panel");
    const schema = makeSchema();
    const para = schema.nodes.paragraph!.create(null, schema.text("---"));
    const doc = schema.nodes.doc!.create(null, [para]);
    let reject = true;
    // EditorState.create 不接受 filterTransaction 字段（那是 PluginSpec），用插件承载过滤器。
    const rejectGuard = new Plugin({
      filterTransaction: (tr) => !(reject && tr.docChanged),
    });
    const state = EditorState.create({
      schema,
      doc,
      selection: TextSelection.create(doc, 4),
      plugins: [nodeViewsPlugin, rejectGuard],
    });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const view = new EditorView(host, { state });
    try {
      const enter = frontMatterSyntaxFeature.keymap!(schema).Enter!;
      reject = true;
      enter(view.state, view.dispatch, view);
      // 事务确被拒：文档仍是原段落（否则本用例测不到 finally 清理）。
      expect(view.state.doc.firstChild!.type.name).toBe("paragraph");
      reject = false;
      // 同一视图再插入空 front_matter：标记应已被 finally 清掉。
      const fm = schema.nodes.front_matter!.create();
      view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, fm));
      await flush();
      const dom = view.dom.querySelector("yaml-block") as HTMLElement;
      expect(dom.querySelector(".fm-add-row")).toBeNull();
    } finally {
      view.destroy();
      host.remove();
    }
  });

  it("Escape 取消待输入行后焦点回到编辑器", async () => {
    setViewMode("panel");
    const { view, destroy } = mountWithParagraph();
    try {
      requestPendingPropertyRow(view);
      const dom = insertFrontMatter(view);
      await flush();
      const input = dom.querySelector(".fm-add-row .fm-key-edit") as HTMLInputElement;
      expect(document.activeElement).toBe(input);
      // 第一次 Escape 只关联想浮层（行仍在）。
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect((dom.querySelector(".fm-suggest") as HTMLElement).hidden).toBe(true);
      expect(dom.querySelector(".fm-add-row")).not.toBeNull();
      // 第二次 Escape 才取消该行并回焦点。
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(dom.querySelector(".fm-add-row")).toBeNull();
      expect(document.activeElement).toBe(view.dom);
    } finally {
      destroy();
    }
  });
});
