import { describe, expect, it } from "vitest";

import { parseEntries } from "./entry-model";
import { applyEdit } from "./splice";

function apply(body: string, action: Parameters<typeof applyEdit>[1]): string | null {
  return applyEdit(parseEntries(body), action);
}

describe("applyEdit", () => {
  it("改标量值：只重写该行，保留其它行与顺序", () => {
    const body = "title: old\nauthor: Ada\ndate: 2024-01-01\n";
    expect(apply(body, { kind: "setValue", key: "title", value: "new", type: "text" })).toBe(
      "title: new\nauthor: Ada\ndate: 2024-01-01\n",
    );
  });

  it("改值保留同行尾注释", () => {
    const body = "title: old # keep\n";
    expect(apply(body, { kind: "setValue", key: "title", value: "new", type: "text" })).toBe(
      "title: new # keep\n",
    );
  });

  it("改名只动键名", () => {
    expect(apply("title: x\n", { kind: "rename", key: "title", nextKey: "name" })).toBe("name: x\n");
  });

  it("删除 entry 移除其整段行", () => {
    const body = "a: 1\nb:\n  - x\n  - y\nc: 3\n";
    expect(apply(body, { kind: "remove", key: "b" })).toBe("a: 1\nc: 3\n");
  });

  it("新增追加到末尾", () => {
    expect(apply("a: 1\n", { kind: "add", key: "b", value: true, type: "boolean" })).toBe(
      "a: 1\nb: true\n",
    );
  });

  it("块式列表改值保持块式", () => {
    const body = "tags:\n  - a\n  - b\n";
    expect(apply(body, { kind: "setValue", key: "tags", value: ["x", "y"], type: "list" })).toBe(
      "tags:\n  - x\n  - y\n",
    );
  });

  it("行内列表改值保持行内", () => {
    expect(apply("tags: [a, b]\n", { kind: "setValue", key: "tags", value: ["x"], type: "list" })).toBe(
      "tags: [x]\n",
    );
  });

  it("含冒号/井号的文本值加引号", () => {
    expect(apply("t: a\n", { kind: "setValue", key: "t", value: "a: b # c", type: "text" })).toBe(
      't: "a: b # c"\n',
    );
  });

  it("复数数字/布尔/日期序列化", () => {
    expect(apply("a: 1\n", { kind: "setValue", key: "a", value: 3, type: "number" })).toBe("a: 3\n");
    expect(apply("a: 1\n", { kind: "setValue", key: "a", value: false, type: "boolean" })).toBe("a: false\n");
    expect(apply("a: 1\n", { kind: "setValue", key: "a", value: "2024-05-06", type: "date" })).toBe("a: 2024-05-06\n");
  });

  it("复杂 entry 不可写回：返回 null", () => {
    expect(apply("meta:\n  a: 1\n", { kind: "setValue", key: "meta", value: "x", type: "text" })).toBeNull();
  });

  it("CRLF body 保持 CRLF", () => {
    expect(apply("a: 1\r\nb: 2\r\n", { kind: "setValue", key: "a", value: "x", type: "text" })).toBe(
      "a: x\r\nb: 2\r\n",
    );
  });

  it("数字/布尔形态的文本值加引号以保持字符串类型", () => {
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "9", type: "text" })).toBe('a: "9"\n');
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "007", type: "text" })).toBe('a: "007"\n');
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "true", type: "text" })).toBe('a: "true"\n');
  });

  it("行内列表项含逗号时加引号，避免被拆成多项", () => {
    expect(apply("tags: [a]\n", { kind: "setValue", key: "tags", value: ["x, y"], type: "list" })).toBe(
      'tags: ["x, y"]\n',
    );
  });

  it("以 - / ? 空格开头的文本加引号", () => {
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "- foo", type: "text" })).toBe('a: "- foo"\n');
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "? q", type: "text" })).toBe('a: "? q"\n');
  });

  it("文本同时含单双引号时正确转义", () => {
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: `it's "q"`, type: "text" })).toBe(
      'a: "it\'s \\"q\\""\n',
    );
  });

  it("文本含换行时转义为 \\n", () => {
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "l1\nl2", type: "text" })).toBe(
      'a: "l1\\nl2"\n',
    );
  });

  it("数字值清空（null）写为空值", () => {
    expect(apply("a: 1\n", { kind: "setValue", key: "a", value: null, type: "number" })).toBe("a:\n");
  });

  it("删除唯一 entry 得到空 body", () => {
    expect(apply("a: 1\n", { kind: "remove", key: "a" })).toBe("");
  });

  it("无尾换行的 body 回写后仍无尾换行（避免序列化多出空行）", () => {
    expect(apply("title: old\nauthor: Ada", { kind: "setValue", key: "title", value: "new", type: "text" })).toBe(
      "title: new\nauthor: Ada",
    );
    expect(apply("a: 1", { kind: "add", key: "b", value: 2, type: "number" })).toBe("a: 1\nb: 2");
  });

  it("整值为 - / ? 时加引号（标量与列表项）", () => {
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "-", type: "text" })).toBe('a: "-"\n');
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "?", type: "text" })).toBe('a: "?"\n');
    expect(apply("tags:\n  - a\n", { kind: "setValue", key: "tags", value: ["-"], type: "list" })).toBe(
      'tags:\n  - "-"\n',
    );
    expect(apply("tags: [a]\n", { kind: "setValue", key: "tags", value: ["?"], type: "list" })).toBe(
      'tags: ["?"]\n',
    );
  });

  it("文本含制表/回车等控制字符时转义", () => {
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "t\tab", type: "text" })).toBe('a: "t\\tab"\n');
    expect(apply("a: x\n", { kind: "setValue", key: "a", value: "c\rc", type: "text" })).toBe('a: "c\\rc"\n');
  });

  it("number 的 undefined/空串/非有限值写为空值", () => {
    expect(apply("a: 1\n", { kind: "setValue", key: "a", value: undefined, type: "number" })).toBe("a:\n");
    expect(apply("a: 1\n", { kind: "setValue", key: "a", value: "", type: "number" })).toBe("a:\n");
    expect(apply("a: 1\n", { kind: "setValue", key: "a", value: "abc", type: "number" })).toBe("a:\n");
  });
});
