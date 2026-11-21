import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  configureViewMode,
  readViewMode,
  subscribeViewMode,
  VIEW_MODE_KEY,
  writeViewMode,
} from './mode';
import type { ViewMode } from './types';

/** 注入式端口的可控桩：记录一次读写/订阅，并允许手动触发变更。 */
function makePort(initial?: string) {
  let value = initial;
  const listeners = new Set<(mode: ViewMode) => void>();
  const read = vi.fn(() => value);
  const write = vi.fn((mode: ViewMode) => {
    value = mode;
    for (const listener of listeners) listener(mode);
  });
  const subscribe = vi.fn((listener: (mode: ViewMode) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  });
  return { port: { read, write, subscribe }, read, write, subscribe, listeners };
}

afterEach(() => configureViewMode(null));

describe('view mode', () => {
  it('无端口时缺省为 panel（读写退化为 no-op，订阅返回空函数）', async () => {
    expect(readViewMode()).toBe('panel');
    await expect(writeViewMode('source')).resolves.toBeUndefined();
    const off = subscribeViewMode(vi.fn());
    expect(typeof off).toBe('function');
    expect(() => off()).not.toThrow();
  });

  it('配置为 source 时读回 source', () => {
    const { port, read } = makePort('source');
    configureViewMode(port);
    expect(readViewMode()).toBe('source');
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("非 'source' 的取值（含 undefined / panel / 任意串）都回退 panel", () => {
    for (const raw of [undefined, 'panel', 'list', '']) {
      const { port } = makePort(raw);
      configureViewMode(port);
      expect(readViewMode()).toBe('panel');
    }
  });

  it('键名与 plugin.config.ts 的字段一致', () => {
    expect(VIEW_MODE_KEY).toBe('view');
  });

  it('writeViewMode 调端口 write 并传当前模式', async () => {
    const { port, write } = makePort('panel');
    configureViewMode(port);
    await writeViewMode('source');
    expect(write).toHaveBeenCalledWith('source');
    // 写回后读到的就是新值（同一端口）。
    expect(readViewMode()).toBe('source');
  });

  it('端口 write 返回 Promise 时 writeViewMode 等待其完成', async () => {
    let resolved = false;
    configureViewMode({
      read: () => 'panel',
      write: () =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            resolved = true;
            resolve();
          }, 0);
        }),
      subscribe: () => () => {},
    });
    await writeViewMode('source');
    expect(resolved).toBe(true);
  });

  it('订阅在模式变更时回调，并把非 source 的取值归一为 panel', () => {
    const { port, listeners } = makePort('panel');
    configureViewMode(port);
    const cb = vi.fn();
    subscribeViewMode(cb);

    for (const listener of listeners) listener('source');
    expect(cb).toHaveBeenLastCalledWith('source');

    for (const listener of listeners) listener('panel');
    expect(cb).toHaveBeenLastCalledWith('panel');
  });

  it('退订后不再回调（端口退订函数被调用）', () => {
    const { port, subscribe, listeners } = makePort('panel');
    configureViewMode(port);
    const cb = vi.fn();
    const off = subscribeViewMode(cb);
    expect(subscribe).toHaveBeenCalledTimes(1);

    off();
    expect(listeners.size).toBe(0);
    for (const listener of listeners) listener('source');
    expect(cb).not.toHaveBeenCalled();
  });

  it('configureViewMode(null) 断开端口：读回 panel、订阅不再挂到旧端口', () => {
    const { port, subscribe } = makePort('source');
    configureViewMode(port);
    expect(readViewMode()).toBe('source');

    configureViewMode(null);
    expect(readViewMode()).toBe('panel');
    subscribeViewMode(vi.fn());
    expect(subscribe).not.toHaveBeenCalled();
  });
});
