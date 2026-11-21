// 最可能随升级先红的两处：`math_inline_double` 的 token 名、brackets 模式
// 对内容首尾空格的保留。

import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

import { registerMathRules } from './md-rules';

/** 与生产同一套配置（`registerMathRules`）。 */
function makeMd(): MarkdownIt {
  const md = new MarkdownIt('commonmark', { html: false });
  registerMathRules(md);
  return md;
}

function inlineTokens(src: string): Token[] {
  const md = makeMd();
  const tokens: Token[] = [];
  md.inline.parse(src, md, {}, tokens);
  return tokens;
}

function inlineTypes(src: string): string[] {
  return inlineTokens(src).map((t) => t.type);
}

function blockTypes(src: string): string[] {
  return makeMd().parse(src, {}).map((t) => t.type);
}

function tokenOf(src: string, type: string): Token | undefined {
  return inlineTokens(src).find((t) => t.type === type);
}

// 升级 markdown-it / texmath 时，先在这里失败，而不是在编辑器里静默改变语义。
describe('markdown-it-texmath 行为契约', () => {
  it('$…$ 产出单个 math_inline，markup 为 $', () => {
    expect(inlineTypes('$x$')).toEqual(['math_inline']);
    expect(tokenOf('$x$', 'math_inline')).toMatchObject({
      type: 'math_inline',
      markup: '$',
      content: 'x',
    });
  });

  it('内容保留原有字符（含空格与 ==）', () => {
    expect(tokenOf('$a b$', 'math_inline')?.content).toBe('a b');
    expect(tokenOf('$x^y$', 'math_inline')?.content).toBe('x^y');
    expect(tokenOf('$a==b==$', 'math_inline')?.content).toBe('a==b==');
  });

  it('$ 首尾带空格时不成公式', () => {
    for (const src of ['$ x$', '$x $', '$ x $', '$  x  $']) {
      expect(inlineTypes(src), `src=${src}`).not.toContain('math_inline');
    }
  });

  it('\\(…\\) 也产出 math_inline（brackets 模式），markup 为 \\(', () => {
    expect(inlineTypes('\\(y\\)')).toEqual(['math_inline']);
    expect(tokenOf('\\(y\\)', 'math_inline')).toMatchObject({
      markup: '\\(',
      content: 'y',
    });
    expect(tokenOf('\\( y \\)', 'math_inline')).toMatchObject({ content: ' y ' });
  });

  it('行内 $$…$$ 是 math_inline_double（本轮不认领）', () => {
    expect(inlineTypes('a $$x$$ b')).toEqual(['text', 'math_inline_double', 'text']);
    expect(tokenOf('a $$x$$ b', 'math_inline_double')?.markup).toBe('$$');
  });

  it('与 emphasis / link / code 的相对顺序稳定', () => {
    expect(inlineTypes('*$x$*')).toEqual(['em_open', 'math_inline', 'em_close']);
    expect(inlineTypes('[a$b$](u)')).toEqual(['link_open', 'text', 'math_inline', 'link_close']);
    expect(inlineTypes('`$x$`')).toEqual(['code_inline']);
  });

  it('转义的美元符号不成公式', () => {
    expect(inlineTypes('\\$x\\$')).not.toContain('math_inline');
  });

  it('brackets 的块规则未被注册（\\[…\\] 仍是普通段落）', () => {
    expect(blockTypes('\\[a\\](b)')).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(blockTypes('\\[x\\]')).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
  });

  it('数学规则排在 escape 之前（行为真值见「\\(…\\) 也产出 math_inline」用例）', () => {
    // 读 ruler 的私有字段，只作早期告警；`\(y\)` 是否退化成 text_special 才是真值。
    // 两条同名规则（dollars / brackets）都要在 escape 之前，故取 lastIndexOf。
    const md = makeMd();
    const rules = (md.inline.ruler as unknown as { __rules__: Array<{ name: string }> }).__rules__;
    const names = rules.map((r) => r.name);
    expect(names.indexOf('math_inline')).toBeGreaterThanOrEqual(0);
    expect(names.lastIndexOf('math_inline')).toBeLessThan(names.indexOf('escape'));
  });
});
