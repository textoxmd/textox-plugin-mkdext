import type MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';

/** texmath 的 inline 规则描述（`rules` 表里的形状，只声明我们读写的字段）。 */
export interface TexmathInlineRule {
  name: string;
  rex: RegExp;
  tmpl: string;
  tag: string;
  displayMode?: boolean;
  outerSpace?: boolean;
  pre?(src: string, outerSpace: boolean | undefined, pos: number): boolean;
  post?(src: string, outerSpace: boolean | undefined, end: number): boolean;
}

export interface TexmathBlockRule {
  name: string;
  rex: RegExp;
  tmpl: string;
  tag: string;
}

export interface TexmathOptions {
  engine?: { renderToString(tex: string, options?: Record<string, unknown>): string };
  delimiters?: string | string[];
  katexOptions?: Record<string, unknown>;
  macros?: unknown;
  outerSpace?: boolean;
}

declare const texmath: ((md: MarkdownIt, options?: TexmathOptions) => void) & {
  rules: Record<string, { inline: TexmathInlineRule[]; block: TexmathBlockRule[] }>;
  inline(rule: TexmathInlineRule): (state: StateInline, silent: boolean) => boolean;
};

export default texmath;
