// 属性名联想（autocomplete）：输入即过滤的候选浮层，对齐 Obsidian 的属性名 suggest。
// 纯 DOM 实现、不依赖编辑器骨架；浮层挂在面板容器内，样式走主题 token（见 front-matter.css）。

import { BUILTIN_KEYS } from "./key-presets";
import type { Entry } from "./types";

/** 浮层最多显示的候选数。 */
const MAX_ITEMS = 8;

/**
 * 候选合并：当前文档已用属性名（按出现顺序，越靠前越贴近上下文）在前，内置常用名兜底；
 * 去重并排除 `excludeKey`（正在编辑自身的 key）。
 */
export function collectKeyCandidates(
  entries: readonly Entry[],
  excludeKey: string,
  builtin: readonly string[] = BUILTIN_KEYS,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([excludeKey]);
  const push = (key: string) => {
    if (key !== "" && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  };
  for (const entry of entries) push(entry.key);
  for (const key of builtin) push(key);
  return out;
}

/** 按 query 过滤：前缀匹配优先、其次子串匹配；空 query 返回全部（截断到 MAX_ITEMS）。大小写不敏感。 */
export function filterCandidates(all: readonly string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...all].slice(0, MAX_ITEMS);
  const starts: string[] = [];
  const contains: string[] = [];
  for (const key of all) {
    const lower = key.toLowerCase();
    if (lower.startsWith(q)) starts.push(key);
    else if (lower.includes(q)) contains.push(key);
  }
  return [...starts, ...contains].slice(0, MAX_ITEMS);
}

export interface KeySuggestOptions {
  /** 浮层挂载容器（需为定位上下文，见 CSS 的 `.fm-panel { position: relative }`）。 */
  container: HTMLElement;
  /** 全量候选（已去重、已排序）。 */
  candidates: () => string[];
  /** Enter 或点击候选项：采用当前值（高亮项已回填 input）后由调用方提交。 */
  onSubmit?: () => void;
  /** Esc 且浮层未打开时的回调（调用方据此撤销行 / 还原文本）。 */
  onCancel?: () => void;
}

export interface KeySuggestHandle {
  /** 打开浮层（按当前输入过滤；空输入列出全部候选）。 */
  open(): void;
  /** 关闭浮层（不影响输入框内容）。 */
  close(): void;
  /** 移除浮层与事件监听（输入框失焦/销毁时调用）。 */
  destroy(): void;
}

/**
 * 把输入框变成「带联想浮层」的属性名输入：
 * - 输入即过滤；空输入列出全部候选（新增属性时打开即可选）
 * - `↑ ↓` 移动、`Enter` 采用并提交、`Tab` 仅采用、`Esc` 先关浮层再撤销、点击项采用并提交
 * - 空输入时 `Enter` 不采用候选（避免误建第一个候选），需先 `↑ ↓` 显式选择
 */
export function attachKeySuggest(
  input: HTMLInputElement,
  opts: KeySuggestOptions,
): KeySuggestHandle {
  let items: string[] = [];
  let active = 0;
  let open = false;
  /** 是否用 ↑↓ 显式选择过（空输入时 Enter 只在显式选择后才采用候选）。 */
  let navigated = false;

  const list = document.createElement("div");
  list.className = "fm-suggest";
  list.setAttribute("role", "listbox");
  list.hidden = true;

  const close = () => {
    open = false;
    items = [];
    active = 0;
    list.hidden = true;
    list.textContent = "";
    input.setAttribute("aria-expanded", "false");
  };

  /** 浮层贴在输入框下方，宽度随输入框（CSS 另设 min-width）。 */
  const position = () => {
    const box = opts.container.getBoundingClientRect();
    const rect = input.getBoundingClientRect();
    list.style.left = `${rect.left - box.left}px`;
    list.style.top = `${rect.bottom - box.top + 2}px`;
    list.style.width = `${rect.width}px`;
  };

  const render = () => {
    if (items.length === 0) {
      close();
      return;
    }
    const query = input.value.trim().toLowerCase();
    list.textContent = "";
    items.forEach((key, index) => {
      const item = document.createElement("div");
      item.className = index === active ? "fm-suggest-item is-active" : "fm-suggest-item";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", index === active ? "true" : "false");
      const at = query === "" ? -1 : key.toLowerCase().indexOf(query);
      if (at >= 0) {
        const mark = document.createElement("mark");
        mark.textContent = key.slice(at, at + query.length);
        item.append(
          document.createTextNode(key.slice(0, at)),
          mark,
          document.createTextNode(key.slice(at + query.length)),
        );
      } else {
        item.textContent = key;
      }
      // mousedown 而非 click：避免输入框先 blur（blur 会触发提交/销毁）。
      item.addEventListener("mousedown", (event) => {
        event.preventDefault();
        input.value = key;
        close();
        opts.onSubmit?.();
      });
      list.appendChild(item);
    });
    list.hidden = false;
    open = true;
    input.setAttribute("aria-expanded", "true");
    position();
  };

  const refresh = () => {
    items = filterCandidates(opts.candidates(), input.value);
    active = 0;
    navigated = false;
    render();
  };

  const onInput = () => refresh();

  const onKeyDown = (event: KeyboardEvent) => {
    // IME 组合期（含 Safari/WKWebView 的 keyCode 229）不处理按键。
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!open || items.length === 0) return;
      event.preventDefault();
      // 空输入时首次按键先「点亮」第一项（不移动），此后正常移动；非空输入直接移动。
      if (input.value.trim() === "" && !navigated) {
        navigated = true;
        render();
        return;
      }
      navigated = true;
      const step = event.key === "ArrowDown" ? 1 : items.length - 1;
      active = (active + step) % items.length;
      render();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      // 空输入且未显式选择时，不把第一个候选当成用户选择（避免误建属性）。
      const explicit = input.value.trim() !== "" || navigated;
      if (open && items.length > 0 && explicit) input.value = items[active];
      close();
      opts.onSubmit?.();
      return;
    }
    if (event.key === "Tab") {
      if (open && items.length > 0) {
        event.preventDefault();
        input.value = items[active];
      }
      close();
      return;
    }
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        close();
        return;
      }
      opts.onCancel?.();
    }
  };

  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");
  opts.container.appendChild(list);
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeyDown);

  return {
    open: refresh,
    close,
    destroy() {
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onKeyDown);
      input.removeAttribute("aria-autocomplete");
      input.removeAttribute("aria-expanded");
      list.remove();
      open = false;
      items = [];
      navigated = false;
    },
  };
}
