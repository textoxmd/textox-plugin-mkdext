import { describe, expect, it, vi } from "vitest";

import { BUILTIN_KEYS } from "./key-presets";
import { attachKeySuggest, collectKeyCandidates, filterCandidates } from "./key-suggest";
import type { Entry } from "./types";

const entry = (key: string): Entry => ({
  key,
  lines: [0, 1],
  raw: `${key}: x`,
  type: "text",
  value: "x",
  complex: false,
});

describe("collectKeyCandidates", () => {
  it("文档已有 key 在前，内置兜底，去重并排除正在编辑自身的 key", () => {
    const out = collectKeyCandidates([entry("tags"), entry("title")], "title", ["title", "status"]);
    expect(out).toEqual(["tags", "status"]);
  });

  it("无文档 key 时给出内置清单", () => {
    expect(collectKeyCandidates([], "", ["a", "b"])).toEqual(["a", "b"]);
  });

  it("内置清单含常见属性名（对齐 Hugo/Jekyll/Obsidian 惯例）", () => {
    const out = collectKeyCandidates([], "");
    for (const key of ["title", "status", "tags", "priority", "date", "author"]) {
      expect(out).toContain(key);
    }
    expect(out).toEqual(expect.arrayContaining([...BUILTIN_KEYS]));
  });
});

describe("filterCandidates", () => {
  const all = ["title", "tags", "subtitle", "type"];

  it("空 query 返回全部候选（截断到 8）——空属性名也能直接下拉", () => {
    expect(filterCandidates(all, "")).toEqual(["title", "tags", "subtitle", "type"]);
    expect(filterCandidates(all, "   ")).toEqual(["title", "tags", "subtitle", "type"]);
    const many = Array.from({ length: 12 }, (_, i) => `key${i}`);
    expect(filterCandidates(many, "")).toHaveLength(8);
  });

  it("前缀匹配优先于子串匹配", () => {
    expect(filterCandidates(all, "ti")).toEqual(["title", "subtitle"]);
    expect(filterCandidates(all, "ty")).toEqual(["type"]);
  });

  it("大小写不敏感", () => {
    expect(filterCandidates(all, "TI")).toEqual(["title", "subtitle"]);
  });

  it("最多返回 8 项", () => {
    const many = Array.from({ length: 12 }, (_, i) => `key${i}`);
    expect(filterCandidates(many, "key")).toHaveLength(8);
  });
});

function setup(candidates: readonly string[] = ["title", "status", "tags"]) {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const input = document.createElement("input");
  root.appendChild(input);
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  const handle = attachKeySuggest(input, {
    container: root,
    candidates: () => [...candidates],
    onSubmit,
    onCancel,
  });
  const type = (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event("input"));
  };
  const press = (key: string) =>
    input.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true }));
  const list = () => root.querySelector(".fm-suggest") as HTMLElement;
  const texts = () =>
    Array.from(root.querySelectorAll(".fm-suggest-item")).map((el) => el.textContent);
  const activeText = () =>
    (root.querySelector(".fm-suggest-item.is-active") as HTMLElement | null)?.textContent ?? null;
  return { root, input, handle, type, press, list, texts, activeText, onSubmit, onCancel };
}

describe("attachKeySuggest", () => {
  it("open() 后空输入即列出候选；空输入 Enter 不采用，先 ↑↓ 选择才采用", () => {
    const { input, handle, press, list, texts, activeText, onSubmit } = setup();
    // 未 open 时保持关闭；open() 后空输入列出全部候选。
    expect(list().hidden).toBe(true);
    handle.open();
    expect(list().hidden).toBe(false);
    expect(texts()).toEqual(["title", "status", "tags"]);
    expect(activeText()).toBe("title");

    // 空输入直接 Enter：不采用候选，只按提交（由调用方处理空值）。
    press("Enter");
    expect(input.value).toBe("");
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // 空输入 + ↓（点亮第一项）+ Enter：采用第一项。
    const second = setup();
    second.handle.open();
    second.press("ArrowDown");
    second.press("Enter");
    expect(second.input.value).toBe("title");
  });

  it("输入即过滤并高亮匹配段；无匹配时收起浮层", () => {
    const { type, list, texts, root } = setup();
    expect(list().hidden).toBe(true);

    type("ti");
    expect(list().hidden).toBe(false);
    expect(texts()).toEqual(["title"]);
    expect(root.querySelector(".fm-suggest-item mark")!.textContent).toBe("ti");

    type("zzz");
    expect(list().hidden).toBe(true);
    expect(texts()).toEqual([]);
  });

  it("↑↓ 移动高亮项", () => {
    // 候选刻意用「仅 title 以 t 开头、且其余项不含 t」的集合，避免前缀/子串排序干扰断言。
    const { type, press, activeText, texts } = setup(["title", "status", "alpha"]);
    type("t");
    expect(texts()).toEqual(["title", "status"]);
    expect(activeText()).toBe("title");
    press("ArrowDown");
    expect(activeText()).toBe("status");
    press("ArrowUp");
    expect(activeText()).toBe("title");
    press("ArrowUp"); // 循环到末尾
    expect(activeText()).toBe("status");
  });

  it("Enter 采用高亮项并提交；Tab 仅采用不提交", () => {
    const { input, type, press, list, onSubmit } = setup();
    type("t");
    press("Enter");
    expect(input.value).toBe("title");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(list().hidden).toBe(true);

    const tab = setup();
    tab.type("t");
    tab.press("Tab");
    expect(tab.input.value).toBe("title");
    expect(tab.onSubmit).not.toHaveBeenCalled();
  });

  it("IME 组合期 Enter 不提交", () => {
    const { input, type, list, onSubmit } = setup();
    type("t");
    expect(list().hidden).toBe(false);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", isComposing: true, cancelable: true }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    // 浮层不被关闭、候选不被采用。
    expect(list().hidden).toBe(false);
  });

  it("IME 组合期 keyCode 229 兜底：Enter 不提交", () => {
    const { input, type, list, onSubmit } = setup();
    type("t");
    expect(list().hidden).toBe(false);
    const event = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
    Object.defineProperty(event, "keyCode", { value: 229 });
    input.dispatchEvent(event);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(list().hidden).toBe(false);
  });

  it("Escape：先关浮层（不取消），再按才触发取消", () => {
    const { type, press, list, onCancel } = setup();
    type("ti");
    press("Escape");
    expect(list().hidden).toBe(true);
    expect(onCancel).not.toHaveBeenCalled();

    press("Escape");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("点击候选项（mousedown）采用并提交", () => {
    const { type, texts, onSubmit, root, input } = setup();
    type("t");
    expect(texts()).toContain("status");
    const item = Array.from(root.querySelectorAll(".fm-suggest-item")).find(
      (el) => el.textContent === "status",
    ) as HTMLElement;
    item.dispatchEvent(new MouseEvent("mousedown", { cancelable: true }));
    expect(input.value).toBe("status");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("destroy 移除浮层与监听", () => {
    const { type, root, handle, input, onSubmit } = setup();
    type("t");
    expect(root.querySelector(".fm-suggest")).not.toBeNull();
    handle.destroy();
    expect(root.querySelector(".fm-suggest")).toBeNull();
    input.value = "ti";
    input.dispatchEvent(new Event("input"));
    expect(root.querySelector(".fm-suggest")).toBeNull();
    expect(input.getAttribute("aria-expanded")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
