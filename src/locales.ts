export const defaultLocale = 'en-US';

export const locales: Record<string, Record<string, unknown>> = {
  'en-US': {
    name: 'Markdown Extensions',
    description: 'Editor-native Markdown syntax extensions packaged as a single plugin.',
    groups: { editor: 'Editing' },
    alert: {
      label: 'Callout boxes',
      description: 'GitHub-style callouts using blockquote syntax, e.g. > [!NOTE]',
    },
  },
  'zh-CN': {
    name: 'Markdown 扩展',
    description: '以单个插件形式提供的编辑器原生 Markdown 语法扩展。',
    groups: { editor: '编辑' },
    alert: {
      label: '提示框',
      description: 'GitHub 风格的提示框，使用引用语法，如 > [!NOTE]',
    },
  },
};
