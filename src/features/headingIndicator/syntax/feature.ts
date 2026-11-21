import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Schema } from 'prosemirror-model';
import type { SyntaxFeature } from '@textox/plugin-sdk';

const FOCUS_META = 'headingTypeIndicator_focus';

function headingTypeIndicatorPlugin(_schema: Schema) {
  const key = new PluginKey<DecorationSet>('headingTypeIndicator');
  let editorFocused = false;

  return new Plugin<DecorationSet>({
    key,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, _old, _oldState, newState) => {
        const focusMeta = tr.getMeta(FOCUS_META);
        if (focusMeta !== undefined) {
          editorFocused = focusMeta;
        }
        // The label is a class/attribute on the heading, not a widget node,
        // so it no longer interferes with IME — keep it stable during
        // composition (no DOM mutations mid-composition).
        if (!editorFocused) return DecorationSet.empty;
        return buildDecos(newState);
      },
    },
    props: {
      decorations(state) {
        return key.getState(state);
      },
      handleDOMEvents: {
        focus: (view) => {
          if (!editorFocused) {
            view.dispatch(view.state.tr.setMeta(FOCUS_META, true));
          }
          return false;
        },
        blur: (view) => {
          if (editorFocused) {
            view.dispatch(view.state.tr.setMeta(FOCUS_META, false));
          }
          return false;
        },
      },
    },
  });
}

// The H-label is a NODE decoration (a class + data-label on the heading
// element) rendered via CSS `::before`, NOT a widget inside the block.
// A `contenteditable="false"` widget sits at the caret position in an
// empty heading, which WebKit can't anchor an IME composition to — the
// pinyin stays in the heading while the committed character lands on
// another line. A class only mutates the element attribute, so the
// composition always has clean editable text to anchor to.
function findHeadingAt(
  $pos: import('prosemirror-model').ResolvedPos,
): { level: number; from: number; to: number } | null {
  for (let d = $pos.depth; d >= 0; d--) {
    const node = $pos.node(d);
    if (node.type.name === 'heading') {
      return {
        level: node.attrs.level as number,
        from: $pos.before(d),
        to: $pos.before(d) + node.nodeSize,
      };
    }
  }
  return null;
}

function buildDecos(state: import('prosemirror-state').EditorState): DecorationSet {
  const { $from, $to } = state.selection;

  const heading = findHeadingAt($from) ?? findHeadingAt($to);
  if (!heading || heading.level < 1 || heading.level > 6) {
    return DecorationSet.empty;
  }

  const deco = Decoration.node(heading.from, heading.to, {
    class: 'heading-type-indicator',
    'data-label': `H${heading.level}`,
  });
  return DecorationSet.create(state.doc, [deco]);
}

export const headingTypeIndicatorSyntaxFeature: SyntaxFeature = {
  name: 'heading-type-indicator',
  plugins: (schema) => [headingTypeIndicatorPlugin(schema)],
};
