import { describe, expect, it, vi } from "vitest";

import { buildValueControl } from "./controls";
import type { Entry } from "./types";

/** 最小 Entry；仅覆写用例关心的字段。 */
function makeEntry(overrides: Partial<Entry> & Pick<Entry, "type">): Entry {
  return {
    key: "k",
    lines: [0, 1],
    raw: "",
    value: undefined,
    complex: false,
    ...overrides,
  };
}

describe("buildValueControl", () => {
  it("text → textarea.fm-input（长内容可换行），带初值", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "text", value: "hi" }), { commit });
    expect(el.tagName).toBe("TEXTAREA");
    expect(el.classList.contains("fm-input")).toBe(true);
    expect(el.getAttribute("rows")).toBe("1");
    expect((el as HTMLTextAreaElement).value).toBe("hi");
  });

  it("text：输入后防抖提交（无需失焦）；IME 组合期间不提交", () => {
    vi.useFakeTimers();
    try {
      const commit = vi.fn();
      const el = buildValueControl(makeEntry({ type: "text", value: "hi" }), { commit });
      (el as HTMLTextAreaElement).value = "bye";
      el.dispatchEvent(new Event("input"));
      expect(commit).not.toHaveBeenCalled(); // 防抖期内不提交
      vi.advanceTimersByTime(300);
      expect(commit).toHaveBeenCalledWith("bye");

      // IME 组合期间（中文输入未上屏）不提交。
      const commit2 = vi.fn();
      const el2 = buildValueControl(makeEntry({ type: "text", value: "x" }), { commit: commit2 });
      (el2 as HTMLTextAreaElement).value = "nihao";
      const composing = new Event("input");
      Object.defineProperty(composing, "isComposing", { value: true });
      el2.dispatchEvent(composing);
      vi.advanceTimersByTime(500);
      expect(commit2).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("text：提交后基线更新（把值改回旧值仍会写回）", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "text", value: "hi" }), { commit });
    const ta = el as HTMLTextAreaElement;
    ta.value = "bye";
    el.dispatchEvent(new Event("change"));
    expect(commit).toHaveBeenLastCalledWith("bye");
    ta.value = "hi"; // 改回旧值
    el.dispatchEvent(new Event("change"));
    expect(commit).toHaveBeenLastCalledWith("hi");
    expect(commit).toHaveBeenCalledTimes(2);
  });
  it("text：Enter 提交（不插入换行）", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "text", value: "hi" }), { commit });
    (el as HTMLTextAreaElement).value = "bye";
    const enter = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
    el.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(commit).toHaveBeenCalledWith("bye");
  });

  it("number → input[type=number]", () => {
    const el = buildValueControl(makeEntry({ type: "number", value: 3 }), { commit: vi.fn() });
    expect(el.classList.contains("fm-input")).toBe(true);
    expect((el as HTMLInputElement).type).toBe("number");
    expect((el as HTMLInputElement).value).toBe("3");
  });

  it("date → input[type=date]", () => {
    const el = buildValueControl(makeEntry({ type: "date", value: "2024-01-01" }), { commit: vi.fn() });
    expect((el as HTMLInputElement).type).toBe("date");
    expect((el as HTMLInputElement).value).toBe("2024-01-01");
  });

  it("datetime → input[type=datetime-local]", () => {
    const el = buildValueControl(makeEntry({ type: "datetime", value: "2024-01-01T10:30" }), {
      commit: vi.fn(),
    });
    expect((el as HTMLInputElement).type).toBe("datetime-local");
  });

  it("datetime 无时区时用 datetime-local 并回填", () => {
    const el = buildValueControl(makeEntry({ type: "datetime", value: "2024-01-01T10:30" }), {
      commit: () => {},
    }) as HTMLInputElement;
    expect(el.type).toBe("datetime-local");
    expect(el.value).toBe("2024-01-01T10:30");
  });

  it("datetime 带时区/偏移时降级为文本，值不丢", () => {
    const el = buildValueControl(makeEntry({ type: "datetime", value: "2024-01-01T00:00:00Z" }), {
      commit: () => {},
    }) as HTMLInputElement;
    expect(el.type).toBe("text");
    expect(el.value).toBe("2024-01-01T00:00:00Z");
  });

  it("形状合法但语义非法的日期降级为文本，值不清空", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "date", value: "2024-13-45" }), {
      commit,
    }) as HTMLInputElement;
    expect(el.type).toBe("text");
    expect(el.value).toBe("2024-13-45");
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(commit).not.toHaveBeenCalled();
  });

  it("零秒 datetime 归一化后未改动不提交", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "datetime", value: "2024-01-01T10:30:00" }), {
      commit,
    }) as HTMLInputElement;
    expect(el.type).toBe("datetime-local");
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(commit).not.toHaveBeenCalled();
  });

  it("boolean true → checkbox 已勾选", () => {
    const el = buildValueControl(makeEntry({ type: "boolean", value: true }), { commit: vi.fn() });
    const input = el as HTMLInputElement;
    expect(input.classList.contains("fm-checkbox")).toBe(true);
    expect(input.type).toBe("checkbox");
    expect(input.checked).toBe(true);
  });

  it("boolean false → checkbox 未勾选", () => {
    const el = buildValueControl(makeEntry({ type: "boolean", value: false }), { commit: vi.fn() });
    expect((el as HTMLInputElement).checked).toBe(false);
  });

  it("list → 胶囊容器 + 两个胶囊 + 常驻输入框（无添加按钮）", () => {
    const el = buildValueControl(makeEntry({ type: "list", value: ["a", "b"] }), { commit: vi.fn() });
    expect(el.classList.contains("fm-chips")).toBe(true);
    const chips = el.querySelectorAll(".fm-chip");
    expect(chips).toHaveLength(2);
    // 胶囊文本为其首个文本子节点（`×` 删除按钮是另一个子节点）。
    expect(chips[0]!.firstChild!.textContent).toBe("a");
    expect(chips[1]!.firstChild!.textContent).toBe("b");
    // 常驻输入框（无需点击展开），且没有独立添加按钮、不显示提示文案。
    const input = el.querySelector(".fm-add-input") as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input.placeholder).toBe("");
    expect(el.querySelectorAll(".fm-add-chip")).toHaveLength(0);
  });

  it("list 点击删除胶囊：以过滤后的数组提交", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "list", value: ["a", "b"] }), { commit });
    const x = el.querySelector(".fm-chip .fm-chip-x") as HTMLButtonElement;
    x.click();
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(["b"]);
  });

  it("list 常驻输入：Enter 追加非空值（trim 后）并清空输入框", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "list", value: ["a", "b"] }), { commit });
    const input = el.querySelector(".fm-add-input") as HTMLInputElement;
    input.value = "  c  ";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(["a", "b", "c"]);
    expect(input.value).toBe("");
  });

  it("list 空输入 Enter 触发 onEmptyEnter（仅空白同样触发；非空/组合期不触发）", () => {
    const commit = vi.fn();
    const onEmptyEnter = vi.fn();
    const el = buildValueControl(makeEntry({ type: "list", value: ["a"] }), {
      commit,
      onEmptyEnter,
    });
    const input = el.querySelector(".fm-add-input") as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onEmptyEnter).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();

    input.value = "   ";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onEmptyEnter).toHaveBeenCalledTimes(2);
    expect(commit).not.toHaveBeenCalled();
    expect(input.value).toBe("");

    input.value = "b";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onEmptyEnter).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledWith(["a", "b"]);

    input.value = "c";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true }));
    expect(onEmptyEnter).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("list 常驻输入：空值/仅空白不提交，Escape 清空输入", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "list", value: ["a"] }), { commit });
    const input = el.querySelector(".fm-add-input") as HTMLInputElement;

    // 空值 + Enter：不提交。
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(commit).not.toHaveBeenCalled();
    // 仅空白 + Enter：不提交。
    input.value = "   ";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(commit).not.toHaveBeenCalled();
    // Escape：清空输入，不提交。
    input.value = "c";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(commit).not.toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("complex → code.fm-raw-value，无 input，textContent 为 raw", () => {
    const el = buildValueControl(
      makeEntry({ type: "text", value: "x", complex: true, raw: "meta:\n  a: 1" }),
      { commit: vi.fn() },
    );
    expect(el.tagName).toBe("CODE");
    expect(el.classList.contains("fm-raw-value")).toBe(true);
    expect(el.querySelector("input")).toBeNull();
    expect(el.textContent).toBe("meta:\n  a: 1");
  });

  it("type raw → code.fm-raw-value", () => {
    const el = buildValueControl(makeEntry({ type: "raw", raw: "a: [1, 2" }), { commit: vi.fn() });
    expect(el.tagName).toBe("CODE");
    expect(el.classList.contains("fm-raw-value")).toBe(true);
    expect(el.querySelector("input")).toBeNull();
    expect(el.textContent).toBe("a: [1, 2");
  });

  it("text：改动后派发 change → commit 新值", () => {
    const commit = vi.fn();
    const input = buildValueControl(makeEntry({ type: "text", value: "hi" }), {
      commit,
    }) as HTMLInputElement;
    input.value = "bye";
    input.dispatchEvent(new Event("change"));
    expect(commit).toHaveBeenCalledWith("bye");
  });

  it("text：按 Enter 提交当前值", () => {
    const commit = vi.fn();
    const input = buildValueControl(makeEntry({ type: "text", value: "hi" }), {
      commit,
    }) as HTMLInputElement;
    input.value = "pressed";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(commit).toHaveBeenCalledWith("pressed");
  });

  it("未改动时 change 不提交", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "text", value: "hi" }), { commit }) as HTMLInputElement;
    el.dispatchEvent(new Event("change"));
    expect(commit).not.toHaveBeenCalled();
  });

  it("number 非空改动提交数字", () => {
    const commit = vi.fn();
    const el = buildValueControl(makeEntry({ type: "number", value: 1 }), { commit }) as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new Event("change"));
    expect(commit).toHaveBeenCalledWith(5);
  });

  it("number：清空后 change → commit(null)", () => {
    const commit = vi.fn();
    const input = buildValueControl(makeEntry({ type: "number", value: 3 }), {
      commit,
    }) as HTMLInputElement;
    input.value = "";
    input.dispatchEvent(new Event("change"));
    expect(commit).toHaveBeenCalledWith(null);
  });

  it("boolean：change → commit 当前勾选状态", () => {
    const commit = vi.fn();
    const input = buildValueControl(makeEntry({ type: "boolean", value: false }), {
      commit,
    }) as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event("change"));
    expect(commit).toHaveBeenCalledWith(true);
  });
});
