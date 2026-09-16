import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import editorialMarkdown from './src/lib/editorial-markdown.mjs';

export default defineConfig({
  site: 'https://momoAlison.github.io',
  base: '/personal-website',
  trailingSlash: 'always',
  output: 'static',
  cacheDir: './.astro/cache',
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'github-light' },
    processor: unified({ rehypePlugins: [rehypeHeadingIds, editorialMarkdown] }),
  },
});
