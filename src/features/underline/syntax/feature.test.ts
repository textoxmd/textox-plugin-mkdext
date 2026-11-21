import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';
import type { Node as PMNode, NodeSpec } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { InlineDeriveContext, InlineSpan } from '@textox/plugin-sdk';

import { underlineSyntaxFeature } from './feature';

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

function makeSchema(): Schema {
  const nodes: Record<string, NodeSpec> = {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
  };
  return new Schema({
    nodes,
    marks: { underline: underlineSyntaxFeature.marks!.underline! },
  });
}

describe('underlineSyntaxFeature', () => {
  it('declares the underline mark and v2 derive', () => {
    expect(underlineSyntaxFeature.name).toBe('underline');
    expect(Object.keys(underlineSyntaxFeature.marks ?? {})).toEqual(['underline']);
    expect(underlineSyntaxFeature.markDelims?.underline).toEqual({ open: '', close: '' });
    expect(underlineSyntaxFeature.inline?.order).toBe(1);
    expect(typeof underlineSyntaxFeature.inline?.derive).toBe('function');
    expect(underlineSyntaxFeature.inline?.markNames).toContain('underline');
  });

  it('derives <u>…</u> and ignores empty / whitespace-edged content', () => {
    const text = '<u>t</u>';
    expect(deriveOf(underlineSyntaxFeature, text)).toEqual([
      {
        type: 'underline',
        from: 3,
        to: 4,
        openFrom: 0,
        openTo: 3,
        closeFrom: 4,
        closeTo: 8,
        wrap: true,
      },
    ]);
    expect(deriveOf(underlineSyntaxFeature, '<u></u>')).toEqual([]);
    expect(deriveOf(underlineSyntaxFeature, '<u> </u>')).toEqual([]);
  });

  it('extRanges cover the <u>/</u> delimiter chars', () => {
    const schema = makeSchema();
    const mark = schema.marks.underline.create();
    const paragraph = schema.node('paragraph', null, [
      schema.text('<u>'),
      schema.text('under', [mark]),
      schema.text('</u>'),
    ]);
    expect(underlineSyntaxFeature.inline!.extRanges(paragraph)).toEqual([[0, 12]]);
  });

  it('derives multiple <u> spans in one textblock', () => {
    const text = '<u>a</u> <u>b</u>';
    const spans = deriveOf(underlineSyntaxFeature, text);
    expect(spans.map((s) => [s.from, s.to])).toEqual([
      [3, 4],
      [12, 13],
    ]);
  });

  it('Mod-u is a no-op on an empty selection', () => {
    const schema = makeSchema();
    const doc = schema.node('doc', null, [schema.node('paragraph', null, schema.text('under'))]);
    let state = EditorState.create({ schema, doc });
    state = state.apply(state.tr.setSelection(TextSelection.create(doc, 3, 3)));
    const cmd = underlineSyntaxFeature.keymap!(schema)['Mod-u']!;
    const changed = cmd(state, (tr) => {
      state = state.apply(tr);
    });
    expect(changed).toBe(false);
    expect(state.doc.textContent).toBe('under');
  });

  it('Mod-u wraps the selection with <u>/</u>', () => {
    const schema = makeSchema();
    const doc = schema.node('doc', null, [schema.node('paragraph', null, schema.text('under'))]);
    let state = EditorState.create({ schema, doc });
    state = state.apply(state.tr.setSelection(TextSelection.create(doc, 1, 6)));
    const cmd = underlineSyntaxFeature.keymap!(schema)['Mod-u']!;
    cmd(state, (tr) => {
      state = state.apply(tr);
    });
    expect(state.doc.textContent).toBe('<u>under</u>');
  });

  it('Mod-u unwraps when the selection is already wrapped', () => {
    const schema = makeSchema();
    const doc = schema.node('doc', null, [schema.node('paragraph', null, schema.text('<u>under</u>'))]);
    let state = EditorState.create({ schema, doc });
    state = state.apply(state.tr.setSelection(TextSelection.create(doc, 4, 9)));
    const cmd = underlineSyntaxFeature.keymap!(schema)['Mod-u']!;
    cmd(state, (tr) => {
      state = state.apply(tr);
    });
    expect(state.doc.textContent).toBe('under');
  });
});
