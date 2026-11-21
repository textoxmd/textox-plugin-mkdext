import type { FormatToolbarItemMeta } from '@textox/plugin-sdk';

export const underlineFormatItem: FormatToolbarItemMeta = {
  id: 'underline',
  markName: 'underline',
  delim: '<u>',
  closeDelim: '</u>',
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.underline.label`）
  labelKey: 'underline.label',
  icon: 'underline',
  order: 4,
};
