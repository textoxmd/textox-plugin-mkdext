import { afterEach, describe, expect, it } from "vitest";
import { Schema } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";

import { frontMatterSyntaxFeature as feature } from "./feature";
import { configureViewMode } from "../view/mode";
import type { ViewMode } from "../view/types";

/** 静态视图模式端口：读固定值，写/订阅不参与（本文件只断言 Enter 的落点）。 */
function setViewMode(mode: ViewMode): void {
  configureViewMode({
    read: () => mode,
    write: () => {},
    subscribe: () => () => {},
  });
}

describe("frontMatterSyntaxFeature", () => {
  it("declares the front-matter feature and its schema node", () => {
    expect(feature.name).toBe("front-matter");
    expect(feature.nodes?.front_matter).toBeDefined();
  });

  it("wires the markdown-it rule, parser token, serializer handler and keymap", () => {
    expect(feature.mdItPlugins).toHaveLength(1);
    expect(typeof feature.parserTokens?.front_matter).toBe("function");
    expect(typeof feature.blockHandlers?.front_matter).toBe("function");
    expect(typeof feature.keymap).toBe("function");
  });

  it("serializes the node back to a fenced `---` block", () => {
    let captured = "";
    const state = {
      out: "",
      delim: "",
      write(s: string) {
        this.out += s;
      },
      tick() {},
      advance() {},
      closeBlock() {
        captured = this.out;
        this.out = "";
      },
    };
    const node = { textContent: "title: Hi" };
    feature.blockHandlers!.front_matter!(state as never, node as never);
    expect(captured).toBe("---\ntitle: Hi\n---");
  });
});

function makeSchema(): Schema {
  return new Schema({
    nodes: {
      doc: { content: "block+" },
      paragraph: { group: "block", content: "text*" },
      text: { group: "inline" },
      ...feature.nodes,
    },
  });
}

function dashState(schema: Schema): EditorState {
  const doc = schema.nodes.doc!.create(null, [
    schema.nodes.paragraph!.create(null, schema.text("---")),
  ]);
  // 光标置于 `---` 段落内
  return EditorState.create({ schema, doc, selection: TextSelection.create(doc, 2) });
}

afterEach(() => configureViewMode(null));

describe("Enter 转换的选区按视图模式", () => {
  it("面板模式：转换后补空段落并落笔于段落内", () => {
    setViewMode("panel");
    const schema = makeSchema();
    const state = dashState(schema);
    const enter = feature.keymap!(schema).Enter!;
    const dispatched: EditorState[] = [];
    const handled = enter(state, (tr) => dispatched.push(state.apply(tr)));
    expect(handled).toBe(true);
    const next = dispatched[0]!;
    // 结构：front_matter + 其后补出的空段落（避免整块选中被键入摧毁）。
    expect(next.doc.childCount).toBe(2);
    expect(next.doc.firstChild!.type.name).toBe("front_matter");
    expect(next.doc.child(1).type.name).toBe("paragraph");
    // 选区落在新段落内部（TextSelection），而非选中整块。
    expect(next.selection).toBeInstanceOf(TextSelection);
    expect(next.selection.$from.parent.type.name).toBe("paragraph");
    expect(next.selection.from).toBe(3);
  });

  it("面板模式：转换后键入字符落在新段落，front matter 文本不变", () => {
    setViewMode("panel");
    const schema = makeSchema();
    const state = dashState(schema);
    const enter = feature.keymap!(schema).Enter!;
    const dispatched: EditorState[] = [];
    enter(state, (tr) => dispatched.push(state.apply(tr)));
    const next = dispatched[0]!;
    const typed = next.apply(next.tr.insertText("x"));
    expect(typed.doc.firstChild!.type.name).toBe("front_matter");
    expect(typed.doc.firstChild!.textContent).toBe("");
    expect(typed.doc.child(1).textContent).toBe("x");
  });

  it("源码模式：转换后光标进入块内（TextSelection）", () => {
    setViewMode("source");
    const schema = makeSchema();
    const state = dashState(schema);
    const enter = feature.keymap!(schema).Enter!;
    const dispatched: EditorState[] = [];
    const handled = enter(state, (tr) => dispatched.push(state.apply(tr)));
    expect(handled).toBe(true);
    const next = dispatched[0]!;
    expect(next.selection).toBeInstanceOf(TextSelection);
    expect(next.selection.$from.parent.type.name).toBe("front_matter");
  });
});
