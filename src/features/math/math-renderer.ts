import type { PreviewRegion } from '@textox/plugin-sdk';
import { renderFormulaToSVG } from '@textox/plugin-sdk';
import type { Node as PMNode } from 'prosemirror-model';

/** 渲染区：把公式异步渲染为 SVG；`update` 时重渲染（编辑器在防抖后调用）。 */
export function createMathPreview(_node: PMNode): PreviewRegion {
  const dom = document.createElement('div');
  dom.className = 'math-preview';
  let token = 0;
  return {
    dom,
    update(node, ctx) {
      const my = ++token;
      const text = node.textContent;
      if (!text.trim()) {
        dom.innerHTML = '<div class="cb-render-empty">Empty formula</div>';
        return;
      }
      dom.innerHTML = '<div class="cb-render-loading">Rendering...</div>';
      renderFormulaToSVG(text, {
        mode: 'display',
        decorate: (svg) => {
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
          // 不设 pointer-events: none —— 与 mermaid 预览保持一致：让渲染出的 svg
          // 本身作为命中目标（右键不会把插入点带进块内），左键仍可点进块内编辑
          // （事件冒泡到块的 render 容器）。
        },
      })
        .then((svg) => {
          if (my !== token) return;
          dom.innerHTML = `<div class="math-svg-container">${svg}</div>`;
        })
        .catch((err) => {
          if (my !== token) return;
          ctx.onError((err as Error)?.message ?? String(err));
        });
    },
    destroy() {
      token += 1;
    },
  };
}
