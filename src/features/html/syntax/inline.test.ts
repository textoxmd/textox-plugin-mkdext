import { describe, expect, it } from 'vitest';
import type { Node as PMNode } from 'prosemirror-model';
import type { InlineDeriveContext, InlineSpan } from '@textox/plugin-sdk';

import { htmlInline } from './inline';

function deriveOf(
  feature: { inline?: { derive?: (ctx: InlineDeriveContext) => InlineSpan[] } },
  text: string,
  consumed = new Uint8Array(text.length),
  parentBlock: PMNode | null = null,
) {
  return feature.inline!.derive!({
    text,
    tokens: [],
    parentBlock,
    consumed,
    isConsumed: () => false,
    warn: () => {},
  });
}

describe('htmlInline derive', () => {
  it('goes through the v2 seam with order 0.3', () => {
    expect(htmlInline.inline?.order).toBe(0.3);
    expect(typeof htmlInline.inline?.derive).toBe('function');
  });

  it('claims only the tags, not the content', () => {
    const text = '<span>x</span>';

    const spans = deriveOf(htmlInline, text);

    expect(spans).toHaveLength(1);
    const span = spans[0]!;
    expect(span.type).toBe('html_inline');
    expect([span.from, span.to]).toEqual([6, 7]);
    expect([span.openFrom, span.openTo]).toEqual([0, 6]);
    expect([span.closeFrom, span.closeTo]).toEqual([7, 14]);
    expect(span.opaque).toBeUndefined();
  });
});
