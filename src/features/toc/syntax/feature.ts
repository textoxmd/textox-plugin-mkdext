import type { Node as PMNode } from "prosemirror-model";
import { Plugin, TextSelection } from "prosemirror-state";

import type { SyntaxFeature } from "@textox/plugin-sdk";

import { TocNodeView, tocRefreshPlugin } from "./node-view";

// Typora TOC `[toc]` / `[TOC]` — a doc-level atom block. Source is `[toc]`;
// the NodeView renders a live list of every heading (see node-view.ts).
// markdown-it parses `[toc]` as plain text; parserPostProcess converts a
// top-level paragraph whose text is exactly `[toc]`/`[TOC]` into the node.
export const tocSyntaxFeature: SyntaxFeature = {
  name: "toc",

  nodes: {
    toc: {
      group: "block",
      atom: true,
      selectable: true,
      defining: true,
      // No attrs — the rendered content derives from the doc's headings.
      parseDOM: [{ tag: "div.toc" }],
      toDOM: () => ["div", { class: "toc" }],
    },
  },

  plugins: () => [
    tocRefreshPlugin(),
    new Plugin({
      props: {
        nodeViews: {
          toc: (node, view) => new TocNodeView(node, view),
        },
      },
    }),
  ],

  keymap: () => ({
    // Convert paragraph `[toc]` / `[TOC]` to a toc node on Enter.
    Enter: (state, dispatch) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      if ($from.parent.type.name !== "paragraph") return false;
      const text = $from.parent.textContent;
      if (text !== "[toc]" && text !== "[TOC]") return false;
      if (dispatch) {
        const schema = state.schema;
        const tocNode = schema.nodes.toc.create();
        const paraStart = $from.before();
        const paraEnd = $from.after();
        const tr = state.tr;
        // Replace the `[toc]` paragraph with toc + a fresh empty paragraph
        // so the cursor has somewhere to land.
        tr.replaceWith(paraStart, paraEnd, [
          tocNode,
          schema.nodes.paragraph.create(),
        ]);
        const newPos = paraStart + tocNode.nodeSize + 1;
        tr.setSelection(TextSelection.create(tr.doc, newPos));
        dispatch(tr);
      }
      return true;
    },
  }),

  parserPostProcess: (doc) => {
    const out: PMNode[] = [];
    let changed = false;
    const tocType = doc.type.schema.nodes.toc;
    if (!tocType) return doc;
    doc.forEach((child) => {
      if (
        child.type.name === "paragraph" &&
        (child.textContent === "[toc]" || child.textContent === "[TOC]")
      ) {
        out.push(tocType.create());
        changed = true;
      } else {
        out.push(child);
      }
    });
    if (!changed) return doc;
    return doc.type.create(doc.attrs, out, doc.marks);
  },

  blockHandlers: {
    toc: (state, node) => {
      // Canonical lowercase form; round-trip preserves the node shape.
      state.write("[toc]");
      state.closeBlock(node);
    },
  },
};
