import './front-matter.css';

import { frontMatterSyntaxFeature } from './syntax/feature';
import { setTranslator } from './view/i18n';
import { configureViewMode, VIEW_MODE_KEY } from './view/mode';
import type { MkdextFeature } from '../types';

/** YAML front matter：文档开头的 `---` 元信息块 + 属性面板 NodeView。 */
export const frontMatterFeature: MkdextFeature = {
  id: 'frontMatter',
  register: ({ editor, settings, t }) => {
    // NodeView 拿不到宿主能力：视图模式读写走注入端口，文案走注入翻译器。
    configureViewMode({
      read: () => settings.get<string>(VIEW_MODE_KEY),
      write: (mode) => settings.set(VIEW_MODE_KEY, mode),
      subscribe: (listener) =>
        settings.onDidChange((snapshot) =>
          listener(snapshot.values[VIEW_MODE_KEY] === 'source' ? 'source' : 'panel'),
        ).dispose,
    });
    setTranslator((key) => t(key));
    const featureDisposable = editor.registerSyntaxFeature(frontMatterSyntaxFeature);
    return [
      featureDisposable,
      {
        dispose() {
          configureViewMode(null);
          setTranslator(null);
        },
      },
    ];
  },
};
