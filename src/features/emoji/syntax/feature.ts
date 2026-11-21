import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import type { EditorState } from "prosemirror-state";
import { Decoration, DecorationSet, type EditorView } from "prosemirror-view";
import { bare } from "markdown-it-emoji";
import { wholeTokenSpan } from "@textox/plugin-sdk";
import type {
  InlineDecorationWidgetBuilder,
  InlineDeriveContext,
  InlineSpan,
  SyntaxFeature,
  TokenAdvance,
} from "@textox/plugin-sdk";

import emojiData from "markdown-it-emoji/lib/data/full.mjs";

// Emoji `:name:` — Typora-style. The source `:name:` lives verbatim in
// the textblock text (so md round-trip is automatic). A widget decoration
// renders the unicode glyph just *before* the source span, and the source
// chars themselves get a delim range that hides them when the cursor is
// outside the span (gray when inside — same convention as image / link
// delim hints).
//
// Tokens come from `markdown-it-emoji` (core rule, `bare` = defs only, no
// shortcuts), so the recognition rules are upstream's: unknown names stay
// text, code spans / autolinks are never scanned, and nesting inside
// emphasis / links / sub is handled by the positioning layer.
//
// Pretty:
//   :smile|             — pre-close, plain typing, no widget yet
//   😄<g>:smile:</g>|   — closing colon lands; cursor inside surrounding span
//   😄 |                — cursor moved past, source hidden, glyph stays

// Sourced from markdown-it-emoji's full registry (~1500 GitHub-style
// names). Kept as a typed Record for the autocomplete and the md-it rule.
const EMOJI = emojiData as Record<string, string>;
const ALL_NAMES = Object.keys(EMOJI).sort();

/** 从 pos 起连续反斜杠的数量。 */
function backslashRun(text: string, pos: number): number {
  let count = 0;
  while (text[pos + count] === "\\") count++;
  return count;
}

const emojiTokenAdvance: TokenAdvance = (text, pos, tok) => {
  if (tok.type !== "emoji") return null;
  // sub/sup 会反转义内容，emoji token 的起点可能落在一段反斜杠之后：
  // `~a\:smile:~` 的 token 起点是 `\`，源码宽度 = 反斜杠串 + `:name:`。
  const run = backslashRun(text, pos);
  const source = `:${tok.markup}:`;
  if (!text.startsWith(source, pos + run)) return null;
  return run + source.length;
};

/** 冒号前是否有奇数个反斜杠（本仓库 escape 保留反斜杠，需自行避让）。 */
function isEscapedColon(text: string, pos: number): boolean {
  let count = 0;
  for (let i = pos - 1; i >= 0 && text[i] === "\\"; i--) count++;
  return count % 2 === 1;
}

// 上游 emoji core 规则只处理 inline children，不下钻 image 的 alt 子 token：
// `![:smile:](u)` 的 alt 内短码保持普通文本（旧 scan 会识别）。阶段 1 接受该
// 差异——alt 不参与正常渲染，doc 与序列化往返不变。
function deriveEmoji(ctx: InlineDeriveContext): InlineSpan[] {
  const out: InlineSpan[] = [];
  for (const tok of ctx.tokens) {
    if (tok.token.type !== "emoji" || !tok.exact) continue;
    const colon = tok.pos + backslashRun(ctx.text, tok.pos);
    // 冒号前若有奇数个反斜杠，这个冒号是转义的：不产 span（反斜杠仍是普通文本）。
    if (isEscapedColon(ctx.text, colon)) continue;
    const source = `:${tok.token.markup}:`;
    if (colon + source.length !== tok.end) continue; // 防御：位置与 token 不一致
    const span = wholeTokenSpan(
      { token: tok.token, pos: colon, end: tok.end, exact: true, verified: true },
      {
        type: "emoji",
        widget: {
          kind: "emoji",
          // `len` 是 `:name:` 的长度（不含前置反斜杠串），点击后落到 span 尾部。
          attrs: { glyph: tok.token.content, len: String(source.length) },
          when: "always",
          side: -1,
          stopEvents: true,
        },
      },
    );
    if (span) out.push(span);
  }
  return out;
}

// ─── Autocomplete dropdown ────────────────────────────────────────────────
//
// While the user is typing `:partial` (no closing colon yet), open a
// floating list of matching names. Detection is selection-driven: every
// state transition we look at the chars before the cursor inside the
// current textblock and match `\B:[a-z0-9_+\-]+$`. If at least one known
// name starts with the partial, the dropdown opens.
//
// The popup is a Decoration.widget at the cursor position so it lives
// in the same DOM tree (test-pretty can see it). Visually it's
// `position: fixed` and gets placed below the cursor by the plugin's
// view-update hook (`view.coordsAtPos` → viewport top/left). Because
// the widget stays inside the editor's DOM, an ancestor with
// `contain: layout` (the app's `.editor-area`) or a transform can
// become its fixed containing block — the reposition hook compensates
// for that via the element's `offsetParent`.
//
// Selected index is plugin state. Up/Down move it, Enter/Tab commit,
// Escape closes. Click on a row commits its name. The committed text is
// `:name: ` (trailing space) — the closing colon makes markdown-it-emoji
// emit an emoji token, the space pushes the cursor past the span so the
// source hides.

const PARTIAL_RE = /\B:([a-z0-9_+\-]+)$/;
const MAX_VISIBLE = 8;

type AutoState = {
  open: boolean;
  partial: string;
  matches: string[];
  selected: number;
  // dismissed: user pressed Escape — keep popup closed until partial
  // changes (text edit) or the cursor leaves the partial region.
  dismissedFor: string;
  // Absolute doc positions of `:` (from) and the cursor (to).
  from: number;
  to: number;
};

const CLOSED: AutoState = {
  open: false,
  partial: "",
  matches: [],
  selected: 0,
  dismissedFor: "",
  from: 0,
  to: 0,
};

const autoKey = new PluginKey<AutoState>("emoji-autocomplete");

type AutoMeta =
  | { type: "select"; index: number }
  | { type: "dismiss" };

function findMatches(partial: string): string[] {
  // Two-pass score: prefix matches first (alphabetical), then substring
  // matches. Cap at MAX_VISIBLE so the popup stays small.
  const out: string[] = [];
  for (const n of ALL_NAMES) {
    if (n.startsWith(partial)) out.push(n);
    if (out.length >= MAX_VISIBLE) return out;
  }
  if (out.length < MAX_VISIBLE) {
    for (const n of ALL_NAMES) {
      if (out.includes(n)) continue;
      if (n.includes(partial)) out.push(n);
      if (out.length >= MAX_VISIBLE) break;
    }
  }
  return out;
}

function computeAutoState(state: EditorState, prev: AutoState): AutoState {
  const sel = state.selection;
  if (!sel.empty) return CLOSED;
  const $pos = sel.$from;
  if (!$pos.parent.isTextblock) return CLOSED;
  const text = $pos.parent.textBetween(0, $pos.parentOffset, "\n", "\n");
  const m = PARTIAL_RE.exec(text);
  if (!m) return CLOSED;
  // 冒号若被反斜杠转义（`\:smile:`），不触发补全——与 emoji 派生的避让规则一致。
  // `m.index` 是冒号在 text 中的位置；偶数个反斜杠表示冒号未转义（`\\:`）。
  if (isEscapedColon(text, m.index)) return CLOSED;
  const partial = m[1]!;
  // Suppress the popup if the user dismissed it for this exact partial.
  if (prev.dismissedFor === partial) {
    return { ...CLOSED, dismissedFor: partial };
  }
  const matches = findMatches(partial);
  if (matches.length === 0) return CLOSED;
  const cursor = $pos.pos;
  // Preserve selected index when partial unchanged and selected still in
  // range; otherwise reset to 0.
  const sameSearch =
    prev.open && prev.partial === partial && prev.matches.length === matches.length;
  const selected = sameSearch ? Math.min(prev.selected, matches.length - 1) : 0;
  return {
    open: true,
    partial,
    matches,
    selected,
    dismissedFor: "",
    from: cursor - partial.length - 1, // points at `:`
    to: cursor,
  };
}

function commit(view: EditorView, name: string, s: AutoState): void {
  const replacement = `:${name}: `;
  const tr = view.state.tr.insertText(replacement, s.from, s.to);
  const newPos = s.from + replacement.length;
  tr.setSelection(TextSelection.create(tr.doc, newPos));
  view.dispatch(tr);
}

function emojiAutocompletePlugin(): Plugin<AutoState> {
  return new Plugin<AutoState>({
    key: autoKey,
    state: {
      init: (_, state) => computeAutoState(state, CLOSED),
      apply(tr, prev, _oldState, newState) {
        const meta = tr.getMeta(autoKey) as AutoMeta | undefined;
        if (meta?.type === "select") {
          if (!prev.open) return prev;
          const max = prev.matches.length - 1;
          const next = Math.max(0, Math.min(max, meta.index));
          return { ...prev, selected: next };
        }
        if (meta?.type === "dismiss") {
          return { ...CLOSED, dismissedFor: prev.partial };
        }
        return computeAutoState(newState, prev);
      },
    },
    props: {
      decorations(state) {
        const s = autoKey.getState(state);
        if (!s?.open) return DecorationSet.empty;
        // Re-create the widget DOM only when the rendered shape would
        // change — `key` lets PM dedupe across transactions.
        const el = buildDropdown(s);
        return DecorationSet.create(state.doc, [
          Decoration.widget(s.to, el, {
            side: 1,
            key: `emoji-auto@${s.partial}@${s.selected}`,
            ignoreSelection: true,
            stopEvent: () => true,
          }),
        ]);
      },
      handleKeyDown(view, e) {
        const s = autoKey.getState(view.state);
        if (!s?.open) return false;
        if (e.key === "ArrowDown") {
          view.dispatch(
            view.state.tr.setMeta(autoKey, { type: "select", index: s.selected + 1 } as AutoMeta),
          );
          e.preventDefault();
          return true;
        }
        if (e.key === "ArrowUp") {
          view.dispatch(
            view.state.tr.setMeta(autoKey, { type: "select", index: s.selected - 1 } as AutoMeta),
          );
          e.preventDefault();
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          const name = s.matches[s.selected];
          if (!name) return false;
          commit(view, name, s);
          e.preventDefault();
          return true;
        }
        if (e.key === "Escape") {
          view.dispatch(view.state.tr.setMeta(autoKey, { type: "dismiss" } as AutoMeta));
          e.preventDefault();
          return true;
        }
        return false;
      },
    },
    // Position the popup below the cursor after every update. It uses
    // `position: fixed` with viewport coords from `coordsAtPos`, but the
    // widget lives inside the editor's DOM — if an ancestor is a fixed
    // containing block (via `contain: layout`, transform, etc.) the
    // coords must be rebased to that block (see reposition below).
    view(view) {
      const reposition = () => {
        const s = autoKey.getState(view.state);
        if (!s?.open) return;
        const el = view.dom.querySelector<HTMLElement>(".emoji-completion");
        if (!el) return;
        // side=-1: anchor to the *right edge of the previous char* rather
        // than "after the position". With the default (side=1), a cursor
        // at the end of a textblock falls through to the textblock's
        // bottom boundary — for our editor (min-height 168px) that's far
        // below the actual line, putting the popup at the bottom of the
        // empty editor area instead of below the cursor.
        const coords = view.coordsAtPos(s.to, -1);
        // `coordsAtPos` returns viewport coordinates, but the popup's
        // `position: fixed` containing block is not always the viewport:
        // an ancestor with `contain: layout` (the app's `.editor-area`)
        // or a CSS transform becomes the containing block instead.
        // `offsetParent` reflects that real containing block (null when
        // it's the viewport), so subtract its origin to keep the popup
        // anchored at the cursor rather than shifted by the ancestor.
        const op = el.offsetParent as HTMLElement | null;
        const opRect = op?.getBoundingClientRect() ?? { top: 0, left: 0 };
        el.style.top = `${coords.bottom + 2 - opRect.top}px`;
        el.style.left = `${coords.left - opRect.left}px`;
        // Keep the selected row visible by scrolling the popup itself
        // (NOT scrollIntoView — that would walk up to scroll the page).
        const sel = el.querySelector<HTMLElement>(".emoji-completion-row.selected");
        if (sel) {
          const elRect = el.getBoundingClientRect();
          const selRect = sel.getBoundingClientRect();
          if (selRect.top < elRect.top) {
            el.scrollTop -= elRect.top - selRect.top;
          } else if (selRect.bottom > elRect.bottom) {
            el.scrollTop += selRect.bottom - elRect.bottom;
          }
        }
      };
      reposition();
      return {
        update() {
          reposition();
        },
      };
    },
  });
}

function buildDropdown(s: AutoState): HTMLElement {
  const root = document.createElement("div");
  root.className = "emoji-completion";
  root.setAttribute("contenteditable", "false");
  // Stop PM from treating clicks/mousedowns as editor input — without
  // this the editor steals focus before our click handler fires.
  root.addEventListener("mousedown", (e) => e.preventDefault());
  for (let i = 0; i < s.matches.length; i++) {
    const name = s.matches[i]!;
    const row = document.createElement("div");
    row.className = "emoji-completion-row";
    if (i === s.selected) row.classList.add("selected");
    row.dataset.name = name;
    const glyph = document.createElement("span");
    glyph.className = "emoji-completion-glyph";
    glyph.textContent = EMOJI[name] ?? "";
    const label = document.createElement("span");
    label.className = "emoji-completion-name";
    label.textContent = `:${name}:`;
    row.appendChild(glyph);
    row.appendChild(label);
    row.addEventListener("click", () => {
      root.dispatchEvent(
        new CustomEvent("emoji-autocomplete-pick", {
          bubbles: true,
          detail: { name },
        }),
      );
    });
    root.appendChild(row);
  }
  return root;
}

// Bridge: turn the dropdown's CustomEvent into a real PM commit.
// We can't dispatch from the widget builder (no view there); the
// plugin's view object is the natural carrier.
function emojiBridgePlugin(): Plugin {
  return new Plugin({
    view(view) {
      const handler = (e: Event) => {
        const ce = e as CustomEvent<{ name: string }>;
        const s = autoKey.getState(view.state);
        if (!s?.open) return;
        commit(view, ce.detail.name, s);
      };
      view.dom.addEventListener("emoji-autocomplete-pick", handler);
      return {
        destroy() {
          view.dom.removeEventListener("emoji-autocomplete-pick", handler);
        },
      };
    },
  });
}

// Clicking the rendered glyph drops the caret at the *tail* of the
// `:name:` source rather than the head. PM's default for a widget
// at side=-1 puts the cursor right before the widget, which lands
// visually outside the emoji span — the source chars are hidden and
// the user thinks the click did nothing.
function emojiClickPlugin(): Plugin {
  return new Plugin({
    props: {
      handleClick(view, _pos, event) {
        const target = event.target as HTMLElement | null;
        const glyph = target?.closest(".emoji-glyph") as HTMLElement | null;
        if (!glyph) return false;
        const len = Number(glyph.getAttribute("data-len") ?? "0");
        if (!len) return false;
        const widgetPos = view.posAtDOM(glyph, 0);
        if (widgetPos < 0) return false;
        const tail = widgetPos + len;
        if (tail > view.state.doc.content.size) return false;
        event.preventDefault();
        view.dispatch(
          view.state.tr.setSelection(TextSelection.create(view.state.doc, tail)),
        );
        view.focus();
        return true;
      },
    },
  });
}

// Glyph rendered at the span's start, before the (often-hidden)
// `:name:` source chars. textContent is the unicode glyph; nothing
// fancy — emoji rendering is a font/system concern, not ours.
// `data-len` carries the source length (`:name:` chars) so the
// click handler above can set the cursor to the tail.
const emojiWidgetBuilder: InlineDecorationWidgetBuilder = (attrs) => {
  const el = document.createElement("span");
  el.className = "emoji-glyph";
  el.textContent = attrs.glyph ?? "";
  if (attrs.len) el.setAttribute("data-len", attrs.len);
  return el;
};

export const emojiSyntaxFeature: SyntaxFeature = {
  name: "emoji",

  // No mark, no node — pure decoration. The source chars are valid plain
  // text in md (no escape needed for `:`), so serialization is automatic.

  // `bare` installs the core replacement rule with only the shortcode table
  // (no `:)`-style shortcuts; those must stay plain text).
  mdItPlugins: [(md) => md.use(bare, { defs: EMOJI, shortcuts: {} })],

  // Fallback for the legacy per-token load path: keep the source spelling.
  // 依赖 `shortcuts: {}`：shortcut 的 markup 是规范名而非源码短码，若启用
  // shortcuts 这里会把 `:)` 改写成 `:smile:`。
  parserTokens: {
    emoji: (state, tok) => {
      state.addText(`:${tok.markup}:`);
    },
  },

  plugins: () => [emojiAutocompletePlugin(), emojiBridgePlugin(), emojiClickPlugin()],

  inline: {
    // 四个迁移特性（highlight / sub-sup / math / emoji）都是 `order: -1`，
    // 组内次序由注册序决定；emoji 的 span 是原子（无 mark），先认领先占用，
    // 其余特性不得再认领其区间。
    order: -1,
    derive: deriveEmoji,
    tokenAdvance: emojiTokenAdvance,
    markNames: [],
    extRanges: () => [],
    decorationWidgets: { emoji: emojiWidgetBuilder },
  },
};
