import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

import { ALERT_PATTERN } from "./pattern";

/**
 * markdown-it core ruler：blockquote 解析后，把每个引用块内首个 inline
 * token 拆开——当它以 [!TYPE] 开头且含换行时，标记与续行内容被 CommonMark
 * 的连续行处理合并到了一起，这里将其还原为两个段落 token。
 */
export function alertSplitPlugin(md: MarkdownIt): void {
  md.core.ruler.push("alert_split", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i]?.type !== "blockquote_open") continue;

      // 找到该 blockquote 内第一个 inline token
      let depth = 1;
      let inlineIdx = -1;
      for (let j = i + 1; j < tokens.length && depth > 0; j++) {
        const t = tokens[j]!;
        if (t.type === "blockquote_open") { depth++; continue; }
        if (t.type === "blockquote_close") { depth--; continue; }
        if (depth === 1 && t.type === "inline" && inlineIdx < 0) {
          inlineIdx = j;
        }
      }
      if (inlineIdx < 0) continue;

      const inlineToken = tokens[inlineIdx]!;
      const content = inlineToken.content;
      const match = content.match(ALERT_PATTERN);
      if (!match) continue;

      const newlineIdx = content.indexOf("\n");
      if (newlineIdx < 0) continue;

      const markerContent = content.slice(0, newlineIdx);
      const restContent = content.slice(newlineIdx + 1);

      inlineToken.content = markerContent;
      inlineToken.children = [new state.Token("text", "", 0)];
      inlineToken.children[0]!.content = markerContent;

      const newTokens: Token[] = [];

      newTokens.push(new state.Token("paragraph_close", "p", -1));

      const po2 = new state.Token("paragraph_open", "p", 1);
      po2.block = true;
      newTokens.push(po2);

      const inline2 = new state.Token("inline", "", 0);
      inline2.content = restContent;
      inline2.children = [new state.Token("text", "", 0)];
      inline2.children[0]!.content = restContent;
      inline2.block = true;
      newTokens.push(inline2);

      newTokens.push(new state.Token("paragraph_close", "p", -1));

      tokens.splice(inlineIdx + 1, 1, ...newTokens);
      i = inlineIdx + newTokens.length;
    }
    return true;
  });
}
