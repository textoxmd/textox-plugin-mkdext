import type { Disposable } from '@textox/plugin-sdk';

/**
 * 预设色板：近似旧主题系统 `HIGHLIGHT_PRESETS` 的**亮色值**
 * （旧值为 `oklch(... / 0.35)`；此处只存基准色，透明度由 color-mix 派生）。
 */
export const HIGHLIGHT_PRESETS = [
  '#f7d54e', // yellow
  '#a3e07a', // green
  '#8ec5f2', // blue
  '#f2a0c0', // pink
  '#f7b267', // orange
  '#c9a7eb', // purple
] as const;

export const DEFAULT_HIGHLIGHT_COLOR: string = HIGHLIGHT_PRESETS[0];

const STYLE_ELEMENT_ID = 'texto-plugin-highlight-color';

/** 由单一基准色派生亮/暗两档透明度的 `--highlight-color` 声明。 */
export function highlightColorCss(color: string): string {
  const light = `color-mix(in oklab, ${color} 35%, transparent)`;
  const dark = `color-mix(in oklab, ${color} 50%, transparent)`;
  return `:root{--highlight-color:${light}}:root.dark{--highlight-color:${dark}}`;
}

/**
 * 把当前高亮色写入全局 `<style>`；缺省/非法配置回退默认色。
 *
 * 返回的 `Disposable` 移除该样式表：特性关闭时调用（宿主在设置变化时整体
 * 重装特性，因此不需要自己订阅设置）。
 */
export function applyHighlightColorStyle(raw?: unknown): Disposable {
  const color =
    typeof raw === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw)
      ? raw
      : DEFAULT_HIGHLIGHT_COLOR;
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  el.textContent = highlightColorCss(color);
  return {
    dispose(): void {
      document.getElementById(STYLE_ELEMENT_ID)?.remove();
    },
  };
}
