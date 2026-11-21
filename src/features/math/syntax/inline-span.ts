import type Token from 'markdown-it/lib/token.mjs';

import type { InlineDeriveContext, InlineSpan } from '@textox/plugin-sdk';

// texmath 的 token 只记开围栏；闭合围栏按模式推导。
const FENCES: Record<string, { close: string; openClass?: string; closeClass?: string }> = {
  '$': { close: '$' },
  '\\(': { close: '\\)', openClass: 'math-delim-open', closeClass: 'math-delim-close' },
};

/**
 * texmath 的 token 只记开围栏；返回对应的闭合围栏与分隔符样式。
 */
export function mathFence(
  markup: string,
): { close: string; openClass?: string; closeClass?: string } | null {
  return Object.prototype.hasOwnProperty.call(FENCES, markup) ? FENCES[markup]! : null;
}

/**
 * 由 `math_inline` token 构造 span（位置、latex、分隔符样式、渲染 widget）。
 *
 * 与旧扫描器逐字段一致；差别只在「边界从 token 来」而不是字符扫描。
 * 源文与 token 对不上时返回 null：v2 下这只表示本 token 不产出 span，源码位置
 * 仍由 `tokenAdvance` 推进（`build` 不负责游标），不会卡住后续 token。
 */
export function buildInlineMathSpan({
  text,
  pos,
  token,
}: { text: string; pos: number; token: Token }): InlineSpan | null {
  const fence = mathFence(token.markup);
  if (!fence) return null;

  const content = token.content;
  const openFrom = pos;
  const openTo = openFrom + token.markup.length;
  if (!text.startsWith(token.markup, openFrom)) return null;
  if (!text.startsWith(content, openTo)) return null;
  const closeFrom = openTo + content.length;
  if (!text.startsWith(fence.close, closeFrom)) return null;
  const closeTo = closeFrom + fence.close.length;

  // brackets 模式允许内容首尾空格；与旧扫描器一致 trim，空格留给普通文本。
  let from = openTo;
  let to = closeFrom;
  while (from < to && /\s/.test(text[from]!)) from++;
  while (to > from && /\s/.test(text[to - 1]!)) to--;
  // 上面的 `startsWith(content, openTo)` 已保证源码切片与 token.content 等价；
  // 取切片而不是 content，是为了在 token 被规范化时不丢源文字的转义。
  const latex = text.slice(from, to);

  const span: InlineSpan = {
    type: 'inline_math',
    from,
    to,
    openFrom,
    openTo,
    closeFrom,
    closeTo,
    attrs: { latex },
    opaque: true,
    delimRanges: [
      { from: openFrom, to: openTo, ...(fence.openClass ? { className: fence.openClass } : {}) },
      { from, to, softInside: true },
      { from: closeFrom, to: closeTo, ...(fence.closeClass ? { className: fence.closeClass } : {}) },
    ],
  };
  // 空白公式（如 `\( \)`）仍要推进游标，但不该产出渲染 widget。
  if (latex) {
    span.widgetDecorations = [
      { pos: from, when: 'outside', kind: 'math-render', attrs: { latex }, side: -1 },
    ];
  }
  return span;
}

/** `math_inline` 的源码宽度（开围栏 + 内容 + 闭围栏）；对不上返回 null。 */
export function mathTokenAdvance(text: string, pos: number, token: Token): number | null {
  if (token.type !== 'math_inline') return null;
  const fence = mathFence(token.markup);
  if (!fence) return null;
  if (!text.startsWith(token.markup, pos)) return null;
  const openTo = pos + token.markup.length;
  if (!text.startsWith(token.content, openTo)) return null;
  const closeFrom = openTo + token.content.length;
  if (!text.startsWith(fence.close, closeFrom)) return null;
  return closeFrom + fence.close.length - pos;
}

/** v2：遍历已定位 token，逐个构造 math span（顺序由引擎归并，插件不排序）。 */
export function deriveInlineMath(ctx: InlineDeriveContext): InlineSpan[] {
  const out: InlineSpan[] = [];
  for (const positioned of ctx.tokens) {
    if (positioned.token.type !== 'math_inline' || !positioned.exact) continue;
    const span = buildInlineMathSpan({
      text: ctx.text,
      pos: positioned.pos,
      token: positioned.token,
    });
    if (span) out.push(span);
  }
  return out;
}
