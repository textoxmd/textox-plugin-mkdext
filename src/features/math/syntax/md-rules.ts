import type MarkdownIt from 'markdown-it';

// 本地 vendored 版（与 markdown-it-texmath@1.0.0 逐字一致，只去掉 `require('katex')`
// 兜底并改为 ESM）：见 `./vendor/texmath.js` 顶部说明。
import texmath from './vendor/texmath';

/**
 * 注册公式规则：`dollars`（`$…$`，含 `$$…$$` 块）与 `brackets` 的
 * **inline 部分**（`\(…\)`）。
 *
 * brackets 的块规则（`\[…\]`）刻意不注册：它会把转义的方括号
 * （如 `\[a\](b)`）吞成块公式，破坏既有的 escape 语义。
 */
export function registerMathRules(md: MarkdownIt): void {
  md.use(texmath, {
    engine: { renderToString: (tex: string) => tex },
    delimiters: 'dollars',
  });
  // 没有照抄 texmath 的 `md.renderer.rules[rule.name] = ...`：`math_inline`
  // 的渲染器已由上面的 dollars 注册（两条规则同名、模板相同），所以复用该
  // 实例渲染 `\(…\)` 也是对的。只有把 dollars 换成别的组合时才需要补注册。
  for (const rule of texmath.rules.brackets.inline) {
    md.inline.ruler.before('escape', rule.name, texmath.inline(rule));
  }
}
