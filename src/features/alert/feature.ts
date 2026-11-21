import { Plugin, PluginKey } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import type { SyntaxFeature } from "@textox/plugin-sdk";

import { buildAlertDecorations } from "./decoration";
import { ALERT_PATTERN } from "./pattern";
import { alertSplitPlugin } from "./split";

export const alertSyntaxFeature: SyntaxFeature = {
  name: "alert",

  mdItPlugins: [alertSplitPlugin],

  inline: {
    markNames: [],
    extRanges: (parent) => {
      if (parent.type.name !== "paragraph") return [];
      const match = parent.textContent.match(ALERT_PATTERN);
      return match ? [[0, match[0].length]] : [];
    },
  },

  plugins: (_schema) => [
    new Plugin({
      key: new PluginKey("alert-decoration"),
      props: {
        decorations(state) {
          const decos = buildAlertDecorations(state.doc, state.selection.$head.pos);
          return decos.length > 0
            ? DecorationSet.create(state.doc, decos)
            : DecorationSet.empty;
        },
      },
    }),
  ],
};
