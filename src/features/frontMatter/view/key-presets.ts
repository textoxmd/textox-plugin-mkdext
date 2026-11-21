// 内置属性名预设：常用名清单、别名归一、默认值类型（控件选择）、以及「是否内置名（面板内锁定改名）」。
// 单点声明，供图标（icons.ts）、属性名联想（key-suggest.ts）与面板（properties-view.ts）共用。

import type { Entry, EntryType } from "./types";

/** 内置常用属性名（对齐 Hugo / Jekyll / Obsidian / GitHub Docs 惯例；英文，不作为文案翻译）。 */
export const BUILTIN_KEYS: readonly string[] = [
  "title",
  "description",
  "summary",
  "tags",
  "categories",
  "status",
  "type",
  "priority",
  "date",
  "created",
  "updated",
  "author",
  "owner",
  "audience",
  "language",
  "version",
  "related",
  "keywords",
  "project",
  "aliases",
  "slug",
  "draft",
];

/** 常见别名 / 复数 / 近义写法 → 规范属性名。 */
export const KEY_ALIASES: Record<string, string> = {
  name: "title",
  header: "title",
  tag: "tags",
  label: "tags",
  labels: "tags",
  desc: "description",
  abstract: "summary",
  category: "categories",
  state: "status",
  kind: "type",
  level: "priority",
  published: "date",
  publish: "date",
  time: "date",
  modified: "updated",
  update: "updated",
  lastmod: "updated",
  authors: "author",
  creator: "author",
  lang: "language",
  locale: "language",
  keyword: "keywords",
  topic: "keywords",
  topics: "keywords",
  alias: "aliases",
  permalink: "slug",
  url: "slug",
  isdraft: "draft",
};

/** 内置属性名的默认值类型（控件选择依据）。 */
const DEFAULT_TYPES: Record<string, EntryType> = {
  title: "text",
  description: "text",
  summary: "text",
  status: "text",
  type: "text",
  priority: "text",
  author: "text",
  owner: "text",
  audience: "text",
  language: "text",
  version: "text",
  related: "text",
  project: "text",
  slug: "text",
  tags: "list",
  categories: "list",
  keywords: "list",
  aliases: "list",
  date: "date",
  created: "datetime",
  updated: "datetime",
  draft: "boolean",
};

const BUILTIN_SET: ReadonlySet<string> = new Set([
  ...BUILTIN_KEYS,
  ...Object.keys(KEY_ALIASES),
]);

/** 归一为规范属性名（别名/大小写/首尾空白）。 */
export function canonicalKey(key: string): string {
  const normalized = key.trim().toLowerCase();
  return KEY_ALIASES[normalized] ?? normalized;
}

/** 是否为内置属性名（含别名）——面板内锁定改名，只能删除或切源码编辑。 */
export function isBuiltinKey(key: string): boolean {
  return BUILTIN_SET.has(key.trim().toLowerCase());
}

/** 内置属性名的默认类型；非内置名返回 null。 */
export function defaultTypeOf(key: string): EntryType | null {
  return DEFAULT_TYPES[canonicalKey(key)] ?? null;
}

/**
 * 解析实际用于控件渲染的类型：
 * - 列表类预设（tags/categories/keywords/aliases）：值为数组、单行标量、或「空值」时都用数组控件；
 *   真正复杂的结构（多行块 / 含注释 / 映射）保持只读降级，不强行改写。
 * - 其余情况一律以 YAML 实际推断类型为准（不强行改写 number/boolean/date）。
 */
export function resolveEntryType(
  key: string,
  entry: Pick<Entry, "type" | "value" | "complex" | "raw" | "trailingComment">,
): EntryType {
  if (defaultTypeOf(key) !== "list") return entry.type;
  if (entry.type === "list") return "list";
  if (!entry.complex && entry.type === "text") return "list";
  // 空值（如 `tags:`）会被推断为 raw；单行且无注释时按数组控件渲染，便于直接输入 tag。
  const empty = entry.value == null || entry.value === "";
  const plain = !entry.raw.includes("\n") && entry.trailingComment === undefined;
  if (empty && plain && (entry.type === "text" || entry.type === "raw")) return "list";
  return entry.type;
}

/** 把值归一为控件可消费的形状：列表类型接受标量时视为单元素数组（空值 → 空数组）。 */
export function normalizeValue(type: EntryType, value: unknown): unknown {
  if (type !== "list") return value;
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [String(value)];
}
