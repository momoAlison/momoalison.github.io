// Runs at build time, after Astro supplies heading IDs. No browser script required.
export default function editorialMarkdown() {
  return (tree) => {
    function visit(node) {
      if (!node.children) return;
      for (const child of node.children) visit(child);
      if (node.tagName === 'pre') {
        node.properties = { ...node.properties, tabIndex: 0, role: 'region', ariaLabel: 'Scrollable code example' };
      }
      if (/^h[2-6]$/.test(node.tagName) && node.properties?.id) {
        node.children.push({
          type: 'element', tagName: 'a',
          properties: { href: `#${node.properties.id}`, className: ['heading-anchor'], ariaLabel: `Link to section ${node.properties.id}` },
          children: [{ type: 'text', value: '#' }],
        });
      }
      node.children = node.children.map((child) => {
        if (child.tagName === 'svg' && /^mermaid-/.test(String(child.properties?.id))) {
          const id = `${child.properties.id}-enlarged`;
          const width = Number(String(child.properties.viewBox).trim().split(/[\s,]+/)[2]);
          if (!Number.isFinite(width) || width <= 0) {
            throw new Error('Mermaid SVG requires a valid viewBox width');
          }
          child.properties.width = '100%';
          // The second static SVG needs its own IDs, including marker and CSS references.
          const enlarged = structuredClone(child);
          const ids = new Map();
          function collect(node) {
            if (node.properties?.id) ids.set(node.properties.id, `${node.properties.id}-expanded`);
            node.children?.forEach(collect);
          }
          collect(enlarged);
          function rewrite(value) {
            if (typeof value === 'string') {
              return value.replace(/[A-Za-z_][\w-]*/g, (token) => ids.get(token) || token);
            }
            if (Array.isArray(value)) return value.map(rewrite);
            if (value && typeof value === 'object') {
              return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewrite(item)]));
            }
            return value;
          }
          const element = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });
          const text = (value) => ({ type: 'text', value });
          return element('div', { className: ['mermaid-figure'] }, [
            element('button', { type: 'button', className: ['mermaid-preview'], popoverTarget: id, ariaLabel: 'Enlarge diagram' }, [
              child,
              element('span', { className: ['mermaid-hint'], ariaHidden: 'true' }, [text('Enlarge ↗')]),
            ]),
            element('div', { id, popover: 'auto', role: 'dialog', ariaLabel: 'Enlarged diagram', className: ['mermaid-popover'], style: `--diagram-width: ${width}px` }, [
              element('div', { className: ['mermaid-controls'] }, [
                element('label', {}, [element('input', { type: 'checkbox', className: ['mermaid-zoom'] }, []), text(' Original size')]),
                element('button', { type: 'button', popoverTarget: id, popoverTargetAction: 'hide', autofocus: true, ariaLabel: 'Close enlarged diagram' }, [text('Close ×')]),
              ]),
              element('div', { className: ['mermaid-canvas'], tabIndex: 0, role: 'region', ariaLabel: 'Diagram; scroll to explore at original size' }, [rewrite(enlarged)]),
            ]),
          ]);
        }
        return child.tagName === 'table' ? {
          type: 'element', tagName: 'div',
          properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Scrollable table' },
          children: [child],
        } : child;
      });
    }
    visit(tree);
  };
}
