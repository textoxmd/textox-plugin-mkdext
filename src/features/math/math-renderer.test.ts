import type { Node as PMNode } from 'prosemirror-model';
import type { PreviewContext } from '@textox/plugin-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMathPreview } from './math-renderer';

function nodeStub(textContent: string): PMNode {
  return { textContent } as unknown as PMNode;
}

function previewContext(onError: (msg: string) => void = () => {}): PreviewContext {
  return { documentDir: null, theme: 'base', onError };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  delete (window as unknown as { MathJax?: unknown }).MathJax;
});

describe('createMathPreview', () => {
  it('returns an empty placeholder for blank input without loading MathJax', () => {
    const preview = createMathPreview(nodeStub(''));
    const node = nodeStub('   ');

    preview.update?.(node, previewContext());

    expect(preview.dom.innerHTML).toContain('cb-render-empty');
  });

  it('renders an SVG into the preview once MathJax resolves', async () => {
    const element = document.createElement('div');
    element.innerHTML = '<svg><g></g></svg>';
    (window as unknown as { MathJax?: unknown }).MathJax = {
      tex2svgPromise: vi.fn(async () => element),
    };

    const preview = createMathPreview(nodeStub('x^2'));
    preview.update?.(nodeStub('x^2'), previewContext());
    await flush();

    expect(preview.dom.innerHTML).toContain('math-svg-container');
    expect(preview.dom.querySelector('svg')).not.toBeNull();
  });

  it('reports render errors through ctx.onError', async () => {
    (window as unknown as { MathJax?: unknown }).MathJax = {
      tex2svgPromise: vi.fn(async () => {
        throw new Error('boom');
      }),
    };

    const onError = vi.fn();
    const preview = createMathPreview(nodeStub('y^3'));
    preview.update?.(nodeStub('y^3'), previewContext(onError));
    await flush();

    expect(onError).toHaveBeenCalledWith('boom');
  });

  it('re-renders identical formulas instead of caching', async () => {
    const element = document.createElement('div');
    element.innerHTML = '<svg><g></g></svg>';
    const tex2svgPromise = vi.fn(async () => element);
    (window as unknown as { MathJax?: unknown }).MathJax = { tex2svgPromise };

    const preview = createMathPreview(nodeStub('x^2'));
    preview.update?.(nodeStub('x^2'), previewContext());
    await flush();
    preview.update?.(nodeStub('x^2'), previewContext());
    await flush();

    expect(tex2svgPromise).toHaveBeenCalledTimes(2);
  });
});
