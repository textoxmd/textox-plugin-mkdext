import type { Node as PMNode } from "prosemirror-model";
import { Plugin, TextSelection } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";

// All currently-mounted TocNodeViews. The refresh plugin iterates this to
// re-render whenever the editor state changes: the toc node itself does not
// change when surrounding headings do, so PM's usual NodeView.update cannot
// be relied on alone.
const liveViews = new Set<TocNodeView>();

export class TocNodeView implements NodeView {
  dom: HTMLElement;
  private view: EditorView;
  // Cache the last rendered (doc, items) so the refresh plugin bails out fast
  // when nothing relevant to the TOC changed (refresh fires on every tx).
  private lastDoc: PMNode | null = null;
  private lastSig = "";

  constructor(_node: PMNode, view: EditorView) {
    this.view = view;
    this.dom = document.createElement("div");
    this.dom.className = "toc";
    this.dom.setAttribute("contenteditable", "false");
    this.render();
    liveViews.add(this);
  }

  render(): void {
    const doc = this.view.state.doc;
    if (doc === this.lastDoc) return; // selection-only tx → identical
    const items: { level: number; text: string; pos: number }[] = [];
    doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        items.push({
          level: node.attrs.level as number,
          text: node.textContent,
          pos,
        });
      }
    });

    // Cheap signature so doc-changed-but-no-headings-changed (e.g. typing
    // in a paragraph after the last heading) skips the DOM rebuild. Pos
    // is included so jumpTo handlers stay accurate when text inserted
    // earlier shifts later heading positions.
    const sig = items.map((it) => `${it.pos}\t${it.level}\t${it.text}`).join("\n");
    if (sig === this.lastSig && this.lastDoc !== null) {
      this.lastDoc = doc;
      return;
    }
    this.lastDoc = doc;
    this.lastSig = sig;

    this.dom.innerHTML = "";

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "toc-empty";
      empty.textContent = "(no headings yet)";
      this.dom.appendChild(empty);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "toc-list";
    for (const it of items) {
      const li = document.createElement("li");
      li.className = `toc-item toc-h${it.level}`;
      li.textContent = it.text || "(empty heading)";
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
      });
      li.addEventListener("click", () => this.jumpTo(it.pos));
      ul.appendChild(li);
    }
    this.dom.appendChild(ul);
  }

  private jumpTo(headingPos: number): void {
    const tr = this.view.state.tr;
    // Cursor at the start of the heading's text content.
    tr.setSelection(TextSelection.near(tr.doc.resolve(headingPos + 1)));
    this.view.dispatch(tr);
    // Pin the heading at the top of the viewport (hosts offset via
    // scroll-margin-top for sticky chrome).
    const dom = this.view.nodeDOM(headingPos) as HTMLElement | null;
    dom?.scrollIntoView({ block: "start", behavior: "smooth" });
    this.view.focus();
  }

  // The node never changes (atom, no attrs/content); the refresh plugin calls
  // render() externally. Returning true tells PM "we handled it".
  update(): boolean {
    return true;
  }

  destroy(): void {
    liveViews.delete(this);
  }

  // Atom block — selectable and PM should treat the whole node as a unit.
  stopEvent(): boolean {
    // Let our own click handlers run; PM otherwise tries to translate
    // mouse events into selection moves into the node, which doesn't
    // make sense for an atom.
    return false;
  }

  ignoreMutation(): boolean {
    // We mutate `this.dom` ourselves on render; tell PM not to interpret
    // those as content changes.
    return true;
  }
}

export function tocRefreshPlugin(): Plugin {
  return new Plugin({
    view() {
      const tick = (): void => {
        for (const v of liveViews) v.render();
      };
      tick();
      return {
        update() {
          tick();
        },
      };
    },
  });
}
