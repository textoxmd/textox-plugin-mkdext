import type { Entry } from "./types";

/** 控件交互回调（值变化 / 列表增删）。 */
export interface ControlCallbacks {
  /** 提交新值（由 NodeView 落事务）。 */
  commit(value: unknown): void;
  /** 单值输入框按 Enter 提交后的附加动作（如面板最后一行跳出属性块）。 */
  onEnter?: () => void;
  /** 列表 tag 输入框为空时按 Enter 的附加动作（如面板最后一行跳出属性块）。 */
  onEmptyEnter?: () => void;
}

/** 单值控件「输入即提交」的防抖间隔（毫秒）。 */
const INPUT_COMMIT_DELAY = 300;

/** 归一为 `<input type=date>` 接受的 `YYYY-MM-DD`；不可表示时返回 null（降级文本）。 */
function toDateInputValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4}-\d{2}-\d{2})$/.exec(value.trim());
  return m ? m[1]! : null;
}

/** 归一为 `<input type=datetime-local>` 接受的 `YYYY-MM-DDTHH:mm[:ss]`；带时区/偏移不可表示时返回 null。 */
function toDatetimeInputValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)$/.exec(value.trim());
  return m ? `${m[1]}T${m[2]}` : null;
}

/** 文本 / 数字 / 日期 / 日期时间：单值输入（文本用 textarea，长内容自动换行）。 */
function buildInput(entry: Entry, cb: ControlCallbacks): HTMLElement {
  // 文本值用 textarea：长内容自动换行并按内容增高；值本身仍是单行字符串（Enter 仍为提交）。
  const multiline = entry.type === "text";
  const el: HTMLInputElement | HTMLTextAreaElement = multiline
    ? document.createElement("textarea")
    : document.createElement("input");
  el.className = "fm-input";
  if (multiline) (el as HTMLTextAreaElement).rows = 1;

  // 决定控件类型；date/datetime 的值若不能被原生控件无损表示，则降级为文本，
  // 避免「显示为空 + 失焦提交空串」静默清空原值。
  let type = "text";
  let initial = entry.value == null ? "" : String(entry.value);
  if (entry.type === "number") {
    type = "number";
    const n = Number(entry.value);
    initial = entry.value == null || entry.value === "" || !Number.isFinite(n) ? "" : String(n);
  } else if (entry.type === "date") {
    const v = toDateInputValue(entry.value);
    if (v !== null) {
      type = "date";
      initial = v;
    }
  } else if (entry.type === "datetime") {
    const v = toDatetimeInputValue(entry.value);
    if (v !== null) {
      type = "datetime-local";
      initial = v;
    }
  }
  if (!multiline) (el as HTMLInputElement).type = type;
  el.value = initial;

  // 原生控件会把「形状合法但语义非法」的值（如 2024-13-45）净化为空串；
  // 回读以决定：被净化则降级为文本并保留原串；否则以净化后的值为基线，
  // 避免浏览器归一化（如零秒 :00 被省略）导致「未改动」被误判为改动。
  if (!multiline) {
    const sanitized = el.value;
    if (initial !== "" && sanitized === "" && (type === "date" || type === "datetime-local")) {
      initial = entry.value == null ? "" : String(entry.value);
      (el as HTMLInputElement).type = "text";
      el.value = initial;
    } else {
      initial = sanitized;
    }
  }

  // textarea 按内容自适应高度：构造期元素尚未挂载（scrollHeight 不可靠），
  // 故挂载后（下一帧）再测量；宽度变化（窗口/面板尺寸）时也重新测量。
  if (multiline) {
    const grow = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    el.addEventListener("input", grow);
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(grow);
    else grow();
    if (typeof ResizeObserver === "function") {
      let lastWidth = -1;
      const observer = new ResizeObserver(() => {
        if (!el.isConnected) {
          observer.disconnect();
          return;
        }
        if (el.clientWidth === lastWidth) return;
        lastWidth = el.clientWidth;
        grow();
      });
      observer.observe(el);
    }
  }

  // 未改动不提交：避免 blur/Enter 造成多余事务。
  const commit = () => {
    if (el.value === initial) return;
    let v: unknown = el.value;
    if (entry.type === "number") v = el.value === "" ? null : Number(el.value);
    // 提交后以当前值为新基线（否则把值改回旧值时会被误判为「未改动」而不写回）。
    initial = el.value;
    cb.commit(v);
  };
  // 输入即（防抖）提交：不必等失焦；IME 组合期间跳过，避免打断中文输入。
  let timer: ReturnType<typeof setTimeout> | undefined;
  el.addEventListener("input", (e) => {
    if ((e as InputEvent).isComposing) return;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(commit, INPUT_COMMIT_DELAY);
  });
  el.addEventListener("change", commit);
  el.addEventListener("keydown", (e) => {
    const ev = e as KeyboardEvent;
    // IME 组合期（中文/日文用 Enter 确认候选）不提交、不退出。
    if (ev.isComposing || ev.keyCode === 229) return;
    if (ev.key === "Enter") {
      ev.preventDefault();
      commit();
      cb.onEnter?.();
    }
  });
  return el;
}

/** 布尔：勾选框。 */
function buildCheckbox(entry: Entry, cb: ControlCallbacks): HTMLElement {
  const input = document.createElement("input");
  input.className = "fm-checkbox";
  input.type = "checkbox";
  input.checked = entry.value === true;
  input.addEventListener("change", () => cb.commit(input.checked));
  return input;
}

/** 列表：胶囊 + 常驻输入框（输入后 Enter 即成新 tag），无独立添加按钮。 */
function buildList(entry: Entry, cb: ControlCallbacks): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "fm-chips";
  const items: string[] = Array.isArray(entry.value) ? entry.value.map((v) => String(v)) : [];
  const emit = (next: string[]) => cb.commit(next);
  items.forEach((item, idx) => {
    const chip = document.createElement("span");
    chip.className = "fm-chip";
    chip.textContent = item;
    const x = document.createElement("button");
    x.type = "button";
    x.className = "fm-chip-x";
    x.textContent = "×";
    x.addEventListener("mousedown", (e) => e.preventDefault());
    x.addEventListener("click", () => emit(items.filter((_, i) => i !== idx)));
    chip.appendChild(x);
    wrap.appendChild(chip);
  });

  // 常驻输入：Enter 追加为 tag；空值/仅空白不提交（可交给 `onEmptyEnter`，如最后一行退出属性块）；
  // Escape 清空。无 placeholder（纯净输入位）。
  const input = document.createElement("input");
  input.className = "fm-add-input";
  input.addEventListener("keydown", (e) => {
    const ev = e as KeyboardEvent;
    // IME 组合期（中文/日文用 Enter 确认候选）不追加、不退出。
    if (ev.isComposing || ev.keyCode === 229) return;
    if (ev.key === "Enter") {
      ev.preventDefault();
      const value = input.value.trim();
      if (value === "") {
        input.value = "";
        cb.onEmptyEnter?.();
        return;
      }
      input.value = "";
      emit([...items, value]);
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      input.value = "";
    }
  });
  wrap.appendChild(input);
  return wrap;
}

/** 复杂 entry：只读原始行。 */
function buildRaw(entry: Entry): HTMLElement {
  const el = document.createElement("code");
  el.className = "fm-raw-value";
  el.textContent = entry.raw;
  return el;
}

/** 按 entry 类型构造值控件。 */
export function buildValueControl(entry: Entry, cb: ControlCallbacks): HTMLElement {
  if (entry.complex || entry.type === "raw") return buildRaw(entry);
  if (entry.type === "boolean") return buildCheckbox(entry, cb);
  if (entry.type === "list") return buildList(entry, cb);
  return buildInput(entry, cb);
}
