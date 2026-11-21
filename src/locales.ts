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
    highlight: {
      label: 'Highlight',
      description: 'Wrap text in == to add a highlight background',
      color: {
        label: 'Highlight color',
        description: 'Background color for highlighted text',
      },
    },
    html: {
      label: 'HTML support',
      description: 'Render GFM HTML blocks, inline tags and comments',
    },
    math: {
      label: 'Math',
      description: 'Render LaTeX math formulas inline and in fenced code blocks',
      copyLatex: 'Copy LaTeX Source',
    },
    footnote: {
      label: 'Footnote',
      description: 'Insert footnotes with references and definitions',
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
    highlight: {
      label: '高亮',
      description: '用 == 括选文本添加高亮背景',
      color: {
        label: '高亮颜色',
        description: '选中文本的高亮背景颜色',
      },
    },
    html: {
      label: 'HTML 支持',
      description: '渲染 GFM HTML 块、内联标签与注释',
    },
    math: {
      label: '数学公式',
      description: '渲染行内与代码块中的 LaTeX 数学公式',
      copyLatex: '复制 LaTeX 源码',
    },
    footnote: {
      label: '脚注',
      description: '插入带引用与定义的脚注',
    },
  },
};
