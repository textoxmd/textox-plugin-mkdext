import {
  markConsumed,
  type InlineSpan,
  type SyntaxFeature,
} from '@textox/plugin-sdk';

// HTML comment `<!-- ... -->` (method-B mark).
//
// The mark wraps the entire span (`<!--`, content, `-->`) so the comment
// renders as a single styled `<mark-comment>` block — gray italic in the
// editor, `<comment>...</comment>` in pretty. There are no separate delim
// decorations: cursor inside / outside doesn't change the rendering, the
// source chars are always visible (this matches the user's expectation
// from Typora — comment stays visible in editing view, just dimmed).
//
// pretty uses `<comment>` not `<c>` (which is taken by inline code).

const COMMENT_RE = /<!--([\s\S]*?)-->/g;

function scanComment(text: string, consumed: Uint8Array): InlineSpan[] {
  const out: InlineSpan[] = [];
  COMMENT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COMMENT_RE.exec(text))) {
    const fullStart = m.index;
    const fullEnd = fullStart + m[0].length;
    let blocked = false;
    for (let i = fullStart; i < fullEnd; i++) {
      if (consumed[i]) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    markConsumed(consumed, fullStart, fullEnd);
    // Mark covers the WHOLE span. open/close ranges collapse to zero
    // length so normalize doesn't emit delim decorations — the chars
    // stay visible, the mark wrapper handles styling on its own.
    out.push({
      type: 'html_comment',
      from: fullStart,
      to: fullEnd,
      openFrom: fullStart,
      openTo: fullStart,
      closeFrom: fullEnd,
      closeTo: fullEnd,
      opaque: true,
    });
  }
  return out;
}

export const htmlComment: SyntaxFeature = {
  name: 'html-comment',

  marks: {
    html_comment: {
      inclusive: false,
      parseDOM: [{ tag: 'mark-comment' }],
      toDOM: () => ['mark-comment', 0],
    },
  },

  // md-it with `html: false` already lets `<!-- ... -->` flow through as
  // plain text (verified). Method-B handles the rest.

  markDelims: {
    html_comment: { open: '', close: '' },
  },

  inline: {
    order: 0.5,
    derive: (ctx) => scanComment(ctx.text, ctx.consumed),
    markNames: ['html_comment'],
    extRanges: (parent) => {
      const ranges: Array<[number, number]> = [];
      const t = parent.type.schema.marks.html_comment;
      if (!t) return ranges;
      let start = -1;
      let off = 0;
      const flush = (end: number): void => {
        if (start >= 0) ranges.push([start, end]);
        start = -1;
      };
      parent.forEach((child) => {
        if (child.isText) {
          const has = child.marks.some((m) => m.type === t);
          if (has) {
            if (start < 0) start = off;
          } else {
            flush(off);
          }
        }
        off += child.nodeSize;
      });
      flush(off);
      return ranges;
    },
  },
};
