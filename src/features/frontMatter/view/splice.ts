import type { EditAction, Entry, EntryType, ParseResult } from "./types";

/** YAML 标量序列化：必要时加双引号。 */
function serializeScalar(value: unknown, type: EntryType): string {
  if (type === "number") {
    if (value == null || value === "") return "";
    const n = Number(value);
    return Number.isFinite(n) ? String(n) : "";
  }
  if (type === "boolean") return value ? "true" : "false";
  if (type === "date" || type === "datetime") return String(value);
  return serializeText(String(value ?? ""));
}

/** 文本值是否需要加引号才能保持「字符串」往返语义。 */
function needsQuote(text: string): boolean {
  if (text === "" || text.trim() !== text) return true;
  if (/[\x00-\x1f\x7f]/.test(text)) return true; // 控制字符（含 \n\r\t）
  if (/[:#\[\]{}&*!|>'"%@`,]/.test(text)) return true; // YAML 特殊字符（含行内列表分隔符 ,）
  if (/^[-?](\s|$)/.test(text)) return true; // 序列 / 复杂键指示符（含整值为 - 或 ?）
  // 数字形态（含 007 / 1.50 / 1e3 / +5 / .5）
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(text)) return true;
  // YAML 标量关键字
  if (/^(true|false|null|~|yes|no|on|off)$/i.test(text)) return true;
  return false;
}

function serializeText(text: string): string {
  if (!needsQuote(text)) return text;
  const body = text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, (ch) => `\\x${ch.charCodeAt(0).toString(16).padStart(2, "0")}`);
  return `"${body}"`;
}

function serializeListInline(items: unknown[]): string {
  return `[${items.map((v) => serializeScalar(v, "text")).join(", ")}]`;
}

function serializeListBlock(items: unknown[], indent: string): string[] {
  return items.map((v) => `${indent}- ${serializeScalar(v, "text")}`);
}

function findByKey(parsed: ParseResult, key: string): Entry | undefined {
  return parsed.entries.find((e) => e.key === key);
}

/**
 * 应用一次编辑动作，产出新的 body 文本。
 * 只重写目标 entry 的行区间；无法安全处理时返回 null（调用方放弃）。
 */
export function applyEdit(parsed: ParseResult, action: EditAction): string | null {
  const { lines, eol } = parsed;
  const out = lines.slice();

  const spliceLines = (start: number, count: number, next: string[]): void => {
    out.splice(start, count, ...next);
  };

  // 收尾：保留入参 body 的尾换行状态；body 无尾换行时不得凭空补出空行。
  const finish = (result: string[]): string => {
    const text = result.join(eol);
    return text === "" ? "" : text + (parsed.trailingNewline ? eol : "");
  };

  if (action.kind === "add") {
    const rendered = renderValueLine(action.value, action.type);
    const line = `${action.key}:${rendered ? ` ${rendered}` : ""}`;
    // 追加到末尾（body 为空时即为唯一一行）。
    out.push(line);
    return finish(out);
  }

  const entry = findByKey(parsed, action.key);
  if (!entry) return null;
  const [start, end] = entry.lines;

  if (action.kind === "rename") {
    const first = out[start]!;
    const rest = first.slice(first.indexOf(":"));
    out[start] = `${action.nextKey}${rest}`;
    return finish(out);
  }

  if (action.kind === "remove") {
    spliceLines(start, end - start, []);
    return finish(out);
  }

  // setValue
  if (entry.complex) return null;

  if (action.type === "list") {
    const items = Array.isArray(action.value) ? action.value : [];
    const wasInline = entry.raw.split(eol)[0]!.includes("[");
    if (wasInline) {
      out[start] = `${action.key}: ${serializeListInline(items)}${entry.trailingComment ? ` ${entry.trailingComment}` : ""}`;
      if (end - start > 1) spliceLines(start + 1, end - start - 1, []);
    } else {
      const block = [`${action.key}:`, ...serializeListBlock(items, "  ")];
      if (entry.trailingComment) block[0] = `${action.key}: ${entry.trailingComment}`;
      spliceLines(start, end - start, block);
    }
    return finish(out);
  }

  if (end - start > 1) return null; // 非列表的多行 entry 属 complex，不应到达；防御性放弃写回
  const comment = entry.trailingComment ? ` ${entry.trailingComment}` : "";
  const rendered = renderValueLine(action.value, action.type);
  out[start] = `${action.key}:${rendered ? ` ${rendered}` : ""}${comment}`;
  return finish(out);
}

/** 标量值 → 单行表示（不含键）。 */
function renderValueLine(value: unknown, type: EntryType): string {
  if (type === "list") return serializeListInline(Array.isArray(value) ? value : []);
  return serializeScalar(value, type);
}
