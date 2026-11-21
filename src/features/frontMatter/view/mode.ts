import type { ViewMode } from './types';

/** 视图模式在插件配置里的键（`plugin.config.ts` 的 `view` 字段）。 */
export const VIEW_MODE_KEY = 'view';
const DEFAULT: ViewMode = 'panel';

/**
 * 视图模式的宿主能力端口（由特性装配注入；编辑器 NodeView 拿不到 `PluginApp`）。
 * 读写与订阅都走插件设置，`configureViewMode(null)` 即断开。
 */
interface ViewModePort {
  read(): string | undefined;
  write(mode: ViewMode): void | Promise<void>;
  subscribe(listener: (mode: ViewMode) => void): () => void;
}

let port: ViewModePort | null = null;

/** 由特性装配（或测试）注入端口；传 null 断开。 */
export function configureViewMode(next: ViewModePort | null): void {
  port = next;
}

/** 读当前视图模式：只有显式配置为 `source` 才是源码态，其余（含未配置）都是面板。 */
export function readViewMode(): ViewMode {
  if (!port) return DEFAULT;
  return port.read() === 'source' ? 'source' : DEFAULT;
}

/** 订阅视图模式变更；无端口时返回空退订函数。 */
export function subscribeViewMode(cb: (mode: ViewMode) => void): () => void {
  if (!port) return () => {};
  return port.subscribe((mode) => cb(mode === 'source' ? 'source' : DEFAULT));
}

/** 写视图模式（无端口时 no-op）。 */
export async function writeViewMode(mode: ViewMode): Promise<void> {
  await port?.write(mode);
}
