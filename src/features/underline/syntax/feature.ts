import { markExtRanges } from '@textox/plugin-sdk';
import type { InlineSpan, SyntaxFeature } from '@textox/plugin-sdk';
import { TextSelection, type Command } from 'prosemirror-state';

function scanUnderline(text: string, consumed: Uint8Array): InlineSpan[] {
  const out: InlineSpan[] = [];
  const openDelim = '<u>';
  const closeDelim = '</u>';

  for (let i = 0; i < text.length; ) {
    if (consumed[i] || !text.startsWith(openDelim, i)) {
      i++;
      continue;
    }
    const openFrom = i;
    const openTo = i + openDelim.length;
    const innerFrom = openTo;

    let closeFrom = -1;
    for (let j = innerFrom; j < text.length; j++) {
      if (!consumed[j] && text.startsWith(closeDelim, j)) {
        closeFrom = j;
        break;
      }
    }
    if (closeFrom === -1) break;

    const closeTo = closeFrom + closeDelim.length;
    const innerTo = closeFrom;

    if (innerFrom >= innerTo) {
      i = closeTo;
      continue;
    }

    if (/\s/.test(text[innerFrom]!) || /\s/.test(text[innerTo - 1]!)) {
      i = innerFrom;
      continue;
    }

    for (let k = openFrom; k < closeTo; k++) consumed[k] = 1;

    out.push({ type: 'underline', from: innerFrom, to: innerTo, openFrom, openTo, closeFrom, closeTo, wrap: true });
    i = closeTo;
  }
  return out;
}

function toggleUnderline(): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection;
    if (empty) return false;
    const doc = state.doc;
    const openDelim = '<u>';
    const closeDelim = '</u>';
    const openLen = openDelim.length;
    const closeLen = closeDelim.length;
    const before = from >= openLen ? doc.textBetween(from - openLen, from) : '';
    const after = to + closeLen <= doc.content.size ? doc.textBetween(to, to + closeLen) : '';

    if (before === openDelim && after === closeDelim) {
      if (dispatch) {
        dispatch(state.tr.delete(to, to + closeLen).delete(from - openLen, from));
      }
      return true;
    }

    if (dispatch) {
      const text = doc.textBetween(from, to);
      const tr = state.tr.replaceWith(from, to, state.schema.text(openDelim + text + closeDelim));
      tr.setSelection(TextSelection.create(tr.doc, from + openLen, from + openLen + text.length));
      dispatch(tr);
    }
    return true;
  };
}

export const underlineSyntaxFeature: SyntaxFeature = {
  name: 'underline',
  marks: {
    underline: {
      parseDOM: [{ tag: 'u' }],
      toDOM: () => ['u', 0],
    },
  },
  markDelims: {
    underline: { open: '', close: '' },
  },
  inline: {
    order: 1,
    derive: (ctx) => scanUnderline(ctx.text, ctx.consumed),
    markNames: ['underline'],
    extRanges: (parent) => markExtRanges(parent, 'underline', 3, 4),
  },
  keymap: () => ({
    'Mod-u': toggleUnderline(),
  }),
};
