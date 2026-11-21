import { describe, expect, it, vi } from 'vitest';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { footnoteFeature } from './feature';

// fnPlugin 的 view() 只从事件处理器读 state / 调 dispatch，因此用一个挂载在
// 真实最小 EditorState 上的 fake view 即可：mousedown 处理器要能走
// `view.state.doc.descendants` + 可链式 `state.tr` + `state.schema.marks.footnote_ref`。
function makeView() {
  const schema = new Schema({
    nodes: {
      doc: { content: 'block+' },
      paragraph: { group: 'block', content: 'text*' },
      text: {},
    },
    marks: {
      footnote_ref: {
        attrs: { id: {} },
        toDOM: (mark) => ['sup', { class: 'footnote-ref', 'data-ref': mark.attrs.id as string }, 0],
      },
    },
  });

  const refText = schema.text('ref', [schema.marks.footnote_ref.create({ id: '1' })]);
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [refText]),
    schema.node('paragraph', null, [schema.text('[^1]: note')]),
  ]);
  const state = EditorState.create({ schema, doc });

  const dom = document.createElement('div');
  const p = document.createElement('p');
  p.appendChild(document.createTextNode('[^1]: note '));
  const area = document.createElement('span');
  area.className = 'md-reverse-footnote-area';
  const backref = document.createElement('a');
  backref.className = 'reversefootnote';
  backref.setAttribute('href', '#');
  backref.textContent = '\u21A9';
  area.appendChild(backref);
  p.appendChild(area);
  dom.appendChild(p);

  const dispatch = vi.fn();
  const focus = vi.fn();
  const view = { dom, state, dispatch, focus } as unknown as EditorView;

  const plugin = footnoteFeature.plugins!(schema)[0]!;
  const pluginView = plugin.spec.view!(view);

  return { backref, dispatch, focus, destroy: () => pluginView?.destroy?.() };
}

describe('footnote back-reference mouse buttons', () => {
  it('does not jump on right click', () => {
    const { backref, dispatch, focus, destroy } = makeView();
    try {
      const ev = new MouseEvent('mousedown', { button: 2, bubbles: true, cancelable: true });
      // 若处理器吞掉事件（stopPropagation），目标自身的监听器不会收到。
      let reachedTarget = false;
      backref.addEventListener('mousedown', () => {
        reachedTarget = true;
      });
      backref.dispatchEvent(ev);

      expect(dispatch).not.toHaveBeenCalled();
      expect(focus).not.toHaveBeenCalled();
      expect(ev.defaultPrevented).toBe(false);
      expect(reachedTarget).toBe(true);
    } finally {
      destroy();
    }
  });

  it('still jumps to the reference on left click', () => {
    const { backref, dispatch, focus, destroy } = makeView();
    try {
      const ev = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true });
      backref.dispatchEvent(ev);

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(focus).toHaveBeenCalled();
      expect(ev.defaultPrevented).toBe(true);
    } finally {
      destroy();
    }
  });
});
