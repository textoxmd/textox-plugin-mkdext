import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';

import { footnoteSourceVerbatim, locateDefinition } from './source-verbatim';

const schema = new Schema({
  nodes: { doc: { content: 'block+' }, paragraph: { group: 'block', content: 'inline*' }, text: { group: 'inline' } },
});

function para(text: string) {
  return schema.nodes.paragraph!.create(null, [schema.text(text)]);
}

describe('footnoteSourceVerbatim', () => {
  it('matches definition paragraphs and keys by label', () => {
    expect(footnoteSourceVerbatim.matches(para('[^1]: x'))).toBe(true);
    expect(footnoteSourceVerbatim.matches(para('plain'))).toBe(false);
    expect(footnoteSourceVerbatim.keyOf(para('[^2]: x'))).toBe('2');
  });

  it('collects single, multi-paragraph, empty and CRLF definition regions', () => {
    const single = 'Body[^1].\n\n[^1]: def\n';
    const singleRegions = footnoteSourceVerbatim.collect(single, schema.nodes.doc!.create(null, [para('[^1]: def')]));
    expect(singleRegions).toHaveLength(1);
    expect(singleRegions[0]).toEqual({
      start: single.indexOf('[^1]:'),
      end: single.length,
      key: '1',
      raw: '[^1]: def\n',
    });

    const empty = 'Text[^1]\n\n[^1]: \n\nMore\n';
    const emptyRegions = footnoteSourceVerbatim.collect(empty, schema.nodes.doc!.create(null, [para('[^1]: ')]));
    expect(emptyRegions).toHaveLength(1);
    expect(emptyRegions[0]).toEqual({
      start: empty.indexOf('[^1]:'),
      end: empty.indexOf('[^1]:') + '[^1]: \n'.length,
      key: '1',
      raw: '[^1]: \n',
    });

    const multi = 'Body[^1].\n\n[^1]: first\n\n    second\n\ntail\n';
    const multiRegions = footnoteSourceVerbatim.collect(multi, schema.nodes.doc!.create(null, [para('[^1]: first')]));
    expect(multiRegions).toHaveLength(1);
    expect(multiRegions[0]).toEqual({
      start: multi.indexOf('[^1]:'),
      end: multi.indexOf('[^1]:') + '[^1]: first\n\n    second\n'.length,
      key: '1',
      raw: '[^1]: first\n\n    second\n',
    });

    const crlf = 'Body[^1].\r\n\r\n[^1]: def\r\n';
    const crlfRegions = footnoteSourceVerbatim.collect(crlf, schema.nodes.doc!.create(null, [para('[^1]: def')]));
    expect(crlfRegions).toHaveLength(1);
    expect(crlfRegions[0]).toEqual({
      start: crlf.indexOf('[^1]:'),
      end: crlf.length,
      key: '1',
      raw: '[^1]: def\r\n',
    });
  });

  it('locateDefinition returns exact offsets for single, multi-paragraph and CRLF definitions', () => {
    const single = 'Body[^1].\n\n[^1]: def\n';
    expect(locateDefinition(single, '1')).toEqual({
      start: single.indexOf('[^1]:'),
      end: single.length,
      raw: '[^1]: def\n',
    });

    const multi = 'Body[^1].\n\n[^1]: first\n\n    second\n\ntail\n';
    expect(locateDefinition(multi, '1')).toEqual({
      start: multi.indexOf('[^1]:'),
      end: multi.indexOf('[^1]:') + '[^1]: first\n\n    second\n'.length,
      raw: '[^1]: first\n\n    second\n',
    });

    const crlf = 'Body[^1].\r\n\r\n[^1]: def\r\n';
    expect(locateDefinition(crlf, '1')).toEqual({
      start: crlf.indexOf('[^1]:'),
      end: crlf.length,
      raw: '[^1]: def\r\n',
    });
  });

  it('locateDefinition returns null when the label is absent', () => {
    expect(locateDefinition('no defs here\n', '1')).toBeNull();
  });

  it('render delegates to the canonical block renderer', () => {
    expect(footnoteSourceVerbatim.render(para('[^1]: x'), (n) => 'R:' + n.textContent)).toBe('R:[^1]: x');
  });
});
