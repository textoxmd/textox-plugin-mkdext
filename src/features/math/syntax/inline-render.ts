import {
  renderFormulaToSVG as renderFormula,
  type InlineDecorationWidgetBuilder,
} from '@textox/plugin-sdk';

// 定义 mathjax 自定义元素
if (typeof window !== 'undefined' && !customElements.get('math-jax')) {
  customElements.define(
    'math-jax',
    class MathJaxElement extends HTMLElement {
      constructor() {
        super();
        // 右键（非主键）不得移动光标：光标进入公式范围会把渲染态切回源码。
        // 只 preventDefault、不 stopPropagation，让事件照常冒泡给编辑器右键菜单流程。
        this.addEventListener('mousedown', (e) => {
          if (e.button !== 0) e.preventDefault();
        });
      }
      // data-render 是「连接后才懒观察」的开关：只有 render widget 需要它。
      // 放在 connectedCallback 而非 builder 里 observe，是因为 PM 逐事务重建
      // 装饰时会丢弃未挂载的孤儿元素——连接时才 observe，孤儿元素就不会进入
      // 观察集合，也就不会触发渲染回调泄漏。
      connectedCallback() {
        this.style.display = 'inline-block';
        this.style.verticalAlign = 'middle';
        this.style.lineHeight = '1';
        if (this.hasAttribute('data-render')) {
          getMathIntersectionObserver().observe(this);
        }
      }
      disconnectedCallback() {
        getMathIntersectionObserver().unobserve(this);
      }
      static get observedAttributes() {
        return ['latex', 'data-formula'];
      }
      attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue !== newValue && name === 'data-formula' && newValue) {
          this.removeAttribute('data-rendered');
        }
      }
    },
  );
}

// MathJax 渲染缓存
const svgCache = new Map<string, string>();
const CACHE_VERSION = 'v1';

// 全局 IntersectionObserver 用于延迟渲染
let mathIntersectionObserver: IntersectionObserver | null = null;

function getMathIntersectionObserver(): IntersectionObserver {
  if (!mathIntersectionObserver) {
    mathIntersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const placeholder = entry.target as HTMLElement;
            const texContent = placeholder.getAttribute('data-formula');
            if (texContent && !placeholder.hasAttribute('data-rendered')) {
              placeholder.setAttribute('data-rendered', 'true');
              renderInlineFormula(texContent).then((svg) => {
                if (svg && placeholder.isConnected) {
                  placeholder.innerHTML = svg;
                } else if (placeholder.isConnected) {
                  placeholder.textContent = texContent;
                }
              });
            }
            mathIntersectionObserver?.unobserve(placeholder);
          }
        });
      },
      { root: null, rootMargin: '100px', threshold: 0 },
    );
  }
  return mathIntersectionObserver;
}

/** 使用共享运行时渲染公式为 SVG；本模块保留缓存与行内装饰。 */
async function renderInlineFormula(texString: string): Promise<string | null> {
  const cacheKey = `${CACHE_VERSION}:${texString}`;
  const cached = svgCache.get(cacheKey);
  if (cached) return cached;

  try {
    const svg = await renderFormula(texString, {
      mode: 'inline',
      decorate: (el) => {
        const viewBox = el.getAttribute('viewBox');
        const values = viewBox
          ? viewBox.split(' ').map(Number).filter((v) => !Number.isNaN(v))
          : [];
        if (values.length !== 4) {
          el.setAttribute('viewBox', '0 -700 1000 1400');
        }
        el.style.pointerEvents = 'none';
      },
    });
    svgCache.set(cacheKey, svg);
    return svg;
  } catch (err) {
    console.error('Math render error:', err);
    return null;
  }
}

function createMathJaxElement(latex: string): HTMLElement {
  const el = document.createElement('math-jax');
  el.setAttribute('latex', latex);
  el.setAttribute('data-formula', latex);
  el.setAttribute('contenteditable', 'false');
  el.textContent = latex;
  return el;
}

/** 光标在公式外：异步渲染 SVG。光标在公式内时由内容范围的 softInside 处理。 */
export const mathRenderWidgetBuilder: InlineDecorationWidgetBuilder = (attrs) => {
  const el = createMathJaxElement(attrs.latex ?? '');
  el.setAttribute('data-render', '1');
  return el;
};
