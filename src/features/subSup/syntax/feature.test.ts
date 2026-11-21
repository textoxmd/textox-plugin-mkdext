import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';
import type { NodeSpec } from 'prosemirror-model';

import { subSupSyntaxFeature } from './feature';

function makeSchema(): Schema {
  const nodes: Record<string, NodeSpec> = {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
  };
  return new Schema({
    nodes,
    marks: {
      sub: subSupSyntaxFeature.marks!.sub!,
      sup: subSupSyntaxFeature.marks!.sup!,
    },
  });
}

describe('subSupSyntaxFeature', () => {
  it('derives sub / sup from md-it tokens', () => {
    expect(subSupSyntaxFeature.name).toBe('sub-sup');
    expect(Object.keys(subSupSyntaxFeature.marks ?? {}).sort()).toEqual(['sub', 'sup']);
    expect(subSupSyntaxFeature.markDelims?.sub).toEqual({ open: '', close: '' });
    expect(subSupSyntaxFeature.markDelims?.sup).toEqual({ open: '', close: '' });
    expect(subSupSyntaxFeature.inline?.markNames).toEqual(['sub', 'sup']);
  });

  it('falls back through tok.markup for both delimiter kinds', () => {
    const calls: string[] = [];
    const state = {
      addText: (text: string) => calls.push(`text:${text}`),
      openMark: (mark: string) => calls.push(`open:${mark}`),
      closeMarkType: (mark: { name: string }) => calls.push(`close:${mark.name}`),
    };
    const schema = {
      marks: {
        sub: { name: 'sub', create: () => 'sub' },
        sup: { name: 'sup', create: () => 'sup' },
      },
    };
    const tokens = subSupSyntaxFeature.parserTokens!;

    tokens.sub_open!(state as never, { markup: '~' } as never, schema as never);
    tokens.sub_close!(state as never, { markup: '~' } as never, schema as never);
    expect(calls).toEqual(['text:~', 'open:sub', 'close:sub', 'text:~']);

    calls.length = 0;
    tokens.sup_open!(state as never, { markup: '^' } as never, schema as never);
    tokens.sup_close!(state as never, { markup: '^' } as never, schema as never);
    expect(calls).toEqual(['text:^', 'open:sup', 'close:sup', 'text:^']);
  });

  it('extRanges cover the single-char delimiters', () => {
    const schema = makeSchema();
    const sub = schema.marks.sub.create();
    const sup = schema.marks.sup.create();
    const paragraph = schema.node('paragraph', null, [
      schema.text('~'),
      schema.text('a', [sub]),
      schema.text('~'),
      schema.text('^'),
      schema.text('b', [sup]),
      schema.text('^'),
    ]);
    expect(subSupSyntaxFeature.inline!.extRanges(paragraph)).toEqual([
      [0, 3],
      [3, 6],
    ]);
  });

  it('derives sub / sup spans through the v2 seam', () => {
    expect(subSupSyntaxFeature.inline?.order).toBe(-1);
    expect(typeof subSupSyntaxFeature.inline?.derive).toBe('function');

    const tokens = [
      { token: { type: 'sub_open' }, pos: 0, end: 1, exact: true, verified: true },
      { token: { type: 'text' }, pos: 1, end: 2, exact: true, verified: true },
      { token: { type: 'sub_close' }, pos: 2, end: 3, exact: true, verified: true },
      { token: { type: 'sup_open' }, pos: 3, end: 4, exact: true, verified: true },
      { token: { type: 'text' }, pos: 4, end: 5, exact: true, verified: true },
      { token: { type: 'sup_close' }, pos: 5, end: 6, exact: true, verified: true },
    ] as never;
    const spans = subSupSyntaxFeature.inline!.derive!({
      text: '~a~^b^',
      tokens,
      consumed: new Uint8Array(0),
      parentBlock: null,
      isConsumed: () => false,
      warn: () => {},
    });
    expect(spans.map((s) => [s.type, s.from, s.to])).toEqual([
      ['sub', 1, 2],
      ['sup', 4, 5],
    ]);
  });
});
