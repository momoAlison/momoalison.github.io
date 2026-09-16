import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import assert from 'node:assert/strict';

export async function verifyBuild(directory = 'dist') {
  const base = '/personal-website/';
  const files = await readdir(directory, { recursive: true });
  const pages = files.filter((file) => file.endsWith('.html'));
  for (const route of ['index.html', 'blog/index.html', 'about/index.html']) {
    assert(pages.includes(route), `Missing ${route}`);
  }
  assert(!pages.some((page) => page.startsWith('resume/')), 'Resume is out of scope');
  for (const page of pages) {
    const html = await readFile(join(directory, page), 'utf8');
    assert(!/<script\b/i.test(html), `${page} ships a script`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page} needs one h1`);
    assert(html.includes('Skip to content'), `${page} needs a skip link`);
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|data:)/.test(url)) continue;
      if (url.startsWith('#')) {
        assert(html.includes(`id="${url.slice(1)}"`), `Broken anchor ${url} in ${page}`);
        continue;
      }
      if (url.startsWith('/')) assert(url.startsWith(base), `Missing base: ${url}`);
      const pathname = decodeURIComponent(url.split('#')[0].split('?')[0]);
      let target = pathname.startsWith(base)
        ? resolve(directory, pathname.slice(base.length))
        : resolve(directory, dirname(page), pathname);
      if (pathname.endsWith('/')) target = join(target, 'index.html');
      await access(target);
    }
  }
  console.log(`Verified ${pages.length} static routes: base paths, local links/assets, anchors, headings, zero scripts, and no Resume.`);
}
if (process.argv[1] === new URL(import.meta.url).pathname) await verifyBuild();
