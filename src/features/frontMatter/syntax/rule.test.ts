import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";

import { frontMatterRule } from "./rule";

function makeMd() {
  const md = new MarkdownIt("commonmark", { html: false });
  md.block.ruler.before("hr", "front_matter", frontMatterRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  return md;
}

function frontMatterTokens(src: string) {
  return makeMd()
    .parse(src, {})
    .filter((t) => t.type === "front_matter");
}

describe("frontMatterRule", () => {
  it("parses a leading `---` block into a front_matter token", () => {
    const tokens = frontMatterTokens("---\ntitle: Hi\ndate: 2024-01-01\n---\n\nbody");
    expect(tokens).toHaveLength(1);
    const fm = tokens[0]!;
    expect(fm.block).toBe(true);
    expect(fm.content).toBe("title: Hi\ndate: 2024-01-01");
    expect(fm.map).toEqual([0, 4]);
  });

  it("parses an empty front matter body", () => {
    const tokens = frontMatterTokens("---\n\n---\n\nbody");
    expect(tokens).toHaveLength(1);
    expect(tokens[0]!.content).toBe("");
  });

  it("does not parse when there is no closing fence", () => {
    expect(frontMatterTokens("---\n\nbody")).toHaveLength(0);
  });

  it("does not parse a `---` that is not at doc start", () => {
    expect(frontMatterTokens("Title\n---\n\nbody")).toHaveLength(0);
  });
});
