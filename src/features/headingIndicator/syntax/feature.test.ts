import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';
import type { NodeSpec } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { DecorationSet } from 'prosemirror-view';

import { headingTypeIndicatorSyntaxFeature } from './feature';

function makeSchema(): Schema {
  const nodes: Record<string, NodeSpec> = {
    doc: { content: 'heading' },
    heading: {
      content: 'inline*',
      attrs: { level: { default: 1 } },
      toDOM: (node) => [`h${node.attrs.level}`, 0],
    },
    text: { group: 'inline' },
  };
  return new Schema({ nodes, marks: {} });
}

describe('headingTypeIndicatorSyntaxFeature', () => {
  it('declares exactly one plugin', () => {
    const schema = makeSchema();
    expect(headingTypeIndicatorSyntaxFeature.name).toBe('heading-type-indicator');
    expect(headingTypeIndicatorSyntaxFeature.plugins!(schema)).toHaveLength(1);
  });

  it('marks the active heading with the indicator class + data-label once focused', () => {
    const schema = makeSchema();
    const doc = schema.node('doc', null, [
      schema.node('heading', { level: 2 }, [schema.text('Hello')]),
    ]);
    const plugin = headingTypeIndicatorSyntaxFeature.plugins!(schema)[0]!;
    let state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 2),
      plugins: [plugin],
    });
    state = state.apply(state.tr.setMeta('headingTypeIndicator_focus', true));

    const decos = plugin.getState(state) as DecorationSet;
    type NodeDeco = { type: { attrs: Record<string, string> } };
    const node = decos
      .find()
      .find((d) => (d as unknown as NodeDeco).type?.attrs?.class === 'heading-type-indicator');
    expect(node).toBeTruthy();
    expect((node as unknown as NodeDeco).type.attrs['data-label']).toBe('H2');
  });

  it('emits no indicator decoration while the editor is not focused', () => {
    const schema = makeSchema();
    const doc = schema.node('doc', null, [
      schema.node('heading', { level: 1 }, [schema.text('Hello')]),
    ]);
    const plugin = headingTypeIndicatorSyntaxFeature.plugins!(schema)[0]!;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 2),
      plugins: [plugin],
    });
    const decos = plugin.getState(state) as DecorationSet;
    expect(decos.find()).toEqual([]);
  });
});
