/** GFM 提醒框标记：> [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]。 */
export const ALERT_PATTERN = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;

/** 标记类型 → 展示标签（与 CSS 的 `.alert-label` 搭配）。 */
export const ALERT_LABELS: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};
