import { describe, expect, it, vi } from 'vitest';
import { Schema, type Node as PMNode } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { IconDef } from '@textox/plugin-sdk';

import { footnoteInsert } from './insert';
import { footnoteFeature } from './syntax/feature';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*' },
    text: { group: 'inline' },
  },
  marks: { ...footnoteFeature.marks },
});

describe('footnoteInsert', () => {
  it('exposes metadata', () => {
    expect(footnoteInsert.id).toBe('footnote');
    expect(footnoteInsert.keyword).toBe('footnote');
    expect((footnoteInsert.icon as IconDef).length).toBeGreaterThan(0);
  });

  it('inserts a marked reference and appends a definition paragraph', () => {
    const doc = schema.nodes.doc!.create(null, [schema.nodes.paragraph!.create(null, [schema.text('hello')])]);
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, 3) });
    const view = {
      get state() {
        return state;
      },
      dispatch(tr: Transaction) {
        state = state.apply(tr);
      },
      focus: vi.fn(),
    };

    footnoteInsert.insert(view as unknown as EditorView);

    const texts = state.doc.textContent;
    expect(texts).toContain('[^1]');
    expect(texts).toContain('[^1]: ');
    expect(state.doc.lastChild!.textContent).toBe('[^1]: ');

    const refNodes: PMNode[] = [];
    state.doc.descendants((n) => {
      if (n.isText && n.marks.some((m) => m.type.name === 'footnote_ref')) refNodes.push(n);
      return true;
    });
    expect(refNodes).toHaveLength(1);
    expect(refNodes[0]!.text).toBe('[^1]');
    expect(
      refNodes[0]!.marks.some((m) => m.type.name === 'footnote_ref' && m.attrs.id === '1'),
    ).toBe(true);
    expect(view.focus).toHaveBeenCalledTimes(1);
  });

  it('numbers the new footnote after the highest existing label', () => {
    const doc = schema.nodes.doc!.create(null, [
      schema.nodes.paragraph!.create(null, [schema.text('existing[^3]')]),
    ]);
    const endOfParagraph = 1 + 'existing[^3]'.length;
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, endOfParagraph) });
    const view = {
      get state() {
        return state;
      },
      dispatch(tr: Transaction) {
        state = state.apply(tr);
      },
      focus: vi.fn(),
    };

    footnoteInsert.insert(view as unknown as EditorView);

    const texts = state.doc.textContent;
    expect(texts).toContain('[^4]');
    expect(texts).toContain('[^4]: ');
    expect(texts).not.toContain('[^5]');
    expect(state.doc.lastChild!.textContent).toBe('[^4]: ');

    const refNodes: PMNode[] = [];
    state.doc.descendants((n) => {
      if (n.isText && n.marks.some((m) => m.type.name === 'footnote_ref')) refNodes.push(n);
      return true;
    });
    expect(refNodes).toHaveLength(1);
    expect(refNodes[0]!.text).toBe('[^4]');
    expect(
      refNodes[0]!.marks.some((m) => m.type.name === 'footnote_ref' && m.attrs.id === '4'),
    ).toBe(true);
  });
});
