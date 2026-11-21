import { afterEach, describe, expect, it, vi } from 'vitest';
import { Schema } from 'prosemirror-model';
import type { Node as PMNode } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import type { EditorContextMenuCtx } from '@textox/plugin-sdk';

import { mathContextMenuItem } from './context-menu';

function makeSchema() {
  return new Schema({
    nodes: {
      doc: { content: 'block+' },
      paragraph: { group: 'block', content: 'inline*' },
      text: { group: 'inline' },
      code_block: {
        group: 'block',
        content: 'text*',
        attrs: { lang: { default: '' } },
      },
    },
  });
}

function ctx(block: EditorContextMenuCtx['block']): EditorContextMenuCtx {
  return { view: {} as EditorView, hasSelection: false, block };
}

function blockCtx(name: string, attrs: Record<string, unknown>, text = ''): EditorContextMenuCtx {
  const schema = makeSchema();
  const node = schema.nodes[name]!.create(attrs, text ? schema.text(text) : undefined) as PMNode;
  return ctx({ pos: 0, node });
}

const writeText = vi.fn(async () => {});
const originalClipboard = navigator.clipboard;

function stubClipboard(): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

afterEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', {
    value: originalClipboard,
    configurable: true,
  });
});

describe('mathContextMenuItem', () => {
  it('暴露 block 场景项元数据', () => {
    // 裸 slug + 裸 key：宿主桥接层补插件 id 前缀
    expect(mathContextMenuItem.id).toBe('math.copy-latex');
    expect(mathContextMenuItem.labelKey).toBe('math.copyLatex');
    expect(mathContextMenuItem.requires).toEqual(['block']);
    expect(mathContextMenuItem.order).toBe(10);
    expect(typeof mathContextMenuItem.run).toBe('function');
  });

  it('when 命中 latex/math 代码块，拒绝其它语言与段落', () => {
    const when = mathContextMenuItem.when!;
    expect(when(blockCtx('code_block', { lang: 'latex' }, 'x^2'))).toBe(true);
    expect(when(blockCtx('code_block', { lang: 'math' }, 'x^2'))).toBe(true);
    expect(when(blockCtx('code_block', { lang: 'javascript' }, 'const a = 1;'))).toBe(false);
    expect(when(blockCtx('paragraph', {}, 'hello'))).toBe(false);
  });

  it('when 对未命中块（block: null）返回 false', () => {
    const when = mathContextMenuItem.when!;
    expect(when(ctx(null))).toBe(false);
  });

  it('run 把代码块源码写入剪贴板', async () => {
    stubClipboard();

    await mathContextMenuItem.run(blockCtx('code_block', { lang: 'latex' }, '\\frac{1}{2}'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('\\frac{1}{2}');
  });

  it('run 对未命中块（block: null）不抛错且不写入', async () => {
    stubClipboard();

    await Promise.resolve(mathContextMenuItem.run(ctx(null)));
    expect(writeText).not.toHaveBeenCalled();
  });
});
