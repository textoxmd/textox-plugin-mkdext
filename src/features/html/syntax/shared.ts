// Pure parsing primitives shared by the HTML block / inline features.
// No editor-internal imports: only the public runtime contracts.

import { markConsumed, type InlineSpan } from '@textox/plugin-sdk';

const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'base', 'basefont', 'blockquote', 'body', 'caption',
  'center', 'col', 'colgroup', 'dd', 'details', 'dialog', 'dir', 'div', 'dl', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1',
  'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'iframe', 'legend', 'li',
  'link', 'main', 'menu', 'menuitem', 'nav', 'noframes', 'ol', 'optgroup', 'option',
  'p', 'param', 'section', 'source', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th',
  'thead', 'title', 'tr', 'track', 'ul',
]);

const TYPE1_TAGS = new Set(['script', 'pre', 'style', 'textarea']);

export function matchHtmlStart(text: string): { tag: string } | null {
  if (/^\s{0,3}<!--$/.test(text)) return { tag: '!' };
  const m = text.match(/^\s{0,3}<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)>?$/);
  if (!m) return null;
  // 闭合标签（`</div>`）不成块：自动补全会生成 `</div>\n</div>` 的畸形内容。
  // 加载已有文档时 `</div>` 仍由解析器按 GFM type 6 处理为 html_block。
  if (m[1] === '/') return null;
  const tag = (m[2] ?? '').toLowerCase();
  const isType1 = TYPE1_TAGS.has(tag);
  if (!BLOCK_TAGS.has(tag) && !isType1) return null;
  if (!text.trimEnd().endsWith('>') && !isType1) return null;
  return { tag };
}

export const KNOWN_INLINE_TAGS = new Set([
  'span', 'kbd', 'abbr', 'cite', 'q', 'dfn', 'ins', 'small',
  'time', 'bdo', 'bdi', 'samp', 'var', 'data',
]);

export function parseAttrs(s: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(s))) {
    const val = m[2] ?? m[3] ?? m[4] ?? '';
    if (val) attrs[m[1]!] = val;
  }
  return attrs;
}

export function scanInlineHtml(text: string, consumed: Uint8Array): InlineSpan[] {
  const out: InlineSpan[] = [];
  let i = 0;

  while (i < text.length) {
    if (consumed[i] || text[i] !== '<') {
      i++;
      continue;
    }

    const next = text[i + 1];
    if (!next || next === '/' || next === '!') {
      i++;
      continue;
    }

    const tagStart = i + 1;
    let tagEnd = tagStart;
    while (tagEnd < text.length && /[a-zA-Z]/.test(text[tagEnd]!)) tagEnd++;
    if (tagEnd === tagStart) { i++; continue; }

    const tag = text.slice(tagStart, tagEnd).toLowerCase();
    if (!KNOWN_INLINE_TAGS.has(tag)) { i++; continue; }

    const attrStart = tagEnd;
    let openEnd = -1;
    let blocked = false;
    for (let j = attrStart; j < text.length; j++) {
      if (consumed[j]) { blocked = true; break; }
      if (text[j] === '>') { openEnd = j + 1; break; }
    }
    if (blocked || openEnd === -1) { i = openEnd > 0 ? openEnd : tagEnd; continue; }

    for (let k = i; k < openEnd; k++) {
      if (consumed[k]) { blocked = true; break; }
    }
    if (blocked) { i = openEnd; continue; }

    const attrRaw = text.slice(attrStart, openEnd - 1).trim();
    const attrs = parseAttrs(attrRaw);

    const closeTag = `</${tag}>`;
    let closeStart = -1;
    for (let j = openEnd; j < text.length; j++) {
      if (consumed[j]) continue;
      if (text.startsWith(closeTag, j)) {
        closeStart = j;
        break;
      }
    }
    if (closeStart === -1) { i = openEnd; continue; }

    const closeEnd = closeStart + closeTag.length;

    for (let k = closeStart; k < closeEnd; k++) {
      if (consumed[k]) { blocked = true; break; }
    }
    if (blocked) { i = closeEnd; continue; }

    const innerFrom = openEnd;
    const innerTo = closeStart;
    if (innerFrom >= innerTo) { i = closeEnd; continue; }

    markConsumed(consumed, i, openEnd);
    markConsumed(consumed, closeStart, closeEnd);

    const openLen = openEnd - i;
    const closeLen = closeEnd - closeStart;

    out.push({
      type: 'html_inline',
      from: innerFrom,
      to: innerTo,
      openFrom: i,
      openTo: openEnd,
      closeFrom: closeStart,
      closeTo: closeEnd,
      attrs: { tag, htmlAttrs: attrs, openLen, closeLen },
    });

    i = closeEnd;
  }

  return out;
}
