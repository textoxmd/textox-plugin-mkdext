// 行首图标：按「属性名」给出——内置常用名各有专属 SVG；其余（自定义名）回退为圆形内首字符。
// 全部用 createElementNS 构建（不用 innerHTML）；24×24 viewBox、描边随 currentColor，尺寸由 CSS 控制。

import { canonicalKey } from "./key-presets";

const SVG_NS = "http://www.w3.org/2000/svg";

type Shape =
  | { tag: "path"; attrs: Record<string, string> }
  | { tag: "rect"; attrs: Record<string, string> }
  | { tag: "circle"; attrs: Record<string, string> };

const path = (d: string): Shape => ({ tag: "path", attrs: { d } });
const circle = (cx: number, cy: number, r: number): Shape => ({
  tag: "circle",
  attrs: { cx: String(cx), cy: String(cy), r: String(r) },
});
const rect = (x: number, y: number, w: number, h: number, rx: number): Shape => ({
  tag: "rect",
  attrs: { x: String(x), y: String(y), width: String(w), height: String(h), rx: String(rx) },
});

/** 内置属性名 → 专属图形（对齐常见 front matter 惯例）。 */
const KEY_SHAPES: Record<string, readonly Shape[]> = {
  title: [path("M4 7V4h16v3"), path("M9 20h6"), path("M12 4v16")],
  description: [path("M3 6h18"), path("M3 12h18"), path("M3 18h12")],
  summary: [path("M3 6h18"), path("M3 12h18"), path("M3 18h8")],
  tags: [
    path("M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"),
    circle(7, 7, 1.2),
  ],
  categories: [
    path("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"),
  ],
  status: [circle(12, 12, 9), path("M8 12.5l2.5 2.5L16 9")],
  type: [path("M12 2 2 7l10 5 10-5z"), path("M2 17l10 5 10-5"), path("M2 12l10 5 10-5")],
  priority: [path("M5 21V4"), path("M5 5h13l-2 3.5L18 12H5")],
  date: [rect(3, 5, 18, 16, 2), path("M3 10h18M8 3v4M16 3v4")],
  created: [circle(12, 12, 9), path("M12 7v5l3 2")],
  updated: [path("M21 12a9 9 0 1 1-2.6-6.4"), path("M21 4v6h-6")],
  author: [circle(12, 8, 3.5), path("M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5")],
  owner: [circle(12, 8, 3.5), path("M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"), path("M18 5l1 1.6 1.8.4-1.4 1.4.3 1.8-1.7-.9-1.7.9.3-1.8L15 7l1.8-.4z")],
  audience: [circle(9, 8, 3), path("M2 20c1-3 3.5-4.5 7-4.5s6 1.5 7 4.5"), circle(17.5, 9, 2.2)],
  language: [
    circle(12, 12, 9),
    path("M3 12h18"),
    path("M12 3c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9z"),
  ],
  version: [path("M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z")],
  related: [
    path("M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"),
    path("M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"),
  ],
  keywords: [path("M4 9h16M4 15h16M10 3 8 21M16 3l-2 18")],
  project: [rect(3, 4, 8, 16, 1.5), path("M15 4h6v9h-6z")],
  aliases: [path("M7 7h11l-3-3"), path("M17 17H6l3 3")],
  slug: [path("M9 4 7 20M17 4l-2 16M4 9h16M3 15h16")],
  draft: [path("M4 20l4-1L19 8l-3-3L5 16z"), path("M14 6l3 3")],
};

/** 所有图标的公共 SVG 属性（24×24 线性描边，颜色随 currentColor）。 */
const SVG_ATTRS: Record<string, string> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true",
};

/** 用给定 class 与图形定义构建一个内联 SVG。 */
function createIcon(className: string, shapes: readonly Shape[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", className);
  for (const [name, value] of Object.entries(SVG_ATTRS)) svg.setAttribute(name, value);
  for (const shape of shapes) {
    const el = document.createElementNS(SVG_NS, shape.tag);
    for (const [name, value] of Object.entries(shape.attrs)) el.setAttribute(name, value);
    svg.appendChild(el);
  }
  return svg;
}

/** 圆标内首字符：取首个字符并大写（空 key 留空）。 */
export function initialLetter(key: string): string {
  const first = Array.from(key.trim())[0] ?? "";
  return first.toUpperCase();
}

/** 自定义属性名：圆形底 + 首字符。 */
function createLetterIcon(key: string): HTMLElement {
  const el = document.createElement("span");
  el.className = "fm-ico fm-ico-letter";
  el.textContent = initialLetter(key);
  el.setAttribute("aria-hidden", "true");
  return el;
}

/** 按属性名构建行首图标：内置名（含别名）→ 内联 SVG；其余 → 圆形 + 首字符。 */
export function buildKeyIcon(key: string): HTMLElement | SVGSVGElement {
  const shapes = KEY_SHAPES[canonicalKey(key)];
  return shapes ? createIcon("fm-ico", shapes) : createLetterIcon(key);
}

/** 视图切换按钮的图标：`panel` 去源码（`</>`），`source` 回面板（列表）。 */
const TOGGLE_SHAPES: Record<"panel" | "source", readonly Shape[]> = {
  panel: [path("M16 18l6-6-6-6"), path("M8 6l-6 6 6 6")],
  source: [path("M3 5h18M3 12h18M3 19h18")],
};

/** 构建切换按钮图标（class=fm-toggle-icon）。 */
export function buildToggleIcon(mode: "panel" | "source"): SVGSVGElement {
  return createIcon("fm-toggle-icon", TOGGLE_SHAPES[mode]);
}
