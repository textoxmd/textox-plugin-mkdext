import { describe, expect, it } from 'vitest';
import type Token from 'markdown-it/lib/token.mjs';

import { buildInlineMathSpan, mathFence, mathTokenAdvance } from './inline-span';

function tok(markup: string, content: string): Token {
  return { type: 'math_inline', markup, content } as unknown as Token;
}

describe('buildInlineMathSpan', () => {
  it('derives the $…$ span with a cursor-outside render widget', () => {
    const span = buildInlineMathSpan({ text: '$x^2$', pos: 0, token: tok('$', 'x^2') });
    expect(span).toEqual({
      type: 'inline_math',
      from: 1,
      to: 4,
      openFrom: 0,
      openTo: 1,
      closeFrom: 4,
      closeTo: 5,
      attrs: { latex: 'x^2' },
      opaque: true,
      delimRanges: [
        { from: 0, to: 1 },
        { from: 1, to: 4, softInside: true },
        { from: 4, to: 5 },
      ],
      widgetDecorations: [
        { pos: 1, when: 'outside', kind: 'math-render', attrs: { latex: 'x^2' }, side: -1 },
      ],
    });
  });

  it('tags \\(…\\) delimiters and trims padding spaces', () => {
    const span = buildInlineMathSpan({ text: '\\( y \\)', pos: 0, token: tok('\\(', ' y ') });
    expect(span?.attrs?.latex).toBe('y');
    expect(span?.delimRanges).toEqual([
      { from: 0, to: 2, className: 'math-delim-open' },
      { from: 3, to: 4, softInside: true },
      { from: 5, to: 7, className: 'math-delim-close' },
    ]);
  });

  it('returns null when the source does not match the token', () => {
    expect(buildInlineMathSpan({ text: 'zzz', pos: 0, token: tok('$', 'x') })).toBeNull();
    expect(buildInlineMathSpan({ text: '$x!', pos: 0, token: tok('$', 'x') })).toBeNull();
  });

  it('returns null for an unknown fence', () => {
    expect(buildInlineMathSpan({ text: '!!', pos: 0, token: tok('!', 'x') })).toBeNull();
  });

  it('accepts blank content as a zero-width span so the cursor keeps moving', () => {
    const span = buildInlineMathSpan({ text: '\\( \\)', pos: 0, token: tok('\\(', ' ') });
    expect(span).toMatchObject({ from: 3, to: 3, openFrom: 0, openTo: 2, closeFrom: 3, closeTo: 5 });
    expect(span?.widgetDecorations).toBeUndefined();
  });

  it('treats whitespace-only content as blank (tabs count)', () => {
    const span = buildInlineMathSpan({ text: '\\(\t\\)', pos: 0, token: tok('\\(', '\t') });
    expect(span).toMatchObject({ from: 3, to: 3, attrs: { latex: '' } });
    expect(span?.widgetDecorations).toBeUndefined();
  });

  it('returns null when the opening fence or the content does not match the source', () => {
    expect(buildInlineMathSpan({ text: 'x$', pos: 0, token: tok('$', 'x') })).toBeNull();
    // 仅靠内容核对无法区分：`ax$` 的内容/闭围栏在错位处仍能对上，必须靠开围栏核对拒绝。
    expect(buildInlineMathSpan({ text: 'ax$', pos: 0, token: tok('$', 'x') })).toBeNull();
    expect(buildInlineMathSpan({ text: '$y$', pos: 0, token: tok('$', 'x') })).toBeNull();
  });

  it('rejects prototype keys in the fence table', () => {
    expect(mathFence('constructor')).toBeNull();
    expect(mathFence('__proto__')).toBeNull();
  });

  it('keeps escaped dollars inside the span', () => {
    const span = buildInlineMathSpan({ text: '$\\$x$', pos: 0, token: tok('$', '\\$x') });
    expect(span?.attrs?.latex).toBe('\\$x');
  });

  it('accepts a bracket formula after a digit (no digit guard on brackets)', () => {
    const span = buildInlineMathSpan({ text: '1\\(x\\)', pos: 1, token: tok('\\(', 'x') });
    expect(span).toMatchObject({ openFrom: 1, openTo: 3, from: 3, to: 4, closeTo: 6 });
  });
});

describe('mathTokenAdvance', () => {
  it('handles both fence shapes', () => {
    expect(mathTokenAdvance('$x$', 0, tok('$', 'x'))).toBe(3);
    expect(mathTokenAdvance('a \\( y \\) b', 2, tok('\\(', ' y '))).toBe(7);
  });

  it('returns null when the source does not match', () => {
    expect(mathTokenAdvance('zzz', 0, tok('$', 'x'))).toBeNull();
    expect(mathTokenAdvance('$x!', 0, tok('$', 'x'))).toBeNull();
  });

  it('returns null for non math_inline tokens', () => {
    expect(
      mathTokenAdvance('$x$', 0, { type: 'text', content: '$x$' } as unknown as Token),
    ).toBeNull();
  });
});
