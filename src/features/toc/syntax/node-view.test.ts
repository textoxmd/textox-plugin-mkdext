import { Schema, type Node as PMNode } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import { describe, expect, it } from "vitest";

import { TocNodeView, tocRefreshPlugin } from "./node-view";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    heading: { attrs: { level: { default: 1 } }, group: "block", content: "inline*" },
    text: { group: "inline" },
  },
});

function fakeView(doc: PMNode): EditorView {
  return {
    state: { doc },
    nodeDOM: () => null,
    dispatch() {},
    focus() {},
  } as unknown as EditorView;
}

describe("TocNodeView", () => {
  it("builds a .toc container listing the doc headings", () => {
    const doc = schema.node("doc", null, [
      schema.node("heading", { level: 1 }, schema.text("Title")),
    ]);
    const view = new TocNodeView(doc, fakeView(doc));
    expect(view.dom.className).toBe("toc");
    expect(view.dom.querySelector(".toc-item")?.textContent).toBe("Title");
    expect(view.ignoreMutation()).toBe(true);
    view.destroy();
  });

  it("renders an empty placeholder when there are no headings", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, schema.text("body")),
    ]);
    const view = new TocNodeView(doc, fakeView(doc));
    expect(view.dom.querySelector(".toc-empty")).not.toBeNull();
    view.destroy();
  });
});

describe("tocRefreshPlugin", () => {
  it("returns a plugin with a view spec", () => {
    expect(tocRefreshPlugin().spec.view).toBeTypeOf("function");
  });

  it("re-renders mounted views when the refresh plugin updates", () => {
    const docA = schema.node("doc", null, [
      schema.node("heading", { level: 1 }, schema.text("A")),
    ]);
    const docB = schema.node("doc", null, [
      schema.node("heading", { level: 1 }, schema.text("B")),
    ]);

    // Same mutable fake view is shared by the NodeView and the plugin, so the
    // plugin's tick() observes the doc swap below.
    const v = fakeView(docA);
    const nodeView = new TocNodeView(docA, v);
    expect(nodeView.dom.querySelector(".toc-item")?.textContent).toBe("A");

    const handle = tocRefreshPlugin().spec.view?.(v) as unknown as { update(): void };
    expect(handle).toBeDefined();

    (v.state as { doc: PMNode }).doc = docB;
    handle.update();

    expect(nodeView.dom.querySelector(".toc-item")?.textContent).toBe("B");
    nodeView.destroy();
  });
});
