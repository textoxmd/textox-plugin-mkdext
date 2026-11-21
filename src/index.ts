import { Plugin, type Disposable } from '@textox/plugin-sdk';

import { FEATURES } from './features';
import { defaultLocale, locales } from './locales';

/**
 * Textox 的 Markdown 语法扩展包。
 *
 * 每个语法特性是一个独立的 `MkdextFeature`，在设置里各有开关：开关变化时统一
 * 释放已装配的资源再按最新配置重装（`editor.register*` 本身会请求编辑器重建
 * 语法管线，因此不需要手动刷新）。
 */
export default class MkdextPlugin extends Plugin {
  private featureResources: Disposable[] = [];

  onload(): void {
    this.addMessages(locales, defaultLocale);
    this.syncFeatures();
    this.disposables.add(this.settings.onDidChange(() => this.syncFeatures()));
  }

  onunload(): void {
    this.disposeFeatures();
  }

  /** 按当前设置重装特性：先全部释放，再装配启用项。 */
  private syncFeatures(): void {
    this.disposeFeatures();
    for (const feature of FEATURES) {
      if (this.settings.get<boolean>(feature.id) === false) continue;
      try {
        const resources = feature.register({
          editor: this.app.editor,
          settings: this.settings,
          t: (key) => this.t(key),
        });
        this.featureResources.push(...(Array.isArray(resources) ? resources : [resources]));
      } catch (error) {
        // 单个特性装配失败只影响自身，其余特性照常工作
        this.app.log.error(`feature ${feature.id} failed to load`, error);
      }
    }
  }

  private disposeFeatures(): void {
    for (const resource of this.featureResources) {
      try {
        resource.dispose();
      } catch (error) {
        this.app.log.warn('feature dispose failed', error);
      }
    }
    this.featureResources = [];
  }
}
