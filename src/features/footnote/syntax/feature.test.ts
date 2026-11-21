import { expect, it } from "vitest";

import { footnoteFeature } from "./feature";

it("claims footnote refs through the v2 seam", () => {
  expect(footnoteFeature.inline?.order).toBe(1.1);
  expect(typeof footnoteFeature.inline?.derive).toBe("function");
  const text = "a[^1]b";
  const spans = footnoteFeature.inline!.derive!({
    text,
    tokens: [],
    parentBlock: null,
    consumed: new Uint8Array(text.length),
    isConsumed: () => false,
    warn: () => {},
  });
  expect(spans.map((s) => [s.type, s.from, s.to, s.wrap])).toEqual([
    ["footnote_ref", 1, 5, true],
  ]);
});
