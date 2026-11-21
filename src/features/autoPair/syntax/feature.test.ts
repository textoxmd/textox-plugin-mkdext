import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';
import type { NodeSpec } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';

import { autoPairSyntaxFeature } from './feature';

function makeSchema(): Schema {
  const nodes: Record<string, NodeSpec> = {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
  };
  return new Schema({ nodes, marks: {} });
}

function stateWith(text: string, cursor: number): EditorState {
  const schema = makeSchema();
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, text ? [schema.text(text)] : []),
  ]);
  return EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
}

describe('autoPairSyntaxFeature', () => {
  it('declares the auto-pair plugin and Backspace keymap', () => {
    const schema = makeSchema();
    expect(autoPairSyntaxFeature.name).toBe('auto_pair');
    expect(autoPairSyntaxFeature.plugins!(schema)).toHaveLength(1);
    expect(Object.keys(autoPairSyntaxFeature.keymap!(schema))).toEqual(['Backspace']);
  });

  it('Backspace deletes both characters of an empty [] pair', () => {
    const schema = makeSchema();
    // "[]" with the cursor between the brackets (doc position 2).
    const state = stateWith('[]', 2);
    let next = state;
    const handled = autoPairSyntaxFeature.keymap!(schema).Backspace!(state, (tr) => {
      next = state.apply(tr);
    });
    expect(handled).toBe(true);
    expect(next.doc.textContent).toBe('');
  });

  it('Backspace leaves a non-empty pair untouched', () => {
    const schema = makeSchema();
    const state = stateWith('a]', 2);
    const handled = autoPairSyntaxFeature.keymap!(schema).Backspace!(state, undefined);
    expect(handled).toBe(false);
    expect(state.doc.textContent).toBe('a]');
  });
});
