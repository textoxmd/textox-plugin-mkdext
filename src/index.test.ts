import { describe, expect, it, vi } from 'vitest';
import type { PluginApp, PluginManifest, SettingsSnapshot } from '@textox/plugin-sdk';

import MkdextPlugin from './index';

/** 构造满足 `PluginApp` 的最小桩，设置读写走内存并手动触发变更。 */
function createApp(initial: Record<string, unknown>) {
  // 只装配被点名的特性：其余开关显式关掉（默认值语义由 `plugin.config.ts` 提供）。
  const values: Record<string, unknown> = {
    subSup: false,
    underline: false,
    emoji: false,
    autoPair: false,
    headingIndicator: false,
    toc: false,
    ...initial,
  };
  const listeners = new Set<(snapshot: SettingsSnapshot) => void>();
  const snapshot = (): SettingsSnapshot => ({
    values: { ...values },
    read: (() => ({ ...values })) as SettingsSnapshot['read'],
  });

  const registerSyntaxFeature = vi.fn(() => ({ dispose: vi.fn() }));
  const app = {
    version: '0.0.0-test',
    edition: 'full',
    register: vi.fn(() => ({ dispose: vi.fn() })),
    workspace: {
      getActiveFilePath: () => null,
      getDocumentDir: () => null,
      openFile: vi.fn(),
      registerFileEditor: vi.fn(() => ({ dispose: vi.fn() })),
    },
    editor: {
      insertText: vi.fn(),
      canEdit: () => true,
      registerEmbed: vi.fn(() => ({ dispose: vi.fn() })),
      parseEmbedRef: () => null,
      registerSyntaxFeature,
      registerExtension: vi.fn(() => ({ dispose: vi.fn() })),
      registerFormatToolbarItem: vi.fn(() => ({ dispose: vi.fn() })),
      registerContextMenuItem: vi.fn(() => ({ dispose: vi.fn() })),
      registerSelectionAction: vi.fn(() => ({ dispose: vi.fn() })),
      registerSyntaxHighlight: vi.fn(() => ({ dispose: vi.fn() })),
      registerInsertCommand: vi.fn(() => ({ dispose: vi.fn() })),
      requestReload: vi.fn(),
    },
    documents: { createNewDocument: vi.fn() },
    settings: {
      get: (key: string) => values[key],
      set: (key: string, value: unknown) => {
        values[key] = value;
        for (const listener of listeners) listener(snapshot());
      },
      all: snapshot,
      onDidChange: (listener: (s: SettingsSnapshot) => void) => {
        listeners.add(listener);
        return { dispose: () => listeners.delete(listener) };
      },
    },
    i18n: { t: (key: string) => key, addMessages: vi.fn() },
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as unknown as PluginApp & { settings: { set(key: string, value: unknown): void } };

  return { app, values };
}

const manifest: PluginManifest = {
  id: 'app.textox.mkdext',
  name: 'Markdown Extensions',
  version: '0.1.0',
  minAppVersion: '2.4.0',
  author: { name: 'Textox' },
};

describe('MkdextPlugin 特性装配', () => {
  it('装配启用的特性', () => {
    const { app } = createApp({ alert: true });
    const plugin = new MkdextPlugin(app, manifest);
    plugin.onload();

    expect(app.editor.registerSyntaxFeature).toHaveBeenCalledTimes(1);
  });

  it('开关关闭时释放特性资源且不再注册', () => {
    const { app } = createApp({ alert: true });
    const plugin = new MkdextPlugin(app, manifest);
    plugin.onload();

    const disposable = vi.mocked(app.editor.registerSyntaxFeature).mock.results[0]?.value as {
      dispose: () => void;
    };
    app.settings.set('alert', false);

    expect(disposable.dispose).toHaveBeenCalledTimes(1);
    expect(app.editor.registerSyntaxFeature).toHaveBeenCalledTimes(1);
  });

  it('重新开启后重新注册', () => {
    const { app } = createApp({ alert: false });
    const plugin = new MkdextPlugin(app, manifest);
    plugin.onload();
    expect(app.editor.registerSyntaxFeature).not.toHaveBeenCalled();

    app.settings.set('alert', true);
    expect(app.editor.registerSyntaxFeature).toHaveBeenCalledTimes(1);
  });

  it('卸载时释放全部特性资源', () => {
    const { app } = createApp({ alert: true });
    const plugin = new MkdextPlugin(app, manifest);
    plugin.onload();

    const disposable = vi.mocked(app.editor.registerSyntaxFeature).mock.results[0]?.value as {
      dispose: () => void;
    };
    plugin.onunload();

    expect(disposable.dispose).toHaveBeenCalledTimes(1);
  });
});
