import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from './locales';

/** 宿主 `APP_LANGUAGES` 的契约副本：新增语言时这里和 `locales.ts` 必须同步。 */
const APP_LANGUAGES = [
  'ar-SA',
  'de-DE',
  'en-US',
  'es-ES',
  'fr-FR',
  'hi-IN',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'pt-PT',
  'ru-RU',
  'th-TH',
  'vi-VN',
  'zh-CN',
  'zh-TW',
] as const;

/** 把嵌套文案扁平化成 `a.b.c` 叶子路径，叶子必须是字符串。 */
function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      keys.push(...flattenKeys(child as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

/** 按 `a.b.c` 路径取叶子值。 */
function readPath(value: Record<string, unknown>, path: string): unknown {
  let current: unknown = value;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

const baselineKeys = flattenKeys(locales[defaultLocale] as Record<string, unknown>);

describe('插件文案语言覆盖', () => {
  it('默认语言为 en-US', () => {
    expect(defaultLocale).toBe('en-US');
  });

  it('宿主 15 种语言全部提供', () => {
    expect(Object.keys(locales).sort()).toEqual([...APP_LANGUAGES].sort());
  });

  it('每种语言的 key 集合与 en-US 完全一致', () => {
    const mismatches = APP_LANGUAGES.map((locale) => {
      const message = locales[locale];
      expect(message, `缺少语言 ${locale}`).toBeDefined();
      return {
        locale,
        missing: baselineKeys.filter((key) => !flattenKeys(message).includes(key)),
        extra: flattenKeys(message).filter((key) => !baselineKeys.includes(key)),
      };
    }).filter(({ missing, extra }) => missing.length > 0 || extra.length > 0);

    expect(mismatches).toEqual([]);
  });

  it('每种语言都有非空的 name 与 description', () => {
    const invalid = APP_LANGUAGES.filter((locale) => {
      const message = locales[locale] as Record<string, unknown>;
      const name = readPath(message, 'name');
      const description = readPath(message, 'description');
      return (
        typeof name !== 'string' ||
        name.trim().length === 0 ||
        typeof description !== 'string' ||
        description.trim().length === 0
      );
    });

    expect(invalid).toEqual([]);
  });

  it('不存在空字符串文案', () => {
    const empties: string[] = [];
    for (const locale of APP_LANGUAGES) {
      const message = locales[locale] as Record<string, unknown>;
      for (const key of flattenKeys(message)) {
        const value = readPath(message, key);
        if (typeof value !== 'string' || value.trim().length === 0) {
          empties.push(`${locale}:${key}`);
        }
      }
    }

    expect(empties).toEqual([]);
  });
});
