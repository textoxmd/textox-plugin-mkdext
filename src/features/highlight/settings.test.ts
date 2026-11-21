import { describe, expect, it } from 'vitest';

import highlightConfig from '../../../plugin.config';
import {
  DEFAULT_HIGHLIGHT_COLOR,
  HIGHLIGHT_PRESETS,
  applyHighlightColorStyle,
  highlightColorCss,
} from './settings';

const STYLE_ELEMENT_ID = 'texto-plugin-highlight-color';

describe('highlight color field', () => {
  it('declares a single color field with preset swatches', () => {
    const fields = highlightConfig.settings.filter((field) => field.key === 'highlightColor');
    expect(fields).toHaveLength(1);

    const field = fields[0]!;
    expect(field.type).toBe('color');
    expect(field.default).toBe(DEFAULT_HIGHLIGHT_COLOR);

    const presets = (field as { presets?: Array<{ value: string }> }).presets ?? [];
    expect(presets).toHaveLength(6);
    expect(presets.map((preset) => preset.value)).toEqual([...HIGHLIGHT_PRESETS]);
  });
});

describe('highlightColorCss', () => {
  it('derives light/dark alpha from a single color', () => {
    expect(highlightColorCss('#ffd700')).toBe(
      ':root{--highlight-color:color-mix(in oklab, #ffd700 35%, transparent)}' +
        ':root.dark{--highlight-color:color-mix(in oklab, #ffd700 50%, transparent)}',
    );
  });
});

describe('applyHighlightColorStyle', () => {
  it('injects a style element and falls back to the default color', () => {
    const resource = applyHighlightColorStyle();
    try {
      const el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
      expect(el).not.toBeNull();
      expect(el!.textContent).toBe(highlightColorCss(DEFAULT_HIGHLIGHT_COLOR));

      applyHighlightColorStyle('#a3e07a');
      expect(el!.textContent).toBe(highlightColorCss('#a3e07a'));

      for (const invalid of [
        123,
        '',
        '  ',
        'red; } :root{display:none} :root{--highlight-color:red',
      ]) {
        applyHighlightColorStyle(invalid);
        expect(el!.textContent).toBe(highlightColorCss(DEFAULT_HIGHLIGHT_COLOR));
      }

      expect(document.querySelectorAll('#texto-plugin-highlight-color')).toHaveLength(1);
    } finally {
      resource.dispose();
    }
  });

  it('removes the style element when disposed', () => {
    const resource = applyHighlightColorStyle('#a3e07a');
    expect(document.getElementById(STYLE_ELEMENT_ID)).not.toBeNull();

    resource.dispose();
    expect(document.getElementById(STYLE_ELEMENT_ID)).toBeNull();
  });
});
