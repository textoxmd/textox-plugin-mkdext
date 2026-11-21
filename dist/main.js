import { Plugin as w } from "@textox/plugin-sdk";
import { Plugin as b, PluginKey as E } from "prosemirror-state";
import { Decoration as g, DecorationSet as T } from "prosemirror-view";
const m = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, x = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution"
};
function A(n) {
  const e = document.createElement("span");
  return e.className = "alert-label", e.contentEditable = "false", e.textContent = x[n] ?? n, e;
}
function C(n, e) {
  const t = [];
  return n.descendants((o, r) => {
    if (o.type.name !== "blockquote") return !0;
    const s = o.firstChild;
    if (!s || s.type.name !== "paragraph") return !1;
    const c = s.firstChild;
    if (!c?.isText) return !1;
    const i = c.text?.match(m);
    if (!i) return !1;
    const d = i[1].toLowerCase();
    if (!x[d]) return !1;
    t.push(
      g.node(r, r + o.nodeSize, { class: `alert alert-${d}` })
    );
    const a = r + 2, u = a + i[0].length;
    return e >= a && e <= u || (t.push(g.inline(a, u, { class: "syntax-hidden" })), t.push(g.widget(a, A(d), { side: -1 }))), !1;
  }), t;
}
function N(n) {
  n.core.ruler.push("alert_split", (e) => {
    const t = e.tokens;
    for (let o = 0; o < t.length; o++) {
      if (t[o]?.type !== "blockquote_open") continue;
      let r = 1, s = -1;
      for (let h = o + 1; h < t.length && r > 0; h++) {
        const f = t[h];
        if (f.type === "blockquote_open") {
          r++;
          continue;
        }
        if (f.type === "blockquote_close") {
          r--;
          continue;
        }
        r === 1 && f.type === "inline" && s < 0 && (s = h);
      }
      if (s < 0) continue;
      const c = t[s], i = c.content;
      if (!i.match(m)) continue;
      const a = i.indexOf(`
`);
      if (a < 0) continue;
      const u = i.slice(0, a), k = i.slice(a + 1);
      c.content = u, c.children = [new e.Token("text", "", 0)], c.children[0].content = u;
      const l = [];
      l.push(new e.Token("paragraph_close", "p", -1));
      const y = new e.Token("paragraph_open", "p", 1);
      y.block = !0, l.push(y);
      const p = new e.Token("inline", "", 0);
      p.content = k, p.children = [new e.Token("text", "", 0)], p.children[0].content = k, p.block = !0, l.push(p), l.push(new e.Token("paragraph_close", "p", -1)), t.splice(s + 1, 1, ...l), o = s + l.length;
    }
    return !0;
  });
}
const R = {
  name: "alert",
  mdItPlugins: [N],
  inline: {
    markNames: [],
    extRanges: (n) => {
      if (n.type.name !== "paragraph") return [];
      const e = n.textContent.match(m);
      return e ? [[0, e[0].length]] : [];
    }
  },
  plugins: (n) => [
    new b({
      key: new E("alert-decoration"),
      props: {
        decorations(e) {
          const t = C(e.doc, e.selection.$head.pos);
          return t.length > 0 ? T.create(e.doc, t) : T.empty;
        }
      }
    })
  ]
}, F = {
  id: "alert",
  register: ({ editor: n }) => [n.registerSyntaxFeature(R)]
}, P = [F], _ = "en-US", S = {
  "en-US": {
    name: "Markdown Extensions",
    description: "Editor-native Markdown syntax extensions packaged as a single plugin.",
    groups: { editor: "Editing" },
    alert: {
      label: "Callout boxes",
      description: "GitHub-style callouts using blockquote syntax, e.g. > [!NOTE]"
    }
  },
  "zh-CN": {
    name: "Markdown 扩展",
    description: "以单个插件形式提供的编辑器原生 Markdown 语法扩展。",
    groups: { editor: "编辑" },
    alert: {
      label: "提示框",
      description: "GitHub 风格的提示框，使用引用语法，如 > [!NOTE]"
    }
  }
};
class O extends w {
  featureResources = [];
  onload() {
    this.addMessages(S, _), this.syncFeatures(), this.disposables.add(this.settings.onDidChange(() => this.syncFeatures()));
  }
  onunload() {
    this.disposeFeatures();
  }
  /** 按当前设置重装特性：先全部释放，再装配启用项。 */
  syncFeatures() {
    this.disposeFeatures();
    for (const e of P)
      if (this.settings.get(e.id) !== !1)
        try {
          const t = e.register({
            editor: this.app.editor,
            settings: this.settings,
            t: (o) => this.t(o)
          });
          this.featureResources.push(...Array.isArray(t) ? t : [t]);
        } catch (t) {
          this.app.log.error(`feature ${e.id} failed to load`, t);
        }
  }
  disposeFeatures() {
    for (const e of this.featureResources)
      try {
        e.dispose();
      } catch (t) {
        this.app.log.warn("feature dispose failed", t);
      }
    this.featureResources = [];
  }
}
export {
  O as default
};
