import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mathRenderWidgetBuilder } from './inline-render';

// 回归守护：编辑器 `buildWidget` 是急切构建 widget DOM 的（每次事务重建
// DecorationSet 都会调 builder），而 PM 会按 key 复用旧 DOM、丢弃新建元素。
// 因此 builder **不得**在元素尚未 connected 时 observe，否则每次事务都会
// 产生一个从未 connected、永不 disconnected 的孤儿观察目标，观察集合无上界增长。
describe('math widget observation lifecycle', () => {
  let observe: ReturnType<typeof vi.spyOn>;
  let unobserve: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    observe = vi.spyOn(IntersectionObserver.prototype, 'observe');
    unobserve = vi.spyOn(IntersectionObserver.prototype, 'unobserve');
  });

  afterEach(() => {
    observe.mockRestore();
    unobserve.mockRestore();
  });

  it('does not observe the render widget until it is connected', () => {
    const el = mathRenderWidgetBuilder({ latex: 'z' }, { documentDir: null });

    // 孤儿元素（PM 丢弃的那类）：从未 connected，不得被观察。
    expect(observe).not.toHaveBeenCalled();

    document.body.appendChild(el);
    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledWith(el);

    document.body.removeChild(el);
    expect(unobserve).toHaveBeenCalledWith(el);
  });
});

// 回归守护：在行内公式的渲染态上右键（非主键）不得移动光标——光标进入公式
// 范围会把渲染态切回源码。非主键 mousedown 只 preventDefault，不阻止冒泡，
// 让事件照常传给编辑器右键菜单流程。
describe('math widget non-primary mouse button', () => {
  it('preventDefaults non-primary mousedown but allows primary', () => {
    const el = mathRenderWidgetBuilder({ latex: 'x^2' }, { documentDir: null });
    expect(el.getAttribute('contenteditable')).toBe('false');

    const right = new MouseEvent('mousedown', { button: 2, bubbles: true, cancelable: true });
    el.dispatchEvent(right);
    expect(right.defaultPrevented).toBe(true);

    const left = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true });
    el.dispatchEvent(left);
    expect(left.defaultPrevented).toBe(false);
  });

  it('lets non-primary mousedown bubble to ancestors (no stopPropagation)', () => {
    const el = mathRenderWidgetBuilder({ latex: 'x^2' }, { documentDir: null });
    const parent = document.createElement('div');
    parent.appendChild(el);

    const seen: Event[] = [];
    parent.addEventListener('mousedown', (e) => seen.push(e));

    const right = new MouseEvent('mousedown', { button: 2, bubbles: true, cancelable: true });
    el.dispatchEvent(right);

    // 只 preventDefault、不得 stopPropagation：编辑器右键菜单流程依赖事件冒泡。
    expect(right.defaultPrevented).toBe(true);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(right);
  });
});
