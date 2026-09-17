import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import assert from 'node:assert/strict';

export async function verifyBuild(directory = 'dist') {
  const base = '/';
  const files = await readdir(directory, { recursive: true });
  const pages = files.filter((file) => file.endsWith('.html'));
  for (const route of ['index.html', 'blog/index.html', 'about/index.html']) {
    assert(pages.includes(route), `Missing ${route}`);
  }
  // The Resume/Work pages are gone for good; that content now lives inline
  // on About. Nothing should ship these routes or a resume file.
  assert(!pages.includes('resume/index.html'), 'resume/ route must not exist');
  assert(!pages.includes('work/index.html'), 'work/ route must not exist');
  assert(!files.some((file) => file.toLowerCase().endsWith('.pdf')), 'dist must not ship a resume/CV PDF');
  for (const page of pages) {
    const html = await readFile(join(directory, page), 'utf8');
    if (page === 'blog/notes/functions-tools-agents-langchain/index.html') {
      const diagram = html.match(/<svg\b[^>]*id="mermaid-[^"]+"[^>]*>[\s\S]*?<\/svg>/)?.[0];
      assert(diagram && /<path\b/.test(diagram) && diagram.includes('User Input'), 'LangChain Mermaid diagram did not render to SVG');
      assert(html.includes('class="mermaid-preview"') && /<svg\b[^>]*width="100%"/.test(diagram), 'Mermaid preview must fit the article width');
      assert(html.includes('popover="auto"') && html.includes('popovertarget="mermaid-0-enlarged"'), 'Mermaid needs a native enlargement popover');
      const svgIds = [...html.matchAll(/<svg\b[^>]*id="([^"]+)"/g)].map((match) => match[1]);
      assert(svgIds.includes('mermaid-0-expanded') && new Set(svgIds).size === svgIds.length, 'Enlarged SVG needs unique IDs');
      assert(!/language-mermaid|```mermaid|graph\s+TD/.test(html.replace(diagram, '')), 'Unrendered Mermaid source remains in the article');
      assert(!/<astro-island\b|<link\b[^>]*modulepreload/i.test(html), 'Mermaid article must not ship a framework runtime');
      const scriptBodies = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
      assert(!scriptBodies.some((body) => /mermaid/i.test(body)), 'Mermaid article must not ship a Mermaid client runtime (enlargement is native popover-only)');
      console.log('LangChain Mermaid: responsive static SVG, native enlargement, no raw source, and no Mermaid client runtime.');
    }
    assert(!html.includes('/personal-website/'), `${page} contains the obsolete project-site path`);
    const canonical = new URL(page.replace(/index\.html$/, ''), 'https://momoalison.github.io/').href;
    assert(html.includes(`rel="canonical" href="${canonical}"`), `${page} needs a root-site canonical URL`);

    // Article pages with a TOC (>1 H2/H3) and About (its inline Work timeline
    // toggle) each progressively enhance with exactly one tiny, page-scoped
    // script; every other page must stay entirely script-free.
    const hasToc = html.includes('class="article-toc"');
    const isAbout = page === 'about/index.html';
    const scriptCount = (html.match(/<script\b/gi) || []).length;
    if (hasToc) {
      assert.equal(scriptCount, 1, `${page} has a TOC and should ship exactly one scrollspy script`);
      // Scan only markup, not the scrollspy script's own source text (which
      // legitimately contains the same `data-slug="..."` selector as a JS string).
      const htmlWithoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      const slugCounts = new Map();
      for (const [, slug] of htmlWithoutScripts.matchAll(/data-slug="([^"]+)"/g)) {
        slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
      }
      assert(slugCounts.size > 0, `${page} TOC is missing data-slug identifiers needed by the scrollspy`);
      for (const [slug, count] of slugCounts) {
        assert.equal(count, 3, `${page} slug "${slug}" must appear in the full TOC, the expanded rail panel, and the compact rail stroke (found ${count})`);
      }
      const proseHeadings = [...html.matchAll(/<h([2-6])\b[^>]*\bid="([^"]+)"/g)].map(([, level, id]) => ({ level: Number(level), id }));
      for (const { level, id } of proseHeadings) {
        const inToc = slugCounts.has(id);
        if (level === 2 || level === 3) assert(inToc, `${page} heading #${id} (h${level}) is missing from the TOC/scrollspy`);
        else assert(!inToc, `${page} heading #${id} (h${level}) must not appear in the TOC/scrollspy`);
      }
    } else if (isAbout) {
      assert.equal(scriptCount, 1, `${page} should ship exactly one interaction script`);
      assert(!/<astro-island\b/i.test(html), 'About must not ship a framework runtime');
      assert(!/Download PDF|tun-li-resume\.pdf|Technical Skills|View details/i.test(html), 'About must not expose old Resume/Work-era CV UI');
      assert(html.includes('id="about-more-toggle"') && html.includes('aria-controls="about-timeline"'), 'About is missing the More/Less timeline toggle');
      assert(html.includes('More <span aria-hidden="true">↓'), 'About "More" control should use a down arrow, not a navigation arrow');
      assert(html.includes('images/sayhi.svg'), 'About should use the sayhi illustration');
      // The timeline is text-only now: no tag chips, no Education section,
      // no hover-highlighting hooks left over from the earlier iteration.
      assert(!/class="work-tag/.test(html), 'About timeline must not show technology tags');
      assert(!/class="education-list/.test(html), 'About timeline must not show a separate Education section');
      assert((html.match(/class="timeline-item"/g) || []).length > 0, 'About timeline is missing experience entries');
    } else {
      assert.equal(scriptCount, 0, `${page} ships a script`);
    }

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
  console.log(`Verified ${pages.length} static routes: base paths, local links/assets, anchors, headings, and scoped page-level scripts.`);
}
if (process.argv[1] === new URL(import.meta.url).pathname) await verifyBuild();
