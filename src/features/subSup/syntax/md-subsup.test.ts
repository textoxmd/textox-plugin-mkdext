import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import subPlugin from 'markdown-it-sub';
import supPlugin from 'markdown-it-sup';
import type Token from 'markdown-it/lib/token.mjs';

/**
 * 只钉 md-it 层行为：commonmark preset + html:false，并启用 strikethrough
 * （生产由 strike 特性经 `mdItPlugins` 开启）。生产 parser 还额外禁用了
 * entity、替换了 escape / autolink 规则；`\~x\~` 那条用 `not.toContain`
 * 正是为了容忍 escape 表示上的差异。
 */
function makeMd(): MarkdownIt {
  return new MarkdownIt('commonmark', { html: false })
    .enable('strikethrough')
    .use(subPlugin)
    .use(supPlugin);
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

/** 只收纯 text token（`text_special` 是旁路转义，不在此列）。 */
function textContent(src: string): string[] {
  return inlineTokens(src)
    .filter((t) => t.type === 'text')
    .map((t) => t.content);
}

// 升级 markdown-it-sub / -sup 时，先在这里失败，而不是在编辑器里静默改变语义。
describe('markdown-it-sub / markdown-it-sup 行为契约', () => {
  it('~x~ / ^x^ 产出成对 token，markup 是单字符', () => {
    expect(inlineTypes('~x~')).toEqual(['sub_open', 'text', 'sub_close']);
    expect(
      inlineTokens('~x~')
        .filter((t) => t.type !== 'text')
        .map((t) => t.markup),
    ).toEqual(['~', '~']);
    expect(inlineTypes('^x^')).toEqual(['sup_open', 'text', 'sup_close']);
    expect(
      inlineTokens('^x^')
        .filter((t) => t.type !== 'text')
        .map((t) => t.markup),
    ).toEqual(['^', '^']);
  });

  it('内容含未转义空白时不成立', () => {
    for (const src of ['~a b~', '^a b^', '~a\tb~', '~ x~', '~x ~']) {
      expect(inlineTypes(src), `src=${src}`).toEqual(['text']);
    }
  });

  // 行内上下文：段落开头的同一源文会开围栏代码块，不在此用例范围。
  it('~~x~~ 归删除线；~~~x~~~ 是删除线 + 两侧字面 ~（行内）', () => {
    expect(inlineTypes('~~x~~')).toEqual(['s_open', 'text', 's_close']);
    expect(inlineTypes('~~~x~~~')).toEqual([
      'text',
      's_open',
      'text',
      's_close',
      'text',
    ]);
  });

  it('内容被压平成字面 text（嵌套标记不解析）', () => {
    expect(inlineTypes('~a^b^~')).toEqual(['sub_open', 'text', 'sub_close']);
    expect(textContent('~a^b^~')).toEqual(['a^b^']);
    expect(textContent('~*a*~')).toEqual(['*a*']);
  });

  it('转义：\\~x\\~ 不成下标；内容里的转义被反转义', () => {
    expect(inlineTypes('\\~x\\~')).not.toContain('sub_open');
    expect(textContent('~a\\ b~')).toEqual(['a b']);
    expect(textContent('~a\\~b~')).toEqual(['a~b']);
  });

  it('代码 span 优先，链接内仍可嵌套', () => {
    expect(inlineTypes('`~x~`')).toEqual(['code_inline']);
    expect(inlineTypes('[~x~](u)')).toEqual([
      'link_open',
      'sub_open',
      'text',
      'sub_close',
      'link_close',
    ]);
  });
});
