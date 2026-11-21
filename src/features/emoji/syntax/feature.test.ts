import { describe, expect, it } from "vitest";

import { emojiSyntaxFeature } from "./feature";

describe("emojiSyntaxFeature", () => {
  it("claims emoji tokens through the v2 seam", () => {
    expect(emojiSyntaxFeature.inline?.order).toBe(-1);
    expect(typeof emojiSyntaxFeature.inline?.derive).toBe("function");
    expect(typeof emojiSyntaxFeature.inline?.tokenAdvance).toBe("function");
    expect(emojiSyntaxFeature.mdItPlugins).toHaveLength(1);
  });

  it("declares the glyph widget builder", () => {
    const build = emojiSyntaxFeature.inline!.decorationWidgets!.emoji!;
    const el = build({ glyph: "😄", len: "7" }, { documentDir: null });
    expect(el.className).toBe("emoji-glyph");
    expect(el.textContent).toBe("😄");
    expect(el.getAttribute("data-len")).toBe("7");
  });

  it("falls back to the :name: source in parserTokens", () => {
    const calls: string[] = [];
    const state = { addText: (text: string) => calls.push(text) };
    emojiSyntaxFeature.parserTokens!.emoji!(
      state as never,
      { markup: "smile", content: "😄" } as never,
      {} as never,
    );
    expect(calls).toEqual([":smile:"]);
  });

  it("tokenAdvance only claims emoji tokens", () => {
    const advance = emojiSyntaxFeature.inline!.tokenAdvance!;
    expect(advance("a :smile: b", 2, { type: "emoji", markup: "smile" } as never)).toBe(7);
    expect(advance("a :smile: b", 2, { type: "text" } as never)).toBeNull();
  });
});
