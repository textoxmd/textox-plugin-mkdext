import { Schema } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { describe, expect, it } from "vitest";

import { tocSyntaxFeature as feature } from "./feature";

function makeSchema() {
  return new Schema({
    nodes: {
      doc: { content: "block+" },
      paragraph: { group: "block", content: "inline*" },
      heading: { attrs: { level: { default: 1 } }, group: "block", content: "inline*" },
      blockquote: { group: "block", content: "block+", defining: true },
      text: { group: "inline" },
      toc: feature.nodes!.toc,
    },
  });
}

function docWithParagraph(text: string) {
  const schema = makeSchema();
  return {
    schema,
    doc: schema.node("doc", null, [schema.node("paragraph", null, schema.text(text))]),
  };
}

describe("tocSyntaxFeature", () => {
  it("declares the toc feature and wires its seams", () => {
    expect(feature.name).toBe("toc");
    expect(feature.nodes?.toc).toBeDefined();
    expect(feature.plugins?.(makeSchema())).toHaveLength(2);
    expect(typeof feature.parserPostProcess).toBe("function");
    expect(typeof feature.blockHandlers?.toc).toBe("function");
    expect(typeof feature.keymap).toBe("function");
  });

  it("parserPostProcess converts a top-level [toc] paragraph into a toc node", () => {
    const { doc } = docWithParagraph("[toc]");
    const out = feature.parserPostProcess!(doc);
    expect(out.childCount).toBe(1);
    expect(out.child(0).type.name).toBe("toc");
  });

  it("parserPostProcess accepts [TOC] and leaves other paragraphs untouched", () => {
    const upper = docWithParagraph("[TOC]");
    expect(feature.parserPostProcess!(upper.doc).child(0).type.name).toBe("toc");
    const other = docWithParagraph("hello");
    expect(feature.parserPostProcess!(other.doc).child(0).type.name).toBe("paragraph");
  });

  it("parserPostProcess only converts top-level [toc] paragraphs, not nested ones", () => {
    const schema = makeSchema();
    const inner = schema.node("paragraph", null, schema.text("[toc]"));
    const quote = schema.node("blockquote", null, [inner]);
    const doc = schema.node("doc", null, [quote]);
    const out = feature.parserPostProcess!(doc);
    expect(out.child(0).type.name).toBe("blockquote");
    expect(out.child(0).child(0).type.name).toBe("paragraph");
  });

  it("parserPostProcess returns the doc unchanged when the toc node is absent", () => {
    const schema = new Schema({
      nodes: {
        doc: { content: "block+" },
        paragraph: { group: "block", content: "inline*" },
        text: { group: "inline" },
      },
    });
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, schema.text("[toc]")),
    ]);
    expect(feature.parserPostProcess!(doc)).toBe(doc);
  });

  it("blockHandlers.toc writes the canonical [toc]", () => {
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
    feature.blockHandlers!.toc!(state as never, { type: { name: "toc" } } as never);
    expect(captured).toBe("[toc]");
  });

  it("keymap.Enter converts a [toc] paragraph into toc + empty paragraph", () => {
    const { schema, doc } = docWithParagraph("[toc]");
    let state = EditorState.create({ schema, doc });
    state = state.apply(state.tr.setSelection(TextSelection.atEnd(state.doc)));
    const handled = feature.keymap!(schema).Enter(state, (tr) => {
      state = state.apply(tr);
    });
    expect(handled).toBe(true);
    const names: string[] = [];
    state.doc.forEach((n) => names.push(n.type.name));
    expect(names).toEqual(["toc", "paragraph"]);
    expect(state.selection.$from.parent.type.name).toBe("paragraph");
    expect(state.selection.$from.parentOffset).toBe(0);
  });

  it("keymap.Enter leaves a non-[toc] paragraph alone", () => {
    const { schema, doc } = docWithParagraph("hello");
    let state = EditorState.create({ schema, doc });
    state = state.apply(state.tr.setSelection(TextSelection.atEnd(state.doc)));
    const handled = feature.keymap!(schema).Enter(state, () => {});
    expect(handled).toBe(false);
  });
});
