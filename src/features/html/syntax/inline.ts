import { Transform } from 'prosemirror-transform';

import type { SyntaxFeature } from '@textox/plugin-sdk';

import { KNOWN_INLINE_TAGS, scanInlineHtml } from './shared';

export const htmlInline: SyntaxFeature = {
  name: 'html-inline',

  marks: {
    html_inline: {
      attrs: {
        tag: { default: 'span' },
        htmlAttrs: { default: {} },
        openLen: { default: 0 },
        closeLen: { default: 0 },
      },
      inclusive: false,
      parseDOM: [{
        tag: '*',
        getAttrs: (el) => {
          const htmlEl = el as HTMLElement;
          const tag = htmlEl.tagName.toLowerCase();
          if (!KNOWN_INLINE_TAGS.has(tag)) return false;
          const attrs: Record<string, string> = {};
          for (const attr of htmlEl.attributes) {
            if (attr.name.startsWith('data-')) continue;
            attrs[attr.name] = attr.value;
          }
          return { tag, htmlAttrs: attrs, openLen: 0, closeLen: 0 };
        },
      }],
      toDOM: (mark) => {
        const { tag, htmlAttrs } = mark.attrs as { tag: string; htmlAttrs: Record<string, string> };
        return [tag, htmlAttrs, 0];
      },
    },
  },

  markDelims: {
    html_inline: { open: '', close: '' },
  },

  inline: {
    order: 0.3,
    derive: (ctx) => scanInlineHtml(ctx.text, ctx.consumed),
    markNames: ['html_inline'],
    extRanges: (parent) => {
      const ranges: Array<[number, number]> = [];
      const t = parent.type.schema.marks.html_inline;
      if (!t) return ranges;
      let start = -1;
      let openLen = 0;
      let closeLen = 0;
      let off = 0;
      const flush = (end: number): void => {
        if (start >= 0) ranges.push([start - openLen, end + closeLen]);
        start = -1;
      };
      parent.forEach((child) => {
        if (child.isText) {
          const m = child.marks.find((mk) => mk.type === t);
          if (m && start < 0) {
            start = off;
            const a = m.attrs as { openLen: number; closeLen: number };
            openLen = a.openLen ?? 0;
            closeLen = a.closeLen ?? 0;
          } else if (!m) {
            flush(off);
          }
        }
        off += child.nodeSize;
      });
      flush(off);
      return ranges;
    },
  },

  parserPostProcess: (doc) => {
    const htmlInlineType = doc.type.schema.marks.html_inline;
    if (!htmlInlineType) return doc;
    const tr = new Transform(doc);
    let changed = false;
    doc.descendants((node, pos) => {
      if (!node.isTextblock || node.type.name === 'code_block') return true;
      const text = node.textContent;
      const spans = scanInlineHtml(text, new Uint8Array(text.length));
      if (spans.length === 0) return true;
      const blockStart = pos + 1;
      for (const s of spans) {
        if (s.type !== 'html_inline') continue;
        tr.addMark(blockStart + s.from, blockStart + s.to, htmlInlineType.create(s.attrs));
        changed = true;
      }
      return false;
    });
    return changed ? tr.doc : doc;
  },
};
