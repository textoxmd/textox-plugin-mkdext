import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';
import type { NodeSpec } from 'prosemirror-model';

import { highlightSyntaxFeature } from './feature';

function makeSchema(): Schema {
  const nodes: Record<string, NodeSpec> = {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
  };
  return new Schema({
    nodes,
    marks: { highlight: highlightSyntaxFeature.marks!.highlight! },
  });
}

describe('highlightSyntaxFeature', () => {
  it('declares the mark and derives it from md-it tokens', () => {
    expect(highlightSyntaxFeature.name).toBe('highlight');
    expect(Object.keys(highlightSyntaxFeature.marks ?? {})).toEqual(['highlight']);
    expect(highlightSyntaxFeature.markDelims?.highlight).toEqual({ open: '', close: '' });
    expect(highlightSyntaxFeature.inline?.markNames).toContain('highlight');
  });

  it('registers the markdown-it rule and the token handlers', () => {
    expect(highlightSyntaxFeature.mdItPlugins).toHaveLength(1);
    expect(typeof highlightSyntaxFeature.parserTokens?.mark_open).toBe('function');
    expect(typeof highlightSyntaxFeature.parserTokens?.mark_close).toBe('function');
  });

  it('extRanges cover the == delimiter chars', () => {
    const schema = makeSchema();
    const mark = schema.marks.highlight.create();
    const paragraph = schema.node('paragraph', null, [
      schema.text('=='),
      schema.text('marked', [mark]),
      schema.text('=='),
    ]);
    expect(highlightSyntaxFeature.inline!.extRanges(paragraph)).toEqual([[0, 10]]);
  });

  it('derives highlight spans through the v2 seam', () => {
    expect(highlightSyntaxFeature.inline?.order).toBe(-1);
    expect(typeof highlightSyntaxFeature.inline?.derive).toBe('function');

    const tokens = [
      { token: { type: 'mark_open' }, pos: 0, end: 2, exact: true, verified: true },
      { token: { type: 'text' }, pos: 2, end: 3, exact: true, verified: true },
      { token: { type: 'mark_close' }, pos: 3, end: 5, exact: true, verified: true },
    ] as never;
    const spans = highlightSyntaxFeature.inline!.derive!({
      text: '==x==',
      tokens,
      consumed: new Uint8Array(0),
      parentBlock: null,
      isConsumed: () => false,
      warn: () => {},
    });
    expect(spans).toEqual([
      { type: 'highlight', from: 2, to: 3, openFrom: 0, openTo: 2, closeFrom: 3, closeTo: 5 },
    ]);
  });
});
