import subPlugin from 'markdown-it-sub';
import supPlugin from 'markdown-it-sup';
import { markExtRanges, pairMarks } from '@textox/plugin-sdk';
import type { SyntaxFeature } from '@textox/plugin-sdk';

// Typora extensions:
//   subscript    `~x~`   (single tilde — disambiguates from strike's `~~`)
//   superscript  `^x^`   (single caret)
//
// 语义归 markdown-it：`markdown-it-sub` / `markdown-it-sup`（markdown-it
// 官方组织，MIT）产出 `sub_open`/`sub_close`、`sup_open`/`sup_close`（markup
// 单字符），定位层按本特性的 `derive` 认领。实测边界：
//   - 内容含未转义空白 ⇒ 不成立（`~a b~` 是纯文本）；
//   - 内容被压平成字面文本（`~a^b^~` 只有 sub，嵌套标记不解析）；
//   - `~~x~~` 归删除线（strikethrough 规则更早）；
//   - 内容里的 `\X` 反转义后进入 token，源码保真由 `textAdvance` 负责。
export const subSupSyntaxFeature: SyntaxFeature = {
  name: 'sub-sup',

  marks: {
    sub: {
      parseDOM: [{ tag: 'sub' }],
      toDOM: () => ['sub', 0],
    },
    sup: {
      parseDOM: [{ tag: 'sup' }],
      toDOM: () => ['sup', 0],
    },
  },

  mdItPlugins: [(md) => md.use(subPlugin).use(supPlugin)],

  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike / highlight 的 s_* / mark_* 同构，分隔符取自 tok.markup。
  parserTokens: {
    sub_open: (state, tok, schema) => {
      state.addText(tok.markup);
      state.openMark(schema.marks.sub.create());
    },
    sub_close: (state, tok, schema) => {
      state.closeMarkType(schema.marks.sub);
      state.addText(tok.markup);
    },
    sup_open: (state, tok, schema) => {
      state.addText(tok.markup);
      state.openMark(schema.marks.sup.create());
    },
    sup_close: (state, tok, schema) => {
      state.closeMarkType(schema.marks.sup);
      state.addText(tok.markup);
    },
  },

  markDelims: {
    sub: { open: '', close: '' },
    sup: { open: '', close: '' },
  },

  inline: {
    order: -1,
    derive: (ctx) => [
      ...pairMarks(ctx, { open: 'sub_open', close: 'sub_close', mark: 'sub' }),
      ...pairMarks(ctx, { open: 'sup_open', close: 'sup_close', mark: 'sup' }),
    ],
    markNames: ['sub', 'sup'],
    extRanges: (parent) => [
      ...markExtRanges(parent, 'sub', 1),
      ...markExtRanges(parent, 'sup', 1),
    ],
  },
};
