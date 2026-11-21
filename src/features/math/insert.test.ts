import { describe, expect, it, vi } from 'vitest';
import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { IconDef } from '@textox/plugin-sdk';

import { mathInsert } from './insert';
import { mathFeature } from './index';

function makeSchema() {
  return new Schema({
    nodes: {
      doc: { content: 'block+' },
      paragraph: { group: 'block', content: 'inline*' },
      text: { group: 'inline' },
      code_block: {
        group: 'block',
        content: 'text*',
        attrs: { lang: { default: '' } },
      },
    },
  });
}

describe('mathInsert', () => {
  it('exposes metadata for toolbar / slash / shortcut', () => {
    expect(mathInsert.id).toBe('math_block');
    expect(mathInsert.keyword).toBe('math');
    expect(mathInsert.defaultShortcut).toBe('Cmd+Shift+M');
    expect((mathInsert.icon as IconDef).length).toBeGreaterThan(0);
  });

  it('is wired into the math feature as an insert command', () => {
    const registerInsertCommand = vi.fn(() => ({ dispose: vi.fn() }));
    const disposable = { dispose: vi.fn() };
    const ctx = {
      editor: {
        registerSyntaxFeature: () => disposable,
        registerExtension: () => disposable,
        registerContextMenuItem: () => disposable,
        registerInsertCommand,
      },
      settings: { get: () => undefined },
      t: (key: string) => key,
    } as unknown as Parameters<typeof mathFeature.register>[0];

    const resources = mathFeature.register(ctx);
    expect(Array.isArray(resources)).toBe(true);
    expect(registerInsertCommand).toHaveBeenCalledWith(mathInsert);
  });

  it('replaces the current top-level block with a latex code block', () => {
    const schema = makeSchema();
    const doc = schema.nodes.doc!.create(null, [schema.nodes.paragraph!.create()]);
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, 1) });
    const view = {
      get state() {
        return state;
      },
      dispatch(tr: Transaction) {
        state = state.apply(tr);
      },
      focus: vi.fn(),
    };

    mathInsert.insert(view as unknown as EditorView);

    const block = state.doc.firstChild!;
    expect(block.type.name).toBe('code_block');
    expect(block.attrs.lang).toBe('latex');
    expect(view.focus).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the schema has no code_block', () => {
    const schema = new Schema({
      nodes: {
        doc: { content: 'block+' },
        paragraph: { group: 'block', content: 'inline*' },
        text: { group: 'inline' },
      },
    });
    const doc = schema.nodes.doc!.create(null, [schema.nodes.paragraph!.create()]);
    const state = EditorState.create({ doc, selection: TextSelection.create(doc, 1) });
    const dispatch = vi.fn();
    const view = { state, dispatch, focus: vi.fn() };

    expect(() => mathInsert.insert(view as unknown as EditorView)).not.toThrow();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
