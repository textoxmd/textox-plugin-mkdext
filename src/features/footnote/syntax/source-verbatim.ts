import type { Node as PMNode } from "prosemirror-model";
import type {
  SourceVerbatimReconciler,
  SourceVerbatimRegion,
} from "@textox/plugin-sdk";

const FN_DEF_PREFIX_RE = /^\[\^([^\]]+)\]:/;

/** 脚注定义段落：文本以 `[^label]:` 开头的 paragraph。 */
export function isFootnoteDefPara(node: PMNode): boolean {
  return node.type.name === "paragraph" && FN_DEF_PREFIX_RE.test(node.textContent);
}

function labelOf(node: PMNode): string {
  const m = FN_DEF_PREFIX_RE.exec(node.textContent);
  return m ? m[1]! : "";
}

/**
 * 在原文中定位某个 label 的定义块：`[^label]:` 起始行 + 后续缩进续段
 * （空行 + 4 空格缩进的段落属于同一定义）；遇到非缩进的非空行即结束。
 * 返回绝对字符偏移与原文；找不到返回 null。
 */
export function locateDefinition(
  src: string,
  label: string,
): { start: number; end: number; raw: string } | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefixRe = new RegExp(`^\\[\\^${escaped}\\]:`);
  const lines = src.split(/(?<=\n)/); // 保留行尾
  const lineStart: number[] = [];
  let acc = 0;
  for (const line of lines) {
    lineStart.push(acc);
    acc += line.length;
  }
  const bare = (i: number): string => lines[i]!.replace(/\r?\n$/, "");
  const isIndented = (i: number): boolean => /^( {4,}|\t)/.test(bare(i));

  for (let i = 0; i < lines.length; i++) {
    if (!prefixRe.test(lines[i]!)) continue;
    const start = lineStart[i]!;
    let j = i + 1;
    while (j < lines.length) {
      if (bare(j).trim() === "") {
        // 空行只有在其后有缩进续段时才属于本定义，否则视为定义结束。
        let k = j + 1;
        while (k < lines.length && bare(k).trim() === "") k++;
        if (k < lines.length && isIndented(k)) {
          j = k;
          continue;
        }
        break;
      }
      if (isIndented(j)) {
        j++;
        continue;
      }
      break;
    }
    const end = j < lines.length ? lineStart[j]! : src.length;
    return { start, end, raw: src.slice(start, end) };
  }
  return null;
}

export const footnoteSourceVerbatim: SourceVerbatimReconciler = {
  matches: isFootnoteDefPara,
  keyOf: labelOf,
  collect(src, doc): SourceVerbatimRegion[] {
    const regions: SourceVerbatimRegion[] = [];
    doc.forEach((child) => {
      if (!isFootnoteDefPara(child)) return;
      const key = labelOf(child);
      if (!key) return;
      const found = locateDefinition(src, key);
      if (found) regions.push({ ...found, key });
    });
    return regions;
  },
  render(node, renderBlockCanon) {
    return renderBlockCanon(node);
  },
};
