import type { Schema } from 'prosemirror-model';
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import type { NodeView } from 'prosemirror-view';

import {
  leaveLineDraft,
  type SyntaxFeature,
} from '@textox/plugin-sdk';

import type { HtmlBlockViewHandle } from '../view/html-block-view';
import { notifySelectionChange } from '../view/selection-watch';
import { matchHtmlStart } from './shared';

function makeDraft(schema: Schema) {
  return leaveLineDraft<{ tag: string }>({
    match: (text) => {
      const m = matchHtmlStart(text);
      if (!m) return null;
      return { data: m, prefixLen: text.match(/^\s*/)?.[0].length ?? 0 };
    },
    draftClass: () => 'html-block-draft',
    commit: (tr, paragraphPos, paragraph, data) => {
      const openTag = data.tag === '!' ? '<!--' : paragraph.textContent.trim();
      const closeTag = data.tag === '!' ? '-->' : `</${data.tag}>`;
      const node = schema.nodes.html_block.create(
        null,
        schema.text(openTag + '\n' + closeTag),
      );
      // 不设置 selection：draft 提交的触发是"光标离开段落"（点击其他段/方向键），
      // 应保留用户的光标位置。Enter 路径由下方 keymap 自行 setSelection 到块内。
      tr.replaceWith(paragraphPos, paragraphPos + paragraph.nodeSize, node);
    },
  });
}

// NodeView 的轻量外壳：同步搭好 root + contentDOM（PM 立即需要合法的可编辑
// contentDOM）与渲染容器，随后动态加载行为模块接管渲染/选区。加载前
// update/stopEvent/ignoreMutation 走保守降级。
function lazyHtmlViewPlugin(): Plugin {
  return new Plugin({
    props: {
      nodeViews: {
        html_block: (node, view, getPos): NodeView => {
          const dom = document.createElement('html-block');
          const contentDOM = document.createElement('div');
          contentDOM.className = 'html-block-code';
          // 通用导出契约：共享导出运行时（packages/export-runtime）只认这两个
          // 属性、不认识 <html-block>，从而与具体插件解耦。
          // - data-export="html"：该元素在导出/打印时按真实 HTML 渲染；
          // - data-export-source：其源码容器（这里是 PM contentDOM）。
          dom.setAttribute('data-export', 'html');
          contentDOM.setAttribute('data-export-source', '');
          dom.appendChild(contentDOM);

          // 渲染容器必须在 PM 挂载 NodeView 之前就绪：挂载后再向根节点
          // appendChild 会被 WebKit 的 MutationObserver 判为结构变化，PM 据此
          // 重建 NodeView，形成无限重绘（打开含 HTML 块的文档即卡死）。
          const renderContainer = document.createElement('div');
          renderContainer.className = 'html-block-render';
          renderContainer.contentEditable = 'false';
          renderContainer.style.display = 'none';
          dom.appendChild(renderContainer);

          let impl: HtmlBlockViewHandle | null = null;
          // 视图可能在动态模块加载完成前就被销毁（节点被删除）：此时不能
          // 再创建行为实例，否则它注册的选区监听永远不会注销。
          let destroyed = false;
          let latest = node;
          void import('../view/html-block-view')
            .then(({ createHtmlBlockView }) => {
              if (destroyed) return;
              impl = createHtmlBlockView({ dom, contentDOM, renderContainer, view, getPos, node: latest });
              // 在 impl 赋值之后再执行首次渲染：确保渲染产生的 DOM 变更被
              // 包装层的 ignoreMutation 正确忽略（见 html-block-view 注释）。
              impl.update(latest);
            })
            // chunk 加载失败时降级为"仅源码可编辑"，不产生未处理的 rejection。
            .catch(() => {});

          return {
            dom,
            contentDOM,
            update(n) {
              latest = n;
              return impl ? impl.update(n) : true;
            },
            destroy() {
              destroyed = true;
              impl?.destroy();
            },
            stopEvent(e) {
              return impl?.stopEvent(e) ?? false;
            },
            ignoreMutation(m) {
              return impl?.ignoreMutation(m) ?? false;
            },
          };
        },
      },
    },
  });
}

// 选区变化广播：只统计 from/to 是否移动，真正的渲染同步由懒加载的行为模块
// 注册到 selection-watch 注册表里完成。
function selectionWatchPlugin(): Plugin {
  const key = new PluginKey('htmlBlockSelectionWatcher');
  return new Plugin({
    key,
    view: () => ({
      update: (view, prevState) => {
        const prevSel = prevState.selection;
        const curSel = view.state.selection;
        if (prevSel.from !== curSel.from || prevSel.to !== curSel.to) {
          notifySelectionChange();
        }
      },
    }),
  });
}

export const htmlBlock: SyntaxFeature = {
  name: 'html-block',

  nodes: {
    html_block: {
      group: 'block',
      content: 'text*',
      marks: '',
      code: true,
      defining: true,
      attrs: { lang: { default: 'html' } },
      parseDOM: [{ tag: 'html-block', preserveWhitespace: 'full' }],
      toDOM: () => ['html-block', 0],
    },
  },

  blockHandlers: {
    html_block: (state, node) => {
      state.write();
      state.tick('inner');
      for (const ch of node.textContent) {
        state.tick('inner');
        if (ch === '\n') {
          state.out += '\n';
          if (state.delim) state.out += state.delim;
        } else {
          state.out += ch;
        }
        state.advance(1);
      }
      state.tick('inner');
      state.closeBlock(node);
    },
  },

  plugins: (schema) => [
    makeDraft(schema).plugin,
    lazyHtmlViewPlugin(),
    selectionWatchPlugin(),
  ],

  keymap: (schema) => ({
    Enter: (state, dispatch) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      const para = $from.parent;
      if (para.type.name !== 'paragraph') return false;
      const m = matchHtmlStart(para.textContent);
      if (!m) return false;
      if (dispatch) {
        const openTag = m.tag === '!' ? '<!--' : para.textContent.trim();
        const closeTag = m.tag === '!' ? '-->' : `</${m.tag}>`;
        const pos = $from.before();
        const node = schema.nodes.html_block.create(null, schema.text(openTag + '\n' + closeTag));
        const tr = state.tr.replaceWith(pos, pos + para.nodeSize, node);
        tr.setSelection(TextSelection.create(tr.doc, pos + 1 + openTag.length + 1));
        dispatch(tr);
      }
      return true;
    },

    Backspace: (state, dispatch) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      if ($from.parent.type.name !== 'html_block') return false;
      if ($from.parent.content.size > 0) return false;
      if (dispatch) {
        const pos = $from.before();
        const size = $from.parent.nodeSize;
        const tr = state.tr.delete(pos, pos + size);
        if (tr.doc.content.size === 0) {
          const p = schema.nodes.paragraph.createAndFill();
          if (p) tr.insert(0, p);
        }
        dispatch(tr);
      }
      return true;
    },

    ArrowDown: (state, dispatch) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      const hbType = state.schema.nodes.html_block;

      // 光标在 html_block 内且位于末行 → 移到块下方（原逻辑）。
      if ($from.parent.type === hbType) {
        const text = $from.parent.textContent;
        const tail = text.slice($from.parentOffset);
        if (tail.includes('\n')) return false;
        if (dispatch) {
          const tr = state.tr;
          const blockEnd = $from.after();
          const docSize = tr.doc.content.size;
          if (blockEnd >= docSize) {
            const para = state.schema.nodes.paragraph.create();
            tr.insert(blockEnd, para);
          }
          tr.setSelection(TextSelection.create(tr.doc, blockEnd + 1));
          dispatch(tr);
        }
        return true;
      }

      // 光标在上方文本块末行、紧邻渲染态的 html_block → 移入块内编辑。
      // 渲染态下 contentDOM 是 display:none，浏览器原生方向键无法把光标
      // 放进去（ProseMirror 对 textblock→textblock 只交给原生处理），
      // 这里显式把 selection 设进块内。
      if (!$from.parent.isTextblock) return false;
      const text = $from.parent.textContent;
      const tail = text.slice($from.parentOffset);
      if (tail.includes('\n')) return false;
      const next = state.doc.nodeAt($from.after());
      if (!next || next.type !== hbType) return false;
      if (next.textContent.trim() === '') return false;
      if (dispatch) {
        dispatch(state.tr.setSelection(TextSelection.create(state.tr.doc, $from.after() + 1)));
      }
      return true;
    },

    ArrowUp: (state, dispatch) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      const hbType = state.schema.nodes.html_block;
      if (!$from.parent.isTextblock) return false;
      const text = $from.parent.textContent;
      const head = text.slice(0, $from.parentOffset);
      if (head.includes('\n')) return false;
      const $before = state.doc.resolve($from.before());
      const prev = $before.nodeBefore;
      if (!prev || prev.type !== hbType) return false;
      if (prev.textContent.trim() === '') return false;
      if (dispatch) {
        dispatch(state.tr.setSelection(TextSelection.create(state.tr.doc, $from.before() - 1)));
      }
      return true;
    },
  }),

  parserTokens: {
    html_block: (state, token, schema) => {
      const content = token.content.replace(/\n$/, '');
      const textNodes = content ? [schema.text(content)] : [];
      state.push(schema.nodes.html_block.create(null, textNodes));
    },
  },
};
