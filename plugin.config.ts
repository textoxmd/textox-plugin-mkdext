export default {
  id: 'app.textox.mkdext',
  name: 'Markdown Extensions',
  version: '0.1.0',
  minAppVersion: '2.4.0',
  description: 'Editor-native Markdown syntax extensions packaged as a single plugin.',
  author: { name: 'Textox', id: 'textox' },
  category: 'editor',
  icon: 'wand-sparkles',
  defaultEnabled: true,
  settings: [
    {
      key: 'alert',
      type: 'boolean',
      labelKey: 'alert.label',
      descriptionKey: 'alert.description',
      default: true,
      group: 'editor',
      groupLabelKey: 'groups.editor',
      apply: 'immediate',
    },
  ],
} as const;
