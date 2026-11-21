import { JSON_SCHEMA, load } from "js-yaml";

import type { Entry, EntryType, ParseResult } from "./types";

/** 顶层键行：零缩进、非空、非注释、形如 `key:` 或 `key: value`。 */
const TOP_KEY_RE = /^([^#\s][^:\n]*?):(?:[ \t](.*))?$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

function isIndented(line: string): boolean {
  return line.startsWith(" ") || line.startsWith("\t");
}

function isComment(line: string): boolean {
  return line.trimStart().startsWith("#");
}

function detectEol(body: string): "\n" | "\r\n" {
  return body.includes("\r\n") ? "\r\n" : "\n";
}

/** 由解析后的 JS 值推断 entry 类型（值来自 JSON_SCHEMA，恒为原始标量/数组/对象）。 */
function inferType(value: unknown): EntryType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "list";
  if (typeof value === "string") {
    if (ISO_DATE_RE.test(value)) return "date";
    if (ISO_DATETIME_RE.test(value)) return "datetime";
    return "text";
  }
  return "raw";
}

/** 从 `from` 起找串首或空白后的 `#`，返回注释文本。 */
function scanComment(text: string, from: number): string | undefined {
  for (let i = from; i < text.length; i++) {
    if (text[i] === "#" && (i === 0 || text[i - 1] === " " || text[i - 1] === "\t")) {
      return text.slice(i);
    }
  }
  return undefined;
}

/**
 * 从键行的值段提取同行尾注释：`#` 前须为串首或空白。
 * 仅当值段首个非空白字符是引号（YAML 引号标量）时才跳过引号区间，
 * 避免把纯量里的撇号/引号误当引号开启而吞掉真实注释。
 */
function extractTrailingComment(text: string): string | undefined {
  const start = text.search(/\S/);
  const first = start >= 0 ? text[start] : "";
  if (first !== '"' && first !== "'") return scanComment(text, 0);
  const quote = first;
  let i = start + 1;
  for (; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === "\\" && quote === '"') {
      i++; // 跳过被转义的字符
      continue;
    }
    if (ch === quote) {
      if (quote === "'" && text[i + 1] === "'") {
        i++; // '' 是单引号标量内的转义单引号，跳过而非闭合
        continue;
      }
      i++;
      break; // 跳过闭合引号
    }
  }
  return scanComment(text, i);
}

/**
 * 把 front matter body（`---` 之间的原始文本）解析为顶层 entry 列表。
 * 键行只认零缩进行；其后的「缩进非空行」为续行。注释行/空行为无主行，保留不动。
 *
 * 已知边界：块式列表中间夹空行时，空行之后的行不归属任何 entry（面板不可见，
 * 写回覆盖不到）。
 */
export function parseEntries(body: string): ParseResult {
  const eol = detectEol(body);
  const trailingNewline = /\r?\n$/.test(body);
  const lines = body.length ? body.split(/\r?\n/) : [];
  // 尾随换行会产生一个空串末尾；去掉它以保持行号干净。
  if (lines.length && lines[lines.length - 1] === "") lines.pop();

  let parsed: Record<string, unknown> | null = null;
  let parseFailed = false;
  try {
    const v = body.trim() ? load(body, { schema: JSON_SCHEMA }) : {};
    parsed = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    if (!parsed) parseFailed = body.trim() !== "";
  } catch {
    parseFailed = true;
  }

  const entries: Entry[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const m = TOP_KEY_RE.exec(line);
    if (!m || isIndented(line) || isComment(line)) {
      i++;
      continue;
    }
    const key = m[1]!.trim();
    let j = i + 1;
    while (j < lines.length && lines[j]!.trim() !== "" && isIndented(lines[j]!)) j++;
    const rawLines = lines.slice(i, j);
    const raw = rawLines.join(eol);

    const value = parsed ? parsed[key] : undefined;
    const type = parseFailed ? "raw" : inferType(value);
    const hasCommentLine = rawLines.some((l) => isComment(l));
    const complex = hasCommentLine || type === "raw" || (rawLines.length > 1 && type !== "list");

    const comment = extractTrailingComment(m[2] ?? "");
    entries.push({
      key,
      lines: [i, j],
      raw,
      type: complex ? "raw" : type,
      value,
      complex,
      trailingComment: comment,
    });
    i = j;
  }

  return { entries, lines, eol, ok: !parseFailed, trailingNewline };
}
