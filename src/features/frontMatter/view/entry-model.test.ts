import { describe, expect, it } from "vitest";

import { parseEntries } from "./entry-model";

describe("parseEntries", () => {
  it("解析顶层标量键、值、行区间", () => {
    const r = parseEntries("title: 我的文章\ndate: 2024-01-01\n");
    expect(r.ok).toBe(true);
    expect(r.entries.map((e) => e.key)).toEqual(["title", "date"]);
    expect(r.entries[0]).toMatchObject({ type: "text", value: "我的文章", lines: [0, 1] });
    expect(r.entries[1]).toMatchObject({ type: "date", lines: [1, 2] });
  });

  it("推断 boolean / number / list（行内与块式）", () => {
    const r = parseEntries(
      ["draft: false", "priority: 3", "tags: [笔记, 设计]", "links:", "  - a", "  - b", ""].join("\n"),
    );
    expect(r.entries.find((e) => e.key === "draft")?.type).toBe("boolean");
    expect(r.entries.find((e) => e.key === "priority")?.type).toBe("number");
    expect(r.entries.find((e) => e.key === "tags")?.type).toBe("list");
    const links = r.entries.find((e) => e.key === "links")!;
    expect(links.type).toBe("list");
    expect(links.lines).toEqual([3, 6]); // 键行 + 两个续行
  });

  it("datetime 与 date 区分", () => {
    const r = parseEntries("a: 2024-01-01\nb: 2024-01-01T10:30\n");
    expect(r.entries[0]?.type).toBe("date");
    expect(r.entries[1]?.type).toBe("datetime");
  });

  it("date/datetime 的值保持字符串（JSON_SCHEMA，不产生 Date）", () => {
    const r = parseEntries("a: 2024-01-01\nb: 2024-01-01T10:30:00\n");
    expect(r.entries[0]?.type).toBe("date");
    expect(typeof r.entries[0]?.value).toBe("string");
    expect(r.entries[0]?.value).toBe("2024-01-01");
    expect(r.entries[1]?.type).toBe("datetime");
    expect(r.entries[1]?.value).toBe("2024-01-01T10:30:00");
  });

  it("同行尾注释被记录", () => {
    const r = parseEntries("title: x # 备注\n");
    expect(r.entries[0]?.trailingComment).toBe("# 备注");
  });

  it("值为空的键行也能拆出尾注释", () => {
    const r = parseEntries("title: # 备注\n");
    expect(r.entries[0]?.trailingComment).toBe("# 备注");
  });

  it("嵌套值 / 注释行 / 块标量标记为 complex", () => {
    expect(parseEntries("meta:\n  a: 1\n").entries[0]?.complex).toBe(true);
    expect(parseEntries("title: x\n# 顶格注释\n").entries[0]?.complex).toBe(false); // 注释行不属于 entry
    expect(parseEntries("desc: |\n  line1\n  line2\n").entries[0]?.complex).toBe(true);
  });

  it("空 body：无 entry", () => {
    expect(parseEntries("").entries).toEqual([]);
  });

  it("顶层非键行（注释/空行）不产出 entry", () => {
    const r = parseEntries("# 注释\n\ntitle: x\n");
    expect(r.entries.map((e) => e.key)).toEqual(["title"]);
    expect(r.entries[0]?.lines).toEqual([2, 3]);
  });

  it("引号内的 # 不视为注释", () => {
    expect(parseEntries('title: "a # b"\n').entries[0]?.trailingComment).toBeUndefined();
    expect(parseEntries("title: 'a # b'\n").entries[0]?.trailingComment).toBeUndefined();
  });

  it("纯量中的撇号不影响尾注释识别", () => {
    expect(parseEntries("title: it's # 备注\n").entries[0]?.trailingComment).toBe("# 备注");
    expect(parseEntries('note: he said "hi # tail\n').entries[0]?.trailingComment).toBe("# tail");
  });

  it("单引号标量内的 '' 转义不误闭合", () => {
    expect(parseEntries("title: 'a'' # b' # tail\n").entries[0]?.trailingComment).toBe("# tail");
  });

  it("带时间的 ISO 值即使落在 UTC 零点也判为 datetime", () => {
    expect(parseEntries("a: 2024-01-01T00:00:00Z\n").entries[0]?.type).toBe("datetime");
    expect(parseEntries("a: 2024-01-01 00:00:00\n").entries[0]?.type).toBe("datetime");
  });

  it("非法 YAML：ok=false 且 entry 退化为 raw/complex", () => {
    const r = parseEntries("a: [1, 2\n");
    expect(r.ok).toBe(false);
    expect(r.entries[0]).toMatchObject({ type: "raw", complex: true });
  });

  it("CRLF body：eol 记录为 \\r\\n", () => {
    const r = parseEntries("title: x # c\r\nb: 2\r\n");
    expect(r.eol).toBe("\r\n");
    expect(r.entries[0]?.trailingComment).toBe("# c");
  });

  it("记录 body 是否以换行结尾（供回写保留尾换行）", () => {
    expect(parseEntries("a: 1\n").trailingNewline).toBe(true);
    expect(parseEntries("a: 1").trailingNewline).toBe(false);
  });

  it("缩进注释行使该 entry 退化为 complex", () => {
    expect(parseEntries("meta:\n  # c\n  a: 1\n").entries[0]?.complex).toBe(true);
  });
});
