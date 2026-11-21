import type { SyntaxFeature } from "@textox/plugin-sdk";
import { Plugin, TextSelection } from "prosemirror-state";

import { readViewMode } from "../view/mode";
import {
  clearPendingPropertyRow,
  makePropertiesView,
  requestPendingPropertyRow,
} from "../view/properties-view";
import { frontMatterRule } from "./rule";

// YAML front matter — feature shell.
//
// `rule.ts` supplies the markdown-it block rule; this file wires the schema
// node, parser token, serializer handler and the in-editor keymap:
//   * Enter on a doc-start `---` paragraph converts it into a yaml block;
//   * Enter on the empty trailing line exits the block;
//   * ArrowDown on the last line exits to the paragraph below.
export const frontMatterSyntaxFeature: SyntaxFeature = {
  name: "front-matter",

  nodes: {
    front_matter: {
      group: "block",
      content: "text*",
      code: true,
      marks: "",
      defining: true,
      parseDOM: [
        {
          tag: "yaml-block",
          preserveWhitespace: "full",
        },
      ],
      toDOM: () => ["yaml-block", 0],
    },
  },

  mdItPlugins: [
    (md) => {
      md.block.ruler.before("hr", "front_matter", frontMatterRule, {
        alt: ["paragraph", "reference", "blockquote", "list"],
      });
    },
  ],

  parserTokens: {
    front_matter: (state, tok, schema) => {
      const content = tok.content;
      const textNodes = content ? [schema.text(content)] : [];
      state.push(schema.nodes.front_matter.createChecked({}, textNodes));
    },
  },

  blockHandlers: {
    front_matter: (state, node) => {
      state.write("---\n");
      state.tick("inner");
      for (const ch of node.textContent) {
        state.tick("inner");
        if (ch === "\n") {
          state.out += "\n";
          if (state.delim) state.out += state.delim;
        } else {
          state.out += ch;
        }
        state.advance(1);
      }
      state.tick("inner");
      state.write("\n---");
      state.closeBlock(node);
    },
  },

  plugins: () => [
    new Plugin({
      props: {
        nodeViews: {
          front_matter: (node, view, getPos) => makePropertiesView(node, view, getPos),
        },
      },
    }),
  ],

  keymap: (schema) => ({
    Enter: (state, dispatch, view) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      const fmType = schema.nodes.front_matter;

      // Path 1: convert `---` paragraph at doc start to a yaml block.
      if ($from.parent.type.name === "paragraph") {
        const inDocRoot = $from.depth === 1 && $from.index(0) === 0;
        if (inDocRoot && $from.parent.textContent === "---") {
          if (dispatch) {
            const fm = fmType.create();
            const paraStart = $from.before();
            const paraEnd = $from.after();
            const tr = state.tr;
            tr.replaceWith(paraStart, paraEnd, fm);
            if (readViewMode() === "panel") {
              // 面板模式：不把光标放进（隐藏的）块内容，也不整块选中（键入会摧毁 front matter）；
              // 在块后确保一个空段落并把光标落于此（沿用 TOC 原子块先例）。
              const afterBlock = paraStart + fm.nodeSize;
              // Path 1 只在 index(0)===0 时命中，paraStart 恒为 0；此处判断块之后是否已无
              // 落笔用 textblock（文末，或仅剩 nodeSize===1 的原子叶），无则补一个空段落。
              if (afterBlock > tr.doc.content.size - 2) {
                tr.insert(afterBlock, schema.nodes.paragraph.create());
              }
              tr.setSelection(TextSelection.create(tr.doc, afterBlock + 1));
            } else {
              const inside = paraStart + 1;
              tr.setSelection(TextSelection.create(tr.doc, inside));
            }
            if (view) requestPendingPropertyRow(view);
            // 成功时 NodeView 挂载已同步消费标记；finally 只清 dispatch 被拒/抛错时的残留。
            try {
              dispatch(tr);
            } finally {
              if (view) clearPendingPropertyRow(view);
            }
          }
          return true;
        }
      }

      // Path 2: inside the block, exit on "double Enter at end".
      if ($from.parent.type === fmType) {
        const node = $from.parent;
        const text = node.textContent;
        const offset = $from.parentOffset;
        if (offset === text.length) {
          if (text.endsWith("\n")) {
            if (dispatch) {
              const tr = state.tr;
              const blockEnd = $from.after();
              tr.delete(blockEnd - 2, blockEnd - 1);
              const newBlockEnd = blockEnd - 1;
              const docSize = tr.doc.content.size;
              if (newBlockEnd >= docSize) {
                const para = schema.nodes.paragraph.create();
                tr.insert(newBlockEnd, para);
              }
              tr.setSelection(TextSelection.create(tr.doc, newBlockEnd + 1));
              dispatch(tr);
            }
            return true;
          }
        }
        // Otherwise fall through to baseKeymap's newlineInCode.
        return false;
      }

      return false;
    },

    ArrowDown: (state, dispatch) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      const fmType = state.schema.nodes.front_matter;
      if ($from.parent.type !== fmType) return false;
      const text = $from.parent.textContent;
      const tail = text.slice($from.parentOffset);
      if (tail.includes("\n")) return false;
      if (dispatch) {
        const tr = state.tr;
        const blockEnd = $from.after();
        const docSize = tr.doc.content.size;
        if (blockEnd >= docSize) {
          const para = state.schema.nodes.paragraph.create();
          tr.insert(blockEnd, para);
        }
        tr.setSelection(TextSelection.create(tr.doc, blockEnd + 1));
        dispatch(tr);
      }
      return true;
    },
  }),
};
