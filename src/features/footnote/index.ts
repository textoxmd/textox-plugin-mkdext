import './syntax/footnote.css';

import { footnoteInsert } from './insert';
import { footnoteFeature as footnoteSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

/** `[^1]` 引用 + 定义块（源保真 verbatim）+ 插入命令。 */
export const footnoteFeature: MkdextFeature = {
  id: 'footnote',
  register: ({ editor }) => [
    editor.registerSyntaxFeature(footnoteSyntaxFeature),
    editor.registerExtension({
      id: 'footnote.editor',
      insert: footnoteInsert,
      create() {
        return {};
      },
    }),
  ],
};
