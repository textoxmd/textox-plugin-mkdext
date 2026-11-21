import type { Node as PMNode } from "prosemirror-model";
import { Decoration } from "prosemirror-view";

import { ALERT_LABELS, ALERT_PATTERN } from "./pattern";

export function createAlertLabel(type: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "alert-label";
  span.contentEditable = "false";
  span.textContent = ALERT_LABELS[type] ?? type;
  return span;
}

/**
 * 遍历文档：把以 [!TYPE] 开头的引用块标记为 `alert alert-<type>`；
 * 光标不在标记内时隐藏标记文本并前置 `alert-label` widget。
 */
export function buildAlertDecorations(doc: PMNode, cursorPos: number): Decoration[] {
  const decos: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== "blockquote") return true;
    const firstPara = node.firstChild;
    if (!firstPara || firstPara.type.name !== "paragraph") return false;
    const firstText = firstPara.firstChild;
    if (!firstText?.isText) return false;
    const match = firstText.text?.match(ALERT_PATTERN);
    if (!match) return false;
    const type = match[1]!.toLowerCase();
    if (!ALERT_LABELS[type]) return false;

    decos.push(
      Decoration.node(pos, pos + node.nodeSize, { class: `alert alert-${type}` }),
    );

    const from = pos + 2;
    const to = from + match[0].length;
    if (cursorPos >= from && cursorPos <= to) return false;

    decos.push(Decoration.inline(from, to, { class: "syntax-hidden" }));
    decos.push(Decoration.widget(from, createAlertLabel(type), { side: -1 }));

    return false;
  });

  return decos;
}
