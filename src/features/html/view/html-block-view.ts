import type { Node as PMNode } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { onSelectionChange } from './selection-watch';
import './html-block.css';

export type HtmlBlockViewHandle = {
  update(node: PMNode): boolean;
  destroy(): void;
  stopEvent(e: Event): boolean;
  ignoreMutation(m: MutationRecord | { target: Node }): boolean;
};

// HtmlBlockView: mermaid-style dual mode — cursor inside shows source
// (editable, PM-owned content in `contentDOM`), cursor leaves renders the
// real HTML into an inert `.html-block-render` container.
//
// The root `<html-block>`, `.html-block-code` contentDOM and the
// `.html-block-render` container are all created eagerly by the lazy plugin
// (before ProseMirror mounts the node view): appending a child to the node
// view's root after mount makes WebKit's MutationObserver report an
// unexpected structural change and PM re-creates the node view in a loop.
// This module only attaches the behavioral bits, which is why it can be
// loaded lazily.
export function createHtmlBlockView(args: {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  renderContainer: HTMLElement;
  view: EditorView;
  getPos: () => number | undefined;
  node: PMNode;
}): HtmlBlockViewHandle {
  const { dom, contentDOM, renderContainer, view, getPos } = args;
  let node = args.node;
  let mode: 'code' | 'render' = 'code';
  let lastRenderText: string | null = null;

  const onRenderMousedown = (e: MouseEvent): void => {
    // 只处理左键；右键必须放行，交给编辑器的右键菜单流程
    if (e.button !== 0) {
      // 兜底：右键不移动光标（编辑器根 mousedown 守卫已统一处理）。
      if (e.button === 2) e.preventDefault();
      return;
    }
    if (!view.editable) return;
    e.preventDefault();
    const pos = getPos();
    if (pos == null) return;
    const inside = pos + 1;
    const tr = view.state.tr
      .setSelection(TextSelection.create(view.state.doc, inside))
      .scrollIntoView();
    view.dispatch(tr);
    view.focus();
  };
  renderContainer.addEventListener('mousedown', onRenderMousedown);

  const isCursorInside = (): boolean => {
    const pos = getPos();
    if (pos == null) return false;
    const sel = view.state.selection;
    return sel.from > pos && sel.from < pos + node.nodeSize;
  };

  const enterCodeMode = (): void => {
    if (mode === 'code') return;
    mode = 'code';
    contentDOM.style.display = '';
    renderContainer.style.display = 'none';
    dom.classList.remove('html-block-render-mode');
  };

  const enterRenderMode = (): void => {
    if (mode === 'render') return;
    mode = 'render';
    contentDOM.style.display = 'none';
    renderContainer.style.display = '';
    dom.classList.add('html-block-render-mode');
  };

  const isCommentBlock = (text: string): boolean => {
    const t = text.trim();
    return t.startsWith('<!--') && t.endsWith('-->');
  };

  const syncRender = (): void => {
    const text = node.textContent;
    const comment = isCommentBlock(text);
    dom.classList.toggle('html-block-comment', comment);
    if (comment) {
      // 浏览器渲染 HTML 注释等于“什么都不显示”；注释块始终停在源码模式，
      // 由 `.html-block-comment` 提供暗色样式，避免“光标选中才出现”的错觉。
      lastRenderText = null;
      enterCodeMode();
      return;
    }
    const wantRender = !isCursorInside() && text.trim() !== '';
    if (wantRender) {
      // 已在渲染模式且内容未变时，跳过 innerHTML 重新解析——否则每次光标移动
      // 都会重建渲染容器，重置 <details open>、表单值、媒体播放等交互状态。
      if (mode !== 'render' || lastRenderText !== text) {
        renderContainer.innerHTML = text;
        lastRenderText = text;
      }
      enterRenderMode();
    } else {
      lastRenderText = null;
      enterCodeMode();
    }
  };

  const offSelection = onSelectionChange(syncRender);

  // NOTE: the first syncRender is intentionally NOT called here. The NodeView
  // wrapper assigns this handle to `impl` only after this function returns;
  // rendering before that makes the wrapper's `ignoreMutation` return false
  // for the resulting mutations, so WebKit reports them as structural changes
  // and ProseMirror re-creates the node view forever. The caller must invoke
  // `update(node)` once after assignment instead.

  return {
    update(next) {
      if (next.type.name !== 'html_block') return false;
      node = next;
      syncRender();
      return true;
    },
    destroy() {
      offSelection();
      renderContainer.removeEventListener('mousedown', onRenderMousedown);
    },
    stopEvent(e) {
      return renderContainer.contains(e.target as Node) && mode === 'render';
    },
    ignoreMutation(m) {
      // PM doesn't own the render container: mutations inside it (innerHTML
      // re-parse, display toggles) are ours to manage.
      if (renderContainer.contains(m.target)) return true;
      // Mode switching toggles the `style` attribute on contentDOM / the class
      // on the root. WebKit reports those as attribute mutations; if PM does
      // not ignore them it re-creates the node view in an infinite loop.
      const type = (m as MutationRecord).type;
      if (type === 'attributes' && (m.target === dom || m.target === contentDOM)) {
        return true;
      }
      return false;
    },
  };
}
