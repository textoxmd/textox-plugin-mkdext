import { describe, expect, it, vi } from 'vitest';
import { Schema, type Node as PMNode } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { createHtmlBlockView } from './html-block-view';

// createHtmlBlockView only reads selection / calls dispatch from event handlers,
// so a fake view (with a real minimal EditorState backing it) is enough to
// exercise the mutation contract and the code/render mode switch. Using a real
// EditorView would couple this test to the editor skeleton and the plugin's
// dynamic import, so we build a minimal real Schema/EditorState instead: the
// mousedown handler needs a chainable `state.tr` and a `state.doc` that can
// resolve `TextSelection.create(doc, pos + 1)`.
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    text: {},
  },
});

function makeState(selFrom: number): EditorState {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text('x'.repeat(40))]),
  ]);
  return EditorState.create({
    schema,
    doc,
    selection: TextSelection.create(doc, selFrom),
  });
}

function makeHandle(selFrom: number) {
  const dom = document.createElement('html-block');
  const contentDOM = document.createElement('div');
  contentDOM.className = 'html-block-code';
  const renderContainer = document.createElement('div');
  renderContainer.className = 'html-block-render';
  // 与生产壳层一致：渲染容器初始隐藏（lazy plugin 创建时设 display:none）。
  renderContainer.style.display = 'none';
  dom.append(contentDOM, renderContainer);

  let state = makeState(selFrom);
  const view = {
    editable: true,
    get state() {
      return state;
    },
    // Apply dispatched transactions so caret moves are observable.
    dispatch: vi.fn((tr: Parameters<EditorView['dispatch']>[0]) => {
      state = state.apply(tr);
    }),
    focus: vi.fn(),
  } as unknown as EditorView;

  // getPos 0, nodeSize 4 → positions 1..4 are "inside".
  const node = { nodeSize: 4, textContent: '<div>x</div>', type: { name: 'html_block' } } as unknown as PMNode;
  const handle = createHtmlBlockView({ dom, contentDOM, renderContainer, view, getPos: () => 0, node });
  return { handle, dom, contentDOM, renderContainer, view };
}

function setSelection(view: EditorView, from: number): void {
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from)));
}

describe('html-block view: ignoreMutation contract', () => {
  it('ignores mutations inside the private render container', () => {
    const { handle, renderContainer } = makeHandle(10);
    try {
      expect(handle.ignoreMutation({ target: renderContainer } as unknown as MutationRecord)).toBe(true);
      expect(
        handle.ignoreMutation({ type: 'childList', target: renderContainer } as unknown as MutationRecord),
      ).toBe(true);
    } finally {
      handle.destroy();
    }
  });

  it('ignores mode-switch attribute mutations on the root and contentDOM', () => {
    // WebKit 把 style/class 变更上报为 attribute mutation；不忽略会让 PM
    // 无限重建 NodeView（见 docs/plugin-development.md）。
    const { handle, dom, contentDOM } = makeHandle(10);
    try {
      expect(handle.ignoreMutation({ type: 'attributes', target: dom } as unknown as MutationRecord)).toBe(true);
      expect(
        handle.ignoreMutation({ type: 'attributes', target: contentDOM } as unknown as MutationRecord),
      ).toBe(true);
    } finally {
      handle.destroy();
    }
  });

  it('does not ignore edits to the editable content', () => {
    const { handle, contentDOM } = makeHandle(1);
    try {
      const text = document.createTextNode('x');
      contentDOM.appendChild(text);
      expect(handle.ignoreMutation({ type: 'characterData', target: text } as unknown as MutationRecord)).toBe(false);
      expect(
        handle.ignoreMutation({ type: 'childList', target: contentDOM } as unknown as MutationRecord),
      ).toBe(false);
    } finally {
      handle.destroy();
    }
  });
});

describe('html-block view: code/render mode', () => {
  it('renders HTML and hides the source when the cursor is outside the block', () => {
    const { handle, dom, contentDOM, renderContainer } = makeHandle(10);
    try {
      const node = { nodeSize: 4, textContent: '<div>x</div>', type: { name: 'html_block' } } as unknown as PMNode;
      expect(handle.update(node)).toBe(true);
      expect(renderContainer.innerHTML).toBe('<div>x</div>');
      expect(contentDOM.style.display).toBe('none');
      expect(renderContainer.style.display).toBe('');
      expect(dom.classList.contains('html-block-render-mode')).toBe(true);
    } finally {
      handle.destroy();
    }
  });

  it('shows the source again when the cursor moves back inside', () => {
    const { handle, dom, contentDOM, renderContainer, view } = makeHandle(10);
    try {
      const node = { nodeSize: 4, textContent: '<div>x</div>', type: { name: 'html_block' } } as unknown as PMNode;
      handle.update(node);
      expect(dom.classList.contains('html-block-render-mode')).toBe(true);

      setSelection(view, 1); // inside the block
      handle.update(node);
      expect(contentDOM.style.display).toBe('');
      expect(renderContainer.style.display).toBe('none');
      expect(dom.classList.contains('html-block-render-mode')).toBe(false);
    } finally {
      handle.destroy();
    }
  });
});

describe('html-block view: HTML comments', () => {
  it('keeps comment blocks in source mode and marks them as comments', () => {
    const { handle, dom, contentDOM, renderContainer } = makeHandle(10);
    try {
      const node = { nodeSize: 4, textContent: '<!-- c -->', type: { name: 'html_block' } } as unknown as PMNode;
      expect(handle.update(node)).toBe(true);
      // 浏览器渲染 HTML 注释等于“什么都不显示”，所以注释块必须始终停在源码模式。
      expect(dom.classList.contains('html-block-comment')).toBe(true);
      expect(contentDOM.style.display).toBe('');
      expect(renderContainer.style.display).toBe('none');
      expect(dom.classList.contains('html-block-render-mode')).toBe(false);
      expect(renderContainer.innerHTML).toBe('');
    } finally {
      handle.destroy();
    }
  });

  it('drops the comment class when the block is no longer a comment', () => {
    const { handle, dom } = makeHandle(10);
    try {
      const comment = { nodeSize: 4, textContent: '<!-- c -->', type: { name: 'html_block' } } as unknown as PMNode;
      const div = { nodeSize: 4, textContent: '<div>x</div>', type: { name: 'html_block' } } as unknown as PMNode;
      handle.update(comment);
      expect(dom.classList.contains('html-block-comment')).toBe(true);
      handle.update(div);
      expect(dom.classList.contains('html-block-comment')).toBe(false);
      expect(dom.classList.contains('html-block-render-mode')).toBe(true);
    } finally {
      handle.destroy();
    }
  });
});

describe('html-block view: render container mouse buttons', () => {
  it('does not move the caret on right click', () => {
    const { handle, renderContainer, view } = makeHandle(10);
    try {
      (view.dispatch as unknown as ReturnType<typeof vi.fn>).mockClear();

      const ev = new MouseEvent('mousedown', {
        button: 2,
        bubbles: true,
        cancelable: true,
      });
      renderContainer.dispatchEvent(ev);

      expect(view.dispatch).not.toHaveBeenCalled();
      expect(view.state.selection.from).toBe(10);
      expect(view.focus).not.toHaveBeenCalled();
      // 右键必须阻止浏览器默认的插入点移动（局部兜底已与编辑器根守卫对齐）。
      expect(ev.defaultPrevented).toBe(true);
    } finally {
      handle.destroy();
    }
  });

  it('still moves the caret inside on left click', () => {
    const { handle, renderContainer, view } = makeHandle(10);
    try {
      (view.dispatch as unknown as ReturnType<typeof vi.fn>).mockClear();

      const ev = new MouseEvent('mousedown', {
        button: 0,
        bubbles: true,
        cancelable: true,
      });
      renderContainer.dispatchEvent(ev);

      expect(ev.defaultPrevented).toBe(true);
      expect(view.dispatch).toHaveBeenCalledTimes(1);
      expect(view.state.selection.from).toBe(1); // getPos() === 0 → pos + 1
      expect(view.focus).toHaveBeenCalled();
    } finally {
      handle.destroy();
    }
  });
});
