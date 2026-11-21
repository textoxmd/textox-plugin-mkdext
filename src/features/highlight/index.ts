import './highlight.css';

import { highlightFormatItem } from './format-item';
import { applyHighlightColorStyle } from './settings';
import { highlightSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

/** `==text==` 行内高亮 + 格式栏按钮 + 可配置底色（`--highlight-color` 变量）。 */
export const highlightFeature: MkdextFeature = {
  id: 'highlight',
  register: ({ editor, settings }) => [
    editor.registerSyntaxFeature(highlightSyntaxFeature),
    editor.registerFormatToolbarItem(highlightFormatItem),
    // 颜色样式表随特性一起释放：关闭高亮（或改色触发重装）时先移除再重建
    applyHighlightColorStyle(settings.get('highlightColor')),
  ],
};
