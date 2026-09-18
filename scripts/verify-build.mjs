import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Preserve the complete original compound ink (including every hollow contour).
// The visible base and moving pieces must partition it with identical clip edges.
function verifyInkPartition(html, prefix, regions, expectedHash) {
  const ink = html.match(new RegExp(`<path id="${prefix}-ink"[^>]*d="([^"]+)"`))?.[1];
  assert(ink, `Missing original ${prefix} ink`);
  assert.equal(createHash('sha256').update(ink).digest('hex'), expectedHash, `${prefix} lost original contours`);
  const clips = regions.map((region) => {
    const clip = html.match(new RegExp(`<clipPath id="${prefix}-${region}"><path d="([^"]+)"`))?.[1];
    assert(clip, `Missing ${region} clip`);
    assert(html.includes(`clip-path="url(#${prefix}-${region})"><use href="#${prefix}-ink"`), `${region} must reuse complete ink`);
    return clip;
  });
  assert(html.includes(`<clipPath id="${prefix}-base"><path clip-rule="evenodd" d="M0 0H1254V1254H0Z${clips.join('')}"`), `${prefix} base must exclude exactly the moving regions using clip-rule`);
  assert.equal((html.match(new RegExp(`<use href="#${prefix}-ink" clip-path="url\\(#${prefix}-base\\)"`, 'g')) || []).length, 1, `${prefix} must paint exactly one clipped base`);
}

export async function verifyBuild(directory = 'dist') {
  const base = '/';
  await access(join(directory, 'favicon.png'));
  await access(join(directory, 'og-image.png'));
  const files = await readdir(directory, { recursive: true });
  const pages = files.filter((file) => file.endsWith('.html'));
  for (const route of ['index.html', 'blog/index.html', 'about/index.html', '404.html', 'site-guide/index.html']) {
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
    if (page === '404.html' || page === 'site-guide/index.html') {
      assert(html.includes('name="robots" content="noindex"'), `${page} must not be indexed`);
    } else {
      assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${page} needs one canonical`);
      assert(html.includes(`rel="canonical" href="${canonical}"`), `${page} needs a root-site canonical URL`);
    }
    for (const property of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image']) {
      assert.equal((html.match(new RegExp(`property="${property}"`, 'g')) || []).length, 1, `${page} needs one ${property}`);
    }
    assert(html.includes('rel="icon" type="image/png" href="/favicon.png"'), `${page} needs the root favicon`);
    assert(html.includes('property="og:image" content="https://momoalison.github.io/og-image.png"'), `${page} needs the production social image`);
    assert(html.includes('name="twitter:card" content="summary_large_image"'), `${page} needs a large-image Twitter card`);
    assert(html.includes('name="twitter:image" content="https://momoalison.github.io/og-image.png"'), `${page} needs the same Twitter image`);
    assert(/<title>[^<]+<\/title>/.test(html), `${page} needs a title`);
    assert(/name="description" content="[^"]+"/.test(html), `${page} needs a description`);
    if (page.startsWith('blog/') && page !== 'blog/index.html') assert(html.includes('property="og:type" content="article"'), `${page} needs article social metadata`);

    // Every article page ships the tiny Copy-button script and the
    // Back-to-top script unconditionally (both are no-ops until there's
    // something to act on — no code blocks, or no scroll past the reveal
    // threshold), plus a TOC scrollspy only when a TOC (>1 H2/H3) actually
    // renders. The Site Guide shares the exact same ArticleToc/
    // CopyButtonScript/BackToTop components, so it shares this branch's
    // invariants too, not a separate one. About/Home/Blog index each ship
    // exactly one interaction script of their own; every other page must
    // stay entirely script-free.
    const hasToc = html.includes('class="article-toc"');
    const isArticle = (page.startsWith('blog/') && page !== 'blog/index.html') || page === 'site-guide/index.html';
    const isAbout = page === 'about/index.html';
    const isBlogIndex = page === 'blog/index.html';
    const isHome = page === 'index.html';
    const scriptCount = (html.match(/<script\b/gi) || []).length;
    if (isArticle) {
      const expectedScripts = 2 + (hasToc ? 1 : 0);
      assert.equal(scriptCount, expectedScripts, `${page} should ship the Copy-button and Back-to-top scripts always, plus a TOC scrollspy only when a TOC renders`);
      assert(html.includes('class="back-to-top"') && html.includes('aria-label="Back to top"'), `${page} is missing the Back-to-top control`);

      // Every rendered <pre> must get exactly one build-time wrapper and
      // button, regardless of whether the article's script does anything.
      const preCount = (html.match(/<pre\b/g) || []).length;
      const codeBlockCount = (html.match(/class="code-block"/g) || []).length;
      const copyButtonCount = (html.match(/class="copy-button"/g) || []).length;
      assert.equal(codeBlockCount, preCount, `${page} every <pre> should have exactly one .code-block wrapper`);
      assert.equal(copyButtonCount, preCount, `${page} every <pre> should get exactly one Copy button`);
      if (preCount > 0) {
        assert(html.includes('class="copy-button" aria-label="Copy code" hidden') || html.includes('class="copy-button" hidden aria-label="Copy code"'), `${page} Copy buttons must render \`hidden\` by default (progressive enhancement)`);
      }
      assert(!/<svg\b[^>]*id="mermaid-[^"]*"[\s\S]{0,80}class="copy-button"/.test(html), `${page} must not put a Copy button on a rendered Mermaid diagram`);

      if (hasToc) {
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
      }
    } else if (isAbout) {
      assert.equal(scriptCount, 1, `${page} should ship exactly one interaction script`);
      assert(!/<astro-island\b/i.test(html), 'About must not ship a framework runtime');
      assert(!/Download PDF|tun-li-resume\.pdf|Technical Skills|View details/i.test(html), 'About must not expose old Resume/Work-era CV UI');
      assert(html.includes('id="about-more-toggle"') && html.includes('aria-controls="about-timeline"'), 'About is missing the More/Less timeline toggle');
      assert(html.includes('More <span aria-hidden="true">↓'), 'About "More" control should use a down arrow, not a navigation arrow');
      // sayhi.svg is inlined (not <img src>) so the hand/wave animation can
      // target its internal groups; check for that structure instead of a
      // file path, plus the preserved accessible label.
      assert(html.includes('id="about-character"') && html.includes('data-hand-left') && html.includes('data-hand-right'), 'About is missing the inlined sayhi illustration with animatable hand groups');
      assert(html.includes('aria-label="Hand-drawn illustration of the site owner waving hello."'), 'About illustration lost its accessible label');
      // Regression guards for the hand-duplication/black-fill/duplicate-
      // motion-line bugs: exactly one hand element per side, each hand's own
      // fill must be the artwork's ink color (never left at SVG's black
      // default), and motion marks must be the artwork's existing accent
      // strokes (reused in place), not a second hand-authored set.
      assert((html.match(/data-hand-left="true"/g) || []).length === 1, 'About must have exactly one left-hand group (found duplicate hand geometry)');
      assert((html.match(/data-hand-right="true"/g) || []).length === 1, 'About must have exactly one right-hand group (found duplicate hand geometry)');
      assert(html.includes('data-motion-left="true"') && html.includes('data-motion-right="true"'), 'About is missing the reused motion-mark groups near each hand');
      assert(!html.includes('class="motion-lines"'), 'About must not ship a second, separately-authored motion-line set');
      verifyInkPartition(html, 'greeting', ['left', 'right'], 'b06dd4ea59b3a983cd5df7801f3ba06b45555b376fc0d011590650daf77b0f3f');
      assert(/<div[^>]*id="about-character"[^>]*aria-hidden="true"/.test(html), 'Decorative greeting must not be an interactive control');
      assert(!/<[^>]*id="about-character"[^>]*(?:tabindex|role)=/.test(html), 'Decorative greeting must not add a tab stop or interactive role');
      for (const side of ['left', 'right']) {
        const marks = html.match(new RegExp(`<g data-motion-${side}="true">([\\s\\S]*?)</g>`))?.[1] ?? '';
        assert.equal((marks.match(/<path\b/g) || []).length, 3, 'Each hand should reuse exactly its three original motion marks');
      }
      // The timeline is text-only now: no tag chips, no Education section,
      // no hover-highlighting hooks left over from the earlier iteration.
      assert(!/class="work-tag/.test(html), 'About timeline must not show technology tags');
      assert(!/class="education-list/.test(html), 'About timeline must not show a separate Education section');
      assert((html.match(/class="timeline-item"/g) || []).length > 0, 'About timeline is missing experience entries');
    } else if (isHome) {
      assert.equal(scriptCount, 1, `${page} should ship exactly one eye-tracking script`);
      assert(!/<astro-island\b/i.test(html), 'Home must not ship a framework runtime');
      // character.svg is inlined for the same reason as sayhi.svg above.
      assert(html.includes('id="home-character"') && html.includes('data-eye-left') && html.includes('data-eye-right'), 'Home is missing the inlined character illustration with animatable eye groups');
      assert(html.includes('aria-label="Hand-drawn developer with a blue-green hair tie, working at a laptop beside a cup of coffee."'), 'Home illustration lost its accessible label');
      assert(html.includes('data-hair-lock="true"'), 'Home is missing the animatable hair lock');
      verifyInkPartition(html, 'home-hair', ['lock'], 'a95fd86ce85b3727d647f9117948f9f4fa6a1d9e34b5e06a25e1a7587865eae8');
      assert.equal((html.match(/data-steam="[12]"/g) || []).length, 2, 'Home must animate exactly the two original steam strokes');
    } else if (isBlogIndex) {
      assert.equal(scriptCount, 1, `${page} should ship exactly one filtering script`);
      assert(!/<astro-island\b/i.test(html), 'Blog index must not ship a framework runtime');
      if (html.includes('class="post-list"')) {
        // Topics only render once there is published, tagged content.
        assert(html.includes('class="topics"'), `${page} is missing the Topics section`);
        assert(html.includes('aria-pressed="true"') && html.includes('data-topic=""'), `${page} is missing the "All topics" control`);
        const topicButtons = (html.match(/class="topic"/g) || []).length;
        assert(topicButtons > 1, `${page} Topics list should include "All topics" plus at least one real tag`);
        assert(html.includes('class="filter-empty" hidden'), `${page} is missing a hidden-by-default empty-state message`);
        assert((html.match(/data-tags="/g) || []).length > 0, `${page} post rows are missing data-tags for topic filtering`);
      }
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
  const sitemap = await readFile(join(directory, 'sitemap-0.xml'), 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  // 404 and the Site Guide are both noindex and intentionally excluded from
  // the sitemap (see the sitemap() filter in astro.config.mjs) — every other
  // route must appear exactly once.
  const expectedUrls = pages.filter((page) => page !== '404.html' && page !== 'site-guide/index.html').map((page) => new URL(page.replace(/index\.html$/, ''), 'https://momoalison.github.io/').href);
  assert.deepEqual(sitemapUrls.sort(), expectedUrls.sort(), 'Sitemap must contain exactly the public, indexable HTML routes');
  const feed = await readFile(join(directory, 'rss.xml'), 'utf8');
  const feedLinks = [...feed.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>/g)].map((match) => match[1]);
  assert.deepEqual(feedLinks.sort(), expectedUrls.filter((url) => /\/blog\/.+/.test(new URL(url).pathname)).sort(), 'RSS must contain exactly the published articles');
  assert(!/Disallow:\s*\/\s*$/m.test(await readFile(join(directory, 'robots.txt'), 'utf8')), 'Robots must allow indexing');
  console.log(`Verified ${pages.length} static routes: base paths, local links/assets, anchors, headings, and scoped page-level scripts.`);
}
if (process.argv[1] === new URL(import.meta.url).pathname) await verifyBuild();
