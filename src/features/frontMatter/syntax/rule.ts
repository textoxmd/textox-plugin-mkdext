import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";

// YAML front matter — `---\n<content>\n---` at the very start of a doc.
//
// markdown-it block rule: recognises the opening/closing fence and emits a
// `front_matter` token (nesting 0, block: true, map set) carrying the raw
// content between the fences. Registered before `hr` so a leading `---` pair
// is claimed as front matter rather than parsed as a thematic break.
export const frontMatterRule: RuleBlock = (state, startLine, endLine, silent) => {
  if (startLine !== 0) return false;
  if (state.tShift[startLine] !== 0) return false;
  const start = state.bMarks[startLine]!;
  const lineEnd = state.eMarks[startLine]!;
  if (lineEnd - start !== 3) return false;
  if (state.src.slice(start, start + 3) !== "---") return false;

  let closeLine = -1;
  for (let line = startLine + 1; line <= endLine; line++) {
    const bm = state.bMarks[line]!;
    const em = state.eMarks[line]!;
    if (state.tShift[line] === 0 && em - bm === 3 && state.src.slice(bm, em) === "---") {
      closeLine = line;
      break;
    }
  }
  if (closeLine === -1) return false;
  if (silent) return true;

  const content = state.src
    .slice(state.bMarks[startLine + 1]!, state.bMarks[closeLine]!)
    .replace(/\n$/, "");
  const token = state.push("front_matter", "div", 0);
  token.content = content;
  token.markup = "---";
  token.block = true;
  token.map = [startLine, closeLine + 1];
  state.line = closeLine + 1;
  return true;
};
