import { describe, expect, it } from 'vitest';
import type { Node as PMNode } from 'prosemirror-model';
import type { InlineDeriveContext, InlineSpan } from '@textox/plugin-sdk';

import { htmlComment } from './comment';

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

describe('htmlComment derive', () => {
  it('goes through the v2 seam with order 0.5', () => {
    expect(htmlComment.inline?.order).toBe(0.5);
    expect(typeof htmlComment.inline?.derive).toBe('function');
  });

  it('claims the whole `<!-- ... -->` span with collapsed delimiters', () => {
    const text = 'a <!-- hi --> b';

    const spans = deriveOf(htmlComment, text);

    expect(spans).toHaveLength(1);
    const span = spans[0]!;
    expect(span.type).toBe('html_comment');
    expect(span.opaque).toBe(true);
    expect(text.slice(span.from, span.to)).toBe('<!-- hi -->');
    // open/close collapse to zero-length: normalize emits no delim decorations.
    expect(span.openFrom).toBe(span.openTo);
    expect(span.closeFrom).toBe(span.closeTo);
  });

  it('finds multiple comments in one textblock', () => {
    const text = '<!-- a -->x<!-- b -->';

    const spans = deriveOf(htmlComment, text);

    expect(spans.map((s) => text.slice(s.from, s.to))).toEqual(['<!-- a -->', '<!-- b -->']);
  });

  it('skips comments whose chars are already consumed', () => {
    const text = '<!-- a -->';
    const consumed = new Uint8Array(text.length).fill(1);

    expect(deriveOf(htmlComment, text, consumed)).toHaveLength(0);
  });
});
