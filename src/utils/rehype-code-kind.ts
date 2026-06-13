/**
 * rehype plugin: stamp every `<code>` element with an explicit
 * `data-inline` flag so renderers don't have to *guess* whether a code node
 * is an inline span or a fenced block.
 *
 * react-markdown (v8+) routes both inline `` `code` `` spans and fenced
 * ```` ``` ```` blocks to a single `code` component and no longer passes an
 * `inline` prop, so consumers are left inferring the distinction at render
 * time from brittle signals (newlines, a `language-` class, string length,
 * the parent tag). This plugin resolves it once, on the AST, using the only
 * authoritative signal: a fenced block is rendered as `<pre><code>`, so a
 * `<code>` whose parent is `<pre>` is a block and everything else is inline.
 *
 * The flag is written to `properties.dataInline` (a boolean). Renderers can
 * read it off the hast node (`node.properties.dataInline`) and fall back to
 * their own heuristic when it is absent.
 *
 * Dependency-free (hand-rolled hast types) to keep this package free of a
 * hast/unist runtime dependency. Run it *after* any sanitization step so the
 * stamped property survives to the renderer.
 */

interface HastElement {
  type: 'element';
  tagName: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

type HastNode =
  | HastElement
  | { type: string; tagName?: string; children?: HastNode[] };

function isElement(node: HastNode): node is HastElement {
  return node.type === 'element' && typeof (node as HastElement).tagName === 'string';
}

export function rehypeCodeKind() {
  return (tree: HastNode): void => {
    const visit = (node: HastNode, parent: HastNode | null): void => {
      if (isElement(node) && node.tagName === 'code') {
        const parentIsPre = parent != null && isElement(parent) && parent.tagName === 'pre';
        node.properties = node.properties || {};
        node.properties.dataInline = !parentIsPre;
      }
      const children = (node as { children?: HastNode[] }).children;
      if (children) {
        for (const child of children) visit(child, node);
      }
    };
    visit(tree, null);
  };
}
