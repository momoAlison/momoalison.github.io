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
      node.children = node.children.map((child) => child.tagName === 'table' ? {
        type: 'element', tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Scrollable table' },
        children: [child],
      } : child);
    }
    visit(tree);
  };
}
