import type { FormatToolbarItemMeta } from '@textox/plugin-sdk';

export const underlineFormatItem: FormatToolbarItemMeta = {
  id: 'underline',
  markName: 'underline',
  delim: '<u>',
  closeDelim: '</u>',
  // 悬浮 / 顶部工具栏直接 `i18next.t(labelKey)`，插件文案挂在 `plugins` 命名空间
  // 的 `<插件 id>.<key>` 下，所以这里必须是完整 key。
  labelKey: 'app.textox.mkdext.underline.label',
  icon: 'underline',
  order: 4,
};
