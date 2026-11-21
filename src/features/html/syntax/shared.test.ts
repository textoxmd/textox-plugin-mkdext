import { describe, expect, it } from 'vitest';

import { matchHtmlStart, parseAttrs, scanInlineHtml } from './shared';

describe('matchHtmlStart', () => {
  it('recognises block-level tags', () => {
    expect(matchHtmlStart('<div>')).toEqual({ tag: 'div' });
    expect(matchHtmlStart('  <table>')).toEqual({ tag: 'table' });
  });

  it('recognises type-1 tags without a trailing `>`', () => {
    expect(matchHtmlStart('<script>')).toEqual({ tag: 'script' });
    expect(matchHtmlStart('<style')).toEqual({ tag: 'style' });
  });

  it('recognises the comment opener', () => {
    expect(matchHtmlStart('<!--')).toEqual({ tag: '!' });
  });

  it('rejects closing tags', () => {
    expect(matchHtmlStart('</div>')).toBeNull();
  });

  it('rejects ordinary text', () => {
    expect(matchHtmlStart('hello world')).toBeNull();
  });

  it('rejects unknown tags', () => {
    expect(matchHtmlStart('<custom-widget>')).toBeNull();
  });
});

describe('parseAttrs', () => {
  it('parses double-quoted, single-quoted and valueless attrs', () => {
    expect(parseAttrs('class="a b" id=\'x\' hidden')).toEqual({ class: 'a b', id: 'x' });
  });

  it('returns an empty object for an empty string', () => {
    expect(parseAttrs('')).toEqual({});
  });
});

describe('scanInlineHtml', () => {
  it('finds a known inline wrapper and marks its delimiters consumed', () => {
    const text = '<span class="x">hi</span>';
    const consumed = new Uint8Array(text.length);

    const spans = scanInlineHtml(text, consumed);

    expect(spans).toHaveLength(1);
    const span = spans[0]!;
    expect(span.type).toBe('html_inline');
    expect(span.attrs?.tag).toBe('span');
    expect(span.attrs?.htmlAttrs).toEqual({ class: 'x' });
    expect(text.slice(span.from, span.to)).toBe('hi');
    expect(consumed[0]).toBe(1);
    expect(consumed[text.length - 1]).toBe(1);
  });

  it('ignores unknown inline tags', () => {
    const text = '<section>x</section>';
    expect(scanInlineHtml(text, new Uint8Array(text.length))).toHaveLength(0);
  });

  it('does not claim positions already consumed', () => {
    const text = '<span>x</span>';
    const consumed = new Uint8Array(text.length).fill(1);
    expect(scanInlineHtml(text, consumed)).toHaveLength(0);
  });
});
