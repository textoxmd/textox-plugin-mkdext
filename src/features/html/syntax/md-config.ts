import type { SyntaxFeature } from '@textox/plugin-sdk';

// markdown-it configuration for HTML support. `html: true` lets block-level
// HTML survive parsing; disabling `html_inline` hands inline tags to the
// method-B scanner (see `syntax/inline.ts`).
export const htmlMdConfig: SyntaxFeature = {
  name: 'html:md-config',
  mdItPlugins: [
    (md) => {
      md.set({ html: true });
      md.inline.ruler.disable(['html_inline']);
    },
  ],
};
