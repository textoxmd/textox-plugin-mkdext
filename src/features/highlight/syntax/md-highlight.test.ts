import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import markPlugin from 'markdown-it-mark';
import type Token from 'markdown-it/lib/token.mjs';

/**
 * 解析行内 token 流（已滤掉 markdown-it 核心 emphasis 的零长度 text 残留）。
 *
 * 为什么滤：markdown-it 的 `emphasis.postProcess` 在把相邻两个单 `*` 分隔符
 * 合并成 `strong` 时，只把这两个 token 的 `content` 置空、并不从 token 流里
 * 删除它们（见 markdown-it/lib/rules_inline/emphasis.mjs 的 `isStrong` 分支）。
 * 于是 `**b**` 的 token 序列是
 *   `text('') · strong_open · text('b') · strong_close · text('')`
 * 这是 markdown-it 核心的分词产物，与 markdown-it-mark 无关（不装本插件也能
 * 复现），所以不该写进下面「插件行为契约」的断言里。若删掉这个 filter，
 * 「与 emphasis 双向嵌套」会因为凭空多出 `text` 而变红 —— 那不是回归。
 */
function inlineTokens(src: string): Token[] {
  const md = new MarkdownIt('commonmark').use(markPlugin);
  const tokens: Token[] = [];
  md.inline.parse(src, md, {}, tokens);
  // 只滤「类型为 text 且内容为空」的残留；不要放宽成「过滤所有空 content token」
  // 或「过滤所有 text」——mark_open / mark_close / strong_* 本身 content 就是空串。
  return tokens.filter((t) => !(t.type === 'text' && t.content === ''));
}

function inlineTypes(src: string): string[] {
  return inlineTokens(src).map((t) => t.type);
}

// 这些断言把「我们依赖的 markdown-it-mark 行为」钉住：升级该包或改 md-it
// 大版本时，先在这里失败，而不是在编辑器里静默改变语义。
describe('markdown-it-mark 行为契约', () => {
  it('成对分隔符产出 mark_open / mark_close', () => {
    expect(inlineTypes('==x==')).toEqual(['mark_open', 'text', 'mark_close']);
  });

  it('mark_open / mark_close 的 markup 是 ==（定位器按 markup.length 计算占用）', () => {
    const delims = inlineTokens('==x==')
      .filter((t) => t.type.startsWith('mark_'))
      .map((t) => [t.type, t.markup]);
    expect(delims).toEqual([
      ['mark_open', '=='],
      ['mark_close', '=='],
    ]);
  });

  it('内容里可以出现单个 =', () => {
    expect(inlineTokens('==a=b==').map((t) => [t.type, t.content])).toEqual([
      ['mark_open', ''],
      ['text', 'a=b'],
      ['mark_close', ''],
    ]);
  });

  it('与 emphasis 双向嵌套', () => {
    expect(inlineTypes('==**b**==')).toEqual([
      'mark_open',
      'strong_open',
      'text',
      'strong_close',
      'mark_close',
    ]);
    expect(inlineTypes('**==b==**')).toEqual([
      'strong_open',
      'mark_open',
      'text',
      'mark_close',
      'strong_close',
    ]);
  });

  it('链接文字内生效', () => {
    expect(inlineTypes('[==x==](u)')).toEqual([
      'link_open',
      'mark_open',
      'text',
      'mark_close',
      'link_close',
    ]);
  });

  it('奇数 run 拆成 = + ==…== + =', () => {
    expect(inlineTokens('===x===').map((t) => [t.type, t.content])).toEqual([
      ['text', '='],
      ['mark_open', ''],
      ['text', 'x'],
      ['mark_close', ''],
      ['text', '='],
    ]);
  });

  it('未配对 / 空白贴边不成对', () => {
    expect(inlineTypes('==x')).not.toContain('mark_open');
    expect(inlineTypes('== x ==')).not.toContain('mark_open');
    expect(inlineTypes('==x ==')).not.toContain('mark_open');
  });

  it('转义与行内代码优先', () => {
    expect(inlineTypes('\\==x==')).not.toContain('mark_open');
    expect(inlineTypes('`==x==`')).toEqual(['code_inline']);
  });
});
