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
    subSup: {
      label: 'Subscript & superscript',
      description: 'Write ~sub~ and ^sup^ to lower or raise text',
    },
    underline: {
      label: 'Underline',
      description: 'Wrap the selected text in <u>…</u>',
    },
    emoji: {
      label: 'Emoji',
      description: 'Type shortcodes like :smile: to insert emoji',
    },
    autoPair: {
      label: 'Auto pair',
      description: 'Automatically close brackets and parentheses while typing',
    },
    headingIndicator: {
      label: 'Heading badge',
      description: 'Show the heading level (H1–H6) next to the active heading',
    },
    toc: {
      label: 'Table of contents',
      description: 'Build a live outline of the document headings from [toc]',
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
    subSup: {
      label: '下标与上标',
      description: '用 ~sub~ 与 ^sup^ 为文本添加下标与上标',
    },
    underline: {
      label: '下划线',
      description: '用 <u>…</u> 为选中文本添加下划线',
    },
    emoji: {
      label: '表情符号',
      description: '输入 :smile: 等短代码插入表情',
    },
    autoPair: {
      label: '自动配对',
      description: '输入时自动补全配对括号',
    },
    headingIndicator: {
      label: '标题角标',
      description: '在光标所在标题旁显示标题级别（H1–H6）',
    },
    toc: {
      label: '目录',
      description: '输入 [toc] 生成随文档标题实时更新的目录块',
    },
  },
};
