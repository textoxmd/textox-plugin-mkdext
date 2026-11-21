import { describe, expect, it } from 'vitest';

import { highlightFormatItem } from './format-item';

describe('highlightFormatItem', () => {
  it('targets the highlight mark on both surfaces by default', () => {
    expect(highlightFormatItem.id).toBe('highlight');
    expect(highlightFormatItem.markName).toBe('highlight');
    expect(highlightFormatItem.delim).toBe('==');
    expect(highlightFormatItem.closeDelim).toBeUndefined();
    expect(highlightFormatItem.labelKey).toBe('highlight.label');
    expect(highlightFormatItem.order).toBe(3);
    expect(highlightFormatItem.surfaces).toBeUndefined();
  });

  it('reuses the lucide icon name instead of hand-drawing', () => {
    expect(highlightFormatItem.icon).toBe('highlighter');
  });
});
