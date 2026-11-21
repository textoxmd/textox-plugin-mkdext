import { markExtRanges, type SyntaxFeature } from '@textox/plugin-sdk';

import { deriveInlineMath, mathFence, mathTokenAdvance } from './inline-span';
import { mathRenderWidgetBuilder } from './inline-render';
import { registerMathRules } from './md-rules';

export const mathSyntaxFeature: SyntaxFeature = {
  name: 'inline-math',

  marks: {
    inline_math: {
      parseDOM: [{ tag: 'span.math.inline' }],
      toDOM: (mark) => {
        const latex = mark.attrs.latex as string;
        // mark 承载 latex 数据，同时也是可编辑内容的容器：光标在公式外时
        // 内容范围由 softInside 隐藏（syntax-hidden），光标在内时作为普通
        // 文本显示以便逐字符编辑；渲染由 math-render widget 负责。
        return ['span', { class: 'math inline', 'data-latex': latex }, 0];
      },
      attrs: { latex: { default: '' } },
    },
  },

  markDelims: {
    // 分隔符是文本的一部分；markDelims 为空，由 extRanges 控制不转义的范围。
    inline_math: { open: '', close: '' },
  },

  // `dollars` 覆盖 `$…$`，`brackets` 覆盖 `\(…\)`：两条规则都产出
  // `math_inline`（markup 分别是 `$` / `\(`），定位层按 `tokenAdvance` 认领源码宽度。
  // 规则注册（含「brackets 只取 inline」的理由）见 `md-rules.ts`。
  mdItPlugins: [registerMathRules],

  parserTokens: {
    math_inline: (state, token, schema) => {
      const latex = token.content;
      if (!latex) return;
      const fence = mathFence(token.markup);
      if (!fence) {
        // 未知围栏：保留内容与写法，交给后续版本处理。
        state.addText(token.markup + latex + token.markup);
        return;
      }
      const mark = schema.marks.inline_math.create({ latex });
      state.addText(token.markup);
      state.openMark(mark);
      state.addText(latex);
      state.closeMarkType(schema.marks.inline_math);
      state.addText(fence.close);
    },
    math_block: (state, token, schema) => {
      const content = token.content.replace(/^\n+|\n+$/g, '');
      const textNodes = content ? [schema.text(content)] : [];
      state.push(schema.nodes.code_block.createChecked({ lang: 'latex' }, textNodes));
    },
  },

  inline: {
    order: -1,
    derive: deriveInlineMath,
    tokenAdvance: mathTokenAdvance,
    markNames: ['inline_math'],
    extRanges: (parent) => markExtRanges(parent, 'inline_math', 1, 1),
    suppressFormatToolbar: true,
    decorationWidgets: {
      'math-render': mathRenderWidgetBuilder,
    },
  },
};
