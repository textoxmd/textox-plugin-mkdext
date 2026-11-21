import { Plugin, type Disposable } from '@textox/plugin-sdk';

import { FEATURES } from './features';
import { defaultLocale, locales } from './locales';

/** 纯显示偏好：不属于特性装配，变化时不应重装特性。 */
const PREFERENCE_KEYS = new Set(['view']);

/**
 * Textox 的 Markdown 语法扩展包。
 *
 * 每个语法特性是一个独立的 `MkdextFeature`，在设置里各有开关：开关变化时统一
 * 释放已装配的资源再按最新配置重装（`editor.register*` 本身会请求编辑器重建
 * 语法管线，因此不需要手动刷新）。
 */
export default class MkdextPlugin extends Plugin {
  private featureResources: Disposable[] = [];
  /** 上次装配时的设置签名；显示偏好变化不参与比较。 */
  private lastSettingsSignature: string | null = null;

  onload(): void {
    this.addMessages(locales, defaultLocale);
    this.syncFeatures();
    this.disposables.add(this.settings.onDidChange(() => this.syncFeatures()));
  }

  onunload(): void {
    this.disposeFeatures();
    this.lastSettingsSignature = null;
  }

  /** 按当前设置重装特性：先全部释放，再装配启用项。 */
  private syncFeatures(): void {
    const signature = this.settingsSignature();
    // 订阅回调对任何设置变化都会触发，只有特性相关配置变了才值得整批重装。
    if (signature === this.lastSettingsSignature) return;
    this.lastSettingsSignature = signature;

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

  /**
   * 特性装配相关的设置签名：取全量配置、跳过纯显示偏好、按 key 排序，
   * `undefined` 归一为 `null` 以免 `JSON.stringify` 丢键造成签名碰撞。
   */
  private settingsSignature(): string {
    const values = this.settings.all().values;
    const entries = Object.keys(values)
      .filter((key) => !PREFERENCE_KEYS.has(key))
      .sort()
      .map((key) => [key, values[key] === undefined ? null : values[key]]);
    return JSON.stringify(entries);
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
