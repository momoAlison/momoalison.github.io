import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeMermaid from 'rehype-mermaid';
import editorialMarkdown from './src/lib/editorial-markdown.mjs';
import vitesseLightWarm from './src/lib/shiki-theme.mjs';

export default defineConfig({
  site: 'https://momoalison.github.io',
  base: '/',
  trailingSlash: 'always',
  output: 'static',
  cacheDir: './.astro/cache',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: vitesseLightWarm },
    // Shiki skips ```mermaid blocks so rehype-mermaid (below) sees the raw
    // diagram source and renders it to static inline SVG at build time —
    // no mermaid.js ships to the browser.
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    processor: unified({
      rehypePlugins: [rehypeHeadingIds, [rehypeMermaid, { strategy: 'inline-svg' }], editorialMarkdown],
    }),
  },
});
