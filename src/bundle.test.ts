// 真实产物冒烟：直接加载 `dist/main.js`，用伪造的 PluginApp 跑 `onload`。
//
// 与其余单测（跑 `src/` 源码）互补——它验证的是**打包后的 bundle**：所有裸导入都能
// 在真实 `@textox/plugin-sdk` 上解析、没有缺失的导出、特性装配在真实构建产物里成立。
// 需要先 `bun run build`；未构建时自动跳过，避免干净 clone 上误报。
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import manifest from '../plugin.config';

const hasBundle = existsSync(resolve(process.cwd(), 'dist/main.js'));

type PluginInstance = { onload(): void; onunload(): void };
type PluginCtor = new (app: unknown, manifest: unknown) => PluginInstance;

async function loadBundle(): Promise<PluginCtor> {
  vi.resetModules();
  // 非字面量说明符：产物没有类型声明，动态导入让 TS 视为 any。
  const url = pathToFileURL(resolve(process.cwd(), 'dist/main.js')).href;
  const mod = (await import(/* @vite-ignore */ url)) as { default: PluginCtor };
  return mod.default;
}

function createApp(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {};
  for (const field of manifest.settings) values[field.key] = field.default;
  Object.assign(values, overrides);

  const listeners = new Set<(snapshot: unknown) => void>();
  const settings = {
    get: (key: string) => values[key],
    set: (key: string, value: unknown) => {
      values[key] = value;
      for (const listener of [...listeners]) listener({ values: { ...values } });
    },
    all: () => ({ values: { ...values }, read: (key: string) => values[key] }),
    onDidChange: (listener: (snapshot: unknown) => void) => {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
  };

  const registered: string[] = [];
  let seq = 0;
  const track =
    (kind: string) =>
    (value?: { id?: string }): { dispose(): void } => {
      registered.push(`${kind}:${value?.id ?? seq++}`);
      return { dispose: () => {} };
    };

  const app = {
    version: manifest.minAppVersion,
    edition: 'full',
    register: track('command'),
    editor: {
      insertText: () => {},
      canEdit: () => true,
      registerEmbed: track('embed'),
      parseEmbedRef: () => null,
      registerSyntaxFeature: track('syntax'),
      registerExtension: track('extension'),
      registerFormatToolbarItem: track('toolbar'),
      registerContextMenuItem: track('menu'),
      registerSelectionAction: track('selection'),
      registerSyntaxHighlight: track('highlight'),
      registerInsertCommand: track('insert'),
      requestReload: () => {},
    },
    workspace: {
      getActiveFilePath: () => null,
      getDocumentDir: () => null,
      openFile: async () => {},
      registerFileEditor: track('fileEditor'),
    },
    documents: { createNewDocument: async () => {} },
    settings,
    i18n: { t: (key: string) => key, addMessages: () => {} },
    toast: { info: () => {}, warn: () => {}, error: () => {} },
    log: { info: () => {}, warn: () => {}, error: () => {} },
  };

  return { app, registered };
}

const totalFeatures = manifest.settings.filter((field) => field.type === 'boolean').length;

describe.skipIf(!hasBundle)('dist bundle', () => {
  it('loads the built bundle and registers every enabled feature', async () => {
    const PluginClass = await loadBundle();
    const { app, registered } = createApp();
    const instance = new PluginClass(app, manifest);

    expect(() => instance.onload()).not.toThrow();
    expect(registered.length).toBeGreaterThan(10);

    const syntaxFeatures = registered.filter((entry) => entry.startsWith('syntax:')).length;
    expect(syntaxFeatures).toBe(totalFeatures + 3); // html 一个开关注册 4 个语法特性

    expect(() => instance.onunload()).not.toThrow();
  });

  it('skips disabled features', async () => {
    const PluginClass = await loadBundle();
    const { app, registered } = createApp({ toc: false, html: false });
    const instance = new PluginClass(app, manifest);
    instance.onload();

    const syntaxFeatures = registered.filter((entry) => entry.startsWith('syntax:')).length;
    expect(syntaxFeatures).toBe(totalFeatures + 3 - 1 - 4);
  });
});
