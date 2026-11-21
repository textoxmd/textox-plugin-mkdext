import type { Mark, Node as PMNode } from 'prosemirror-model';
import { Plugin, TextSelection } from 'prosemirror-state';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';
import footnote from 'markdown-it-footnote';
import {
  markConsumed,
  type InlineSpan,
  type ParserState,
  type SyntaxFeature,
} from '@textox/plugin-sdk';

import { footnoteSourceVerbatim } from './source-verbatim';

const FN_REF_RE = /\[\^(\d+)\]/g;
const FN_DEF_RE = /^\[\^(\d+)\]:\s*/;

/**
 * 正在解析的脚注定义 label（按 `ParserState` 绑定）。
 *
 * `footnote_open` → `footnote_close` 之间要把「已开过 paragraph 节点」这一状态
 * 传给同级的 `paragraph_open` / `paragraph_close`，而解析器状态对象不提供自定义
 * 槽位；用 WeakMap 按状态实例记录，随状态对象一起回收，不跨文档泄漏。
 */
const footnoteDefLabels = new WeakMap<ParserState, string>();

function scanFNRef(text: string, consumed: Uint8Array): InlineSpan[] {
  const out: InlineSpan[] = [];
  FN_REF_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FN_REF_RE.exec(text))) {
    const fullStart = m.index;
    const fullEnd = fullStart + m[0].length;
    const label = m[1]!;
    if (fullStart === 0) continue;
    const openFrom = fullStart;
    const openTo = fullStart + 2;
    const closeFrom = fullEnd - 1;
    const closeTo = fullEnd;
    let blocked = false;
    for (let i = openFrom; i < openTo; i++) {
      if (consumed[i]) { blocked = true; break; }
    }
    if (!blocked) {
      for (let i = closeFrom; i < closeTo; i++) {
        if (consumed[i]) { blocked = true; break; }
      }
    }
    if (blocked) continue;
    markConsumed(consumed, fullStart, fullEnd);
    // The mark covers the WHOLE `[^n]` source (the text node keeps the literal
    // `[^n]` and `toDOM` renders a `<sup>`): the content range is the full
    // span and the delimiters collapse to zero width. v2 requires
    // `openTo <= from` / `to <= closeFrom`, so the visible `[^` / `]`
    // decorations are expressed explicitly through `delimRanges`
    // (normalize prefers those over open/close).
    out.push({
      type: "footnote_ref", from: fullStart, to: fullEnd,
      openFrom: fullStart, openTo: fullStart,
      closeFrom: fullEnd, closeTo: fullEnd,
      wrap: true,
      delimRanges: [
        { from: openFrom, to: openTo },
        { from: closeFrom, to: closeTo },
      ],
      attrs: { id: label },
    });
  }
  return out;
}

function hasRef(state: EditorState, label: string): boolean {
  let found = false;
  state.doc.descendants((node: PMNode) => {
    if (found) return false;
    if (node.isText) {
      for (const m of node.marks) {
        if (m.type.name === "footnote_ref" && m.attrs.id === label) {
          found = true; return false;
        }
      }
    }
    return true;
  });
  return found;
}

function scrollToDef(view: EditorView, label: string): void {
  let target = -1;
  view.state.doc.descendants((n: PMNode, p: number) => {
    if (n.type.name === "paragraph" && n.textContent.startsWith(`[^${label}]:`)) {
      target = p + n.nodeSize - 1;
      return false;
    }
    return true;
  });
  if (target < 0) return;
  view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(target))).scrollIntoView());
}

function scrollToRef(view: EditorView, label: string): void {
  const refType = view.state.schema.marks.footnote_ref;
  let target = -1;
  view.state.doc.descendants((n: PMNode, p: number) => {
    const text = n.text;
    if (text && n.isText && n.marks.some((m: Mark) => m.type === refType && m.attrs.id === label)) {
      target = p + text.length;
      return false;
    }
    return true;
  });
  if (target < 0) return;
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, target)).scrollIntoView());
  view.focus();
}

function fnPlugin(): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const decos: Decoration[] = [];
        state.doc.descendants((node: PMNode, pos: number) => {
          if (node.type.name !== "paragraph") return true;
          const text = node.textContent;
          const m = FN_DEF_RE.exec(text);
          if (!m) return true;
          const label = m[1]!;
          const labelLen = label.length;
          const defLen = m[0].length;
          const blockStart = pos + 1;
          const blockEnd = blockStart + text.length;
          const cursor = state.selection.from;
          const cursorInside = cursor >= blockStart && cursor < blockEnd;
          const metaCls = cursorInside ? "syntax-hint" : "syntax-hidden";
          decos.push(Decoration.inline(blockStart, blockStart + 2, { class: metaCls }));
          decos.push(Decoration.inline(blockStart + 2 + labelLen, blockStart + defLen, { class: metaCls }));
          decos.push(Decoration.inline(blockStart + 2, blockStart + 2 + labelLen, { class: "fn-def-num" }));
          if (hasRef(state, label)) {
            const el = document.createElement("span");
            el.className = "md-reverse-footnote-area";
            el.setAttribute("contenteditable", "false");
            el.appendChild(document.createTextNode(" "));
            const a = document.createElement("a");
            a.className = "reversefootnote";
            a.setAttribute("href", "#");
            a.setAttribute("title", "回到文档");
            a.setAttribute("data-index", "0");
            a.textContent = "\u21A9";
            el.appendChild(a);
            decos.push(Decoration.widget(pos + node.nodeSize - 1, el, {
              side: 1,
              stopEvent: (e: Event) => e.type !== "click",
            }));
          }
          return true;
        });
        return decos.length ? DecorationSet.create(state.doc, decos) : DecorationSet.empty;
      },
    },
    view(view) {
      const handler = (event: MouseEvent) => {
        const el = event.target instanceof Element ? event.target : (event.target as Node).parentElement;
        if (!el) return;
        const sup = el.closest("sup.footnote-ref") as HTMLElement | null;
        if (sup && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          event.stopPropagation();
          const id = sup.getAttribute("data-ref");
          if (id) scrollToDef(view, id);
          return;
        }
        const backref = el.closest(".reversefootnote") as HTMLElement | null;
        if (backref) {
          // 只处理左键：右键点反链不应触发左键的跳转语义
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          const para = backref.closest("p") as HTMLElement | null;
          if (para) {
            const m2 = FN_DEF_RE.exec(para.textContent ?? "");
            if (m2) scrollToRef(view, m2[1]!);
          }
        }
      };
      let tooltipEl: HTMLElement | null = null;

      const getDefText = (id: string): string => {
        let text = "";
        view.state.doc.descendants((n: PMNode) => {
          if (n.type.name === "paragraph" && n.textContent.startsWith(`[^${id}]:`)) {
            text = n.textContent.replace(/^\[\^\d+\]:\s*/, "");
            return false;
          }
          return true;
        });
        return text;
      };

      const tooltipHandler = (event: Event) => {
        const target = event.target instanceof Element ? event.target : (event.target as Node).parentElement;
        if (!target) return;
        const sup = target.closest("sup.footnote-ref") as HTMLElement | null;

        // Remove tooltip if leaving the sup
        if (!sup) {
          tooltipEl?.remove();
          tooltipEl = null;
          return;
        }

        if (tooltipEl) return; // Already showing

        const id = sup.getAttribute("data-ref");
        if (!id) return;
        const defText = getDefText(id);
        if (!defText) return;

        const rect = sup.getBoundingClientRect();
        const el = document.createElement("div");
        el.className = "fn-tooltip";
        el.textContent = defText;
        document.body.appendChild(el);
        el.style.top = `${rect.bottom + 6}px`;
        el.style.left = `${rect.left}px`;
        tooltipEl = el;
      };

      view.dom.addEventListener("mouseover", tooltipHandler);
      view.dom.addEventListener("mouseout", tooltipHandler);
      view.dom.addEventListener("mousedown", handler, true);
      return {
        destroy() {
          view.dom.removeEventListener("mouseover", tooltipHandler);
          view.dom.removeEventListener("mouseout", tooltipHandler);
          view.dom.removeEventListener("mousedown", handler, true);
          tooltipEl?.remove();
        },
      };
    },
  });
}

export const footnoteFeature: SyntaxFeature = {
  name: "footnote",

  mdItPlugins: [(md) => md.use(footnote)],

  marks: {
    footnote_ref: {
      attrs: { id: {} },
      inclusive: false,
      parseDOM: [{ tag: "sup.footnote-ref", getAttrs: (el) => ({ id: (el as HTMLElement).getAttribute("data-ref") }) }],
      toDOM: (mark) => ["sup", { class: "footnote-ref", "data-ref": mark.attrs.id as string }, 0],
    },
  },

  parserTokens: {
    footnote_ref: (state, token, _schema) => {
      const label = String(token.meta?.label ?? token.content ?? "");
      if (!label) return;
      state.openMark(_schema.marks.footnote_ref.create({ id: label }));
      state.addText(`[^${label}]`);
      state.closeMarkType(_schema.marks.footnote_ref);
    },
    footnote_open: (state, token, _schema) => {
      const label = String(token.meta?.label ?? token.content ?? "");
      footnoteDefLabels.set(state, label);
      state.openNode(_schema.nodes.paragraph);
      state.addText(`[^${label}]: `);
    },
    footnote_close: (state, _token, _schema) => {
      footnoteDefLabels.delete(state);
      state.closeNode();
    },
    paragraph_open: (state, _token, _schema) => {
      if (footnoteDefLabels.get(state)) return;
      state.openNode(_schema.nodes.paragraph);
    },
    paragraph_close: (state, _token, _schema) => {
      if (footnoteDefLabels.get(state)) return;
      state.closeNode();
    },
  },

  markDelims: {
    footnote_ref: { open: "", close: "" },
  },

  inline: {
    order: 1.1,
    derive: (ctx) => scanFNRef(ctx.text, ctx.consumed),
    markNames: ["footnote_ref"],
    extRanges: (parent) => {
      const ranges: Array<[number, number]> = [];
      const fnType = parent.type.schema.marks.footnote_ref;
      if (!fnType) return ranges;
      let start = -1;
      let currentMark: Mark | null = null;
      const flush = (end: number): void => {
        if (start < 0 || !currentMark) return;
        ranges.push([start, end]);
        start = -1; currentMark = null;
      };
      let off = 0;
      parent.forEach((child: PMNode) => {
        if (child.isText) {
          const mk = child.marks.find((m: Mark) => m.type === fnType) ?? null;
          if (mk) {
            if (start < 0) { start = off; currentMark = mk; }
            else if (currentMark && !mk.eq(currentMark)) { flush(off); start = off; currentMark = mk; }
          } else { flush(off); }
        }
        off += child.nodeSize;
      });
      flush(off);

      // Cover [^n]: prefix in footnote definition paragraphs
      const text = parent.textContent;
      const defM = FN_DEF_RE.exec(text);
      if (defM) {
        ranges.push([0, defM[0].length]);
      }

      return ranges;
    },
  },

  plugins: () => [fnPlugin()],

  sourceVerbatim: footnoteSourceVerbatim,
};
