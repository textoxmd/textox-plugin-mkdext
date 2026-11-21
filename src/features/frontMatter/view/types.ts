// 属性面板共享类型。纯类型，无运行时依赖。

/** 视图模式：面板（表单）或源码（原始 YAML 文本）。 */
export type ViewMode = "panel" | "source";

/** entry 值类型（对齐 Obsidian 7 类，收敛为 6 控件 + raw 降级）。 */
export type EntryType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "list"
  | "raw";

/** 一个顶层 key 及其值（按行区间定位）。 */
export interface Entry {
  key: string;
  /** 该 entry 在 body 行数组内的区间 [start, end)，end 独占。 */
  lines: [number, number];
  /** 原始文本（含键行与续行）。 */
  raw: string;
  type: EntryType;
  /** 解析后的值（仅用于渲染控件；写回用 raw + splice）。 */
  value: unknown;
  /** 复杂值（嵌套 / 块标量 / 锚点 / 含注释 / 解析失败）⇒ 不可表单编辑。 */
  complex: boolean;
  /** 键行同行尾注释 `key: v # note`；可安全保留时随值写回。 */
  trailingComment?: string;
}

/** parseEntries 的结果。 */
export interface ParseResult {
  entries: Entry[];
  /** body 按换行切分后的行（splice 复用）。 */
  lines: string[];
  /** body 使用的换行符。 */
  eol: "\n" | "\r\n";
  /** 原 body 是否以换行结尾（用于回写时保留尾换行状态）。 */
  trailingNewline: boolean;
  /** 整体解析是否可用（false ⇒ 面板降级为只读源码）。 */
  ok: boolean;
}

/** 编辑动作（splice 的输入）。 */
export type EditAction =
  | { kind: "setValue"; key: string; value: unknown; type: EntryType }
  | { kind: "rename"; key: string; nextKey: string }
  | { kind: "remove"; key: string }
  | { kind: "add"; key: string; value: unknown; type: EntryType };
