import { underlineFormatItem } from './format-item';
import { underlineSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

/** `<u>…</u>` 行内标记 + 悬浮 / 顶部工具栏按钮（`Mod-u`）。 */
export const underlineFeature: MkdextFeature = {
  id: 'underline',
  register: ({ editor }) => [
    editor.registerSyntaxFeature(underlineSyntaxFeature),
    editor.registerFormatToolbarItem(underlineFormatItem),
  ],
};
