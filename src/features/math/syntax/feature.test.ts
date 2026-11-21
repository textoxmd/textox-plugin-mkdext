import { describe, expect, it } from 'vitest';

import { mathSyntaxFeature } from './feature';

describe('mathSyntaxFeature', () => {
  it('claims math_inline through the v2 derive seam', () => {
    expect(mathSyntaxFeature.name).toBe('inline-math');
    expect(Object.keys(mathSyntaxFeature.marks ?? {})).toEqual(['inline_math']);
    expect(mathSyntaxFeature.inline?.markNames).toContain('inline_math');
  });

  it('derives math spans through the v2 seam', () => {
    expect(mathSyntaxFeature.inline?.order).toBe(-1);
    expect(typeof mathSyntaxFeature.inline?.tokenAdvance).toBe('function');
    expect(typeof mathSyntaxFeature.inline?.derive).toBe('function');

    const ctx = {
      text: '$x^2$',
      tokens: [
        {
          token: { type: 'math_inline', markup: '$', content: 'x^2' },
          pos: 0,
          end: 5,
          exact: true,
          verified: true,
        },
      ],
      parentBlock: null,
      isConsumed: () => false,
      warn: () => {},
    } as never;
    const spans = mathSyntaxFeature.inline!.derive!(ctx);
    expect(spans).toHaveLength(1);
    expect(spans[0]).toMatchObject({
      type: 'inline_math',
      from: 1,
      to: 4,
      attrs: { latex: 'x^2' },
    });
  });

  it('falls back to the token markup for both fences', () => {
    const calls: string[] = [];
    const state = {
      addText: (text: string) => calls.push(`text:${text}`),
      openMark: () => calls.push('open'),
      closeMarkType: () => calls.push('close'),
    };
    const schema = { marks: { inline_math: { create: (attrs: unknown) => ({ attrs }) } } };
    const handler = mathSyntaxFeature.parserTokens!.math_inline!;

    calls.length = 0;
    handler(state as never, { markup: '$', content: 'y' } as never, schema as never);
    expect(calls).toEqual(['text:$', 'open', 'text:y', 'close', 'text:$']);

    calls.length = 0;
    handler(state as never, { markup: '\\(', content: 'y' } as never, schema as never);
    expect(calls).toEqual(['text:\\(', 'open', 'text:y', 'close', 'text:\\)']);

    calls.length = 0;
    handler(state as never, { markup: '!', content: 'y' } as never, schema as never);
    expect(calls).toEqual(['text:!y!']);
  });

  it('declares format-toolbar suppression and the render widget builder', () => {
    expect(mathSyntaxFeature.inline?.suppressFormatToolbar).toBe(true);
    const builders = mathSyntaxFeature.inline?.decorationWidgets ?? {};
    expect(typeof builders['math-render']).toBe('function');
    expect(builders['math-source']).toBeUndefined();
  });

  it('registers texmath and both parser tokens', () => {
    expect(mathSyntaxFeature.mdItPlugins?.length).toBe(1);
    expect(Object.keys(mathSyntaxFeature.parserTokens ?? {}).sort()).toEqual([
      'math_block',
      'math_inline',
    ]);
  });

  it('builds a math-jax render widget carrying the latex attr', () => {
    const build = mathSyntaxFeature.inline!.decorationWidgets!['math-render']!;
    const el = build({ latex: 'x^2' }, { documentDir: null });
    expect(el.tagName.toLowerCase()).toBe('math-jax');
    expect(el.getAttribute('latex')).toBe('x^2');
  });

  it('renders the mark as a plain editable span (no display:none)', () => {
    const toDOM = mathSyntaxFeature.marks!['inline_math']!.toDOM;
    const dom = toDOM!({ attrs: { latex: 'x^2' } } as never, false);
    expect(dom).toEqual(['span', { class: 'math inline', 'data-latex': 'x^2' }, 0]);
  });
});
