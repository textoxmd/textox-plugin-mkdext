import type { Disposable, PluginApp } from '@textox/plugin-sdk';

/** 特性可用的宿主能力（由插件在 `applyFeatures` 时注入）。 */
export interface FeatureContext {
  editor: PluginApp['editor'];
  settings: PluginApp['settings'];
  /** 插件命名空间的翻译函数（key 不带插件前缀）。 */
  t: (key: string) => string;
}

/**
 * 一个 Markdown 语法特性。
 *
 * `id` 同时是设置键：`plugin.config.ts` 里声明一个同名 boolean 字段即可单独开关。
 * `register` 返回的资源会在特性被关闭或插件卸载时统一释放。
 */
export interface MkdextFeature {
  id: string;
  register(ctx: FeatureContext): Disposable | Disposable[];
}
