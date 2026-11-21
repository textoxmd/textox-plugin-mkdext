import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Disposable, SettingsSnapshot } from '@textox/plugin-sdk';

import { frontMatterFeature } from './index';
import { frontMatterSyntaxFeature } from './syntax/feature';
import { t } from './view/i18n';
import { configureViewMode, readViewMode, subscribeViewMode, writeViewMode } from './view/mode';

/** 最小特性上下文：设置走内存并手动广播（与宿主 `settings.onDidChange` 同形）。 */
function makeCtx(initial: Record<string, unknown> = { view: 'panel' }) {
  const values: Record<string, unknown> = { ...initial };
  const listeners = new Set<(snapshot: SettingsSnapshot) => void>();
  const snapshot = (): SettingsSnapshot => ({
    values,
    read: ((key: string) => values[key]) as SettingsSnapshot['read'],
  });
  const registerSyntaxFeature = vi.fn(() => ({ dispose: vi.fn() }));
  const ctx = {
    editor: { registerSyntaxFeature },
    settings: {
      get: (key: string) => values[key],
      set: async (key: string, value: unknown) => {
        values[key] = value;
        for (const listener of listeners) listener(snapshot());
      },
      all: snapshot,
      onDidChange: (listener: (s: SettingsSnapshot) => void) => {
        listeners.add(listener);
        return { dispose: () => listeners.delete(listener) };
      },
    },
    t: (key: string) => `tr:${key}`,
  } as unknown as Parameters<typeof frontMatterFeature.register>[0];
  return { ctx, values, listeners, registerSyntaxFeature };
}

afterEach(() => configureViewMode(null));

describe('frontMatterFeature 装配', () => {
  it('注册语法特性并注入视图模式端口与翻译器', () => {
    const { ctx, registerSyntaxFeature } = makeCtx();
    const resources = frontMatterFeature.register(ctx);
    expect(Array.isArray(resources)).toBe(true);
    expect(registerSyntaxFeature).toHaveBeenCalledWith(frontMatterSyntaxFeature);
    expect(readViewMode()).toBe('panel');
    expect(t('frontMatter.panelTitle', 'fallback')).toBe('tr:frontMatter.panelTitle');
  });

  it('端口把读/写/订阅接到插件设置（view 键）', async () => {
    const { ctx, values } = makeCtx({ view: 'source' });
    frontMatterFeature.register(ctx);
    expect(readViewMode()).toBe('source');

    const cb = vi.fn();
    const off = subscribeViewMode(cb);
    await writeViewMode('panel');
    expect(values.view).toBe('panel');
    expect(cb).toHaveBeenCalledWith('panel');

    await writeViewMode('source');
    expect(values.view).toBe('source');
    expect(cb).toHaveBeenLastCalledWith('source');
    off();
  });

  it('释放后断开端口并清掉翻译器（回到默认值 / fallback）', () => {
    const { ctx } = makeCtx({ view: 'source' });
    const resources = frontMatterFeature.register(ctx) as Disposable[];
    expect(readViewMode()).toBe('source');

    for (const resource of resources) resource.dispose();
    expect(readViewMode()).toBe('panel');
    expect(t('frontMatter.panelTitle', 'fallback')).toBe('fallback');

    const cb = vi.fn();
    const off = subscribeViewMode(cb);
    expect(typeof off).toBe('function');
    off();
  });
});
