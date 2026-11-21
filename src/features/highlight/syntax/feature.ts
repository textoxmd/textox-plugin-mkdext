import markPlugin from 'markdown-it-mark';
import { markExtRanges, pairMarks } from '@textox/plugin-sdk';
import type { SyntaxFeature } from '@textox/plugin-sdk';

// Typora-style highlight `==x==`.
//
// 语义归 markdown-it：`markdown-it-mark`（markdown-it 官方组织，MIT）产出
// `mark_open` / `mark_close`（markup `==`），定位层（features/inline-derive.ts）
// 按本特性的 `derive` 认领成 `highlight` mark。
//
// 分隔符仍是文档里的普通文字（markDelims 为空），序列化由文本节点负责；
// extRanges 沿用 method-B 的既有约定（共享 markExtRanges），当前不改变输出。
export const highlightSyntaxFeature: SyntaxFeature = {
  name: 'highlight',

  marks: {
    highlight: {
      parseDOM: [{ tag: 'mark' }],
      toDOM: () => ['mark', 0],
    },
  },

  mdItPlugins: [(md) => md.use(markPlugin)],

  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike 的 s_open / s_close 同构，缺了会让回退路径丢掉 `==` 字面。
  parserTokens: {
    mark_open: (state, tok, schema) => {
      state.addText(tok.markup);
      state.openMark(schema.marks.highlight.create());
    },
    mark_close: (state, tok, schema) => {
      state.closeMarkType(schema.marks.highlight);
      state.addText(tok.markup);
    },
  },

  markDelims: {
    highlight: { open: '', close: '' },
  },

  inline: {
    // v2：语义归 md-it，位置归骨架；本特性只声明「成对 token → mark」。
    order: -1,
    derive: (ctx) => pairMarks(ctx, { open: 'mark_open', close: 'mark_close', mark: 'highlight' }),
    markNames: ['highlight'],
    extRanges: (parent) => markExtRanges(parent, 'highlight', 2),
  },
};
