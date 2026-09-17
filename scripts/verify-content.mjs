import { cp, mkdtemp, mkdir, symlink, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { verifyBuild } from './verify-build.mjs';

// Build an isolated copy. Fixtures never enter the production content directory.
const root = await mkdtemp(join(tmpdir(), 'personal-website-test-'));
try {
  for (const path of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
    await cp(path, join(root, path), { recursive: true });
  }
  await symlink(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  await mkdir(join(root, 'src/content/blog'), { recursive: true });
  for (const name of ['markdown.md', 'mdx.mdx', 'draft.md']) {
    await cp(`tests/fixtures/${name}`, join(root, 'src/content/blog', name));
  }
  execFileSync(process.execPath, [resolve('node_modules/astro/bin/astro.mjs'), 'build'], { cwd: root, stdio: 'inherit' });
  await verifyBuild(join(root, 'dist'));
  const md = await readFile(join(root, 'dist/blog/markdown/index.html'), 'utf8');
  const mdx = await readFile(join(root, 'dist/blog/mdx/index.html'), 'utf8');
  const blog = await readFile(join(root, 'dist/blog/index.html'), 'utf8');
  const home = await readFile(join(root, 'dist/index.html'), 'utf8');
  for (const marker of ['On this page', 'heading-anchor', 'astro-code', '<table>', '<blockquote>', 'reading-and-navigation-1', 'TypeScript']) assert(md.includes(marker), `Missing Markdown feature: ${marker}`);
  assert(mdx.includes('callout-title') && mdx.includes('<strong>4</strong>'), 'MDX component/expression failed');
  assert(blog.includes('Notes') && blog.includes('Essays'), 'Collections missing');
  assert(blog.indexOf('MDX rendering fixture') < blog.indexOf('Markdown rendering fixture'), 'Posts are not newest-first');
  assert(!blog.includes('Unpublished fixture') && !home.includes('Unpublished fixture'), 'Draft leaked into a listing');
  await assert.rejects(readFile(join(root, 'dist/blog/draft/index.html')), { code: 'ENOENT' });

  // Topic counts: this build mixes the fixtures with real published
  // content, so exact totals aren't fixed — assert what the fixtures
  // themselves guarantee instead. markdown.md carries [Programming,
  // TypeScript] and mdx.mdx carries [AI], each published once, so every
  // fixture tag must appear with a count of at least 1.
  const topicsNav = blog.match(/<nav class="topics".*?<\/nav>/s)?.[0] ?? '';
  const entries = [...topicsNav.matchAll(/data-topic="([^"]*)"[^<]*(?:<span class="topic-label">([^<]+)<\/span><span class="topic-count">(\d+)<\/span>)?/g)]
    .filter((match) => match[1] !== '') // drop the "All topics" control itself
    .map(([, slug, tag, count]) => ({ slug, tag, count: Number(count) }));
  for (const [tag, slug] of [['AI', 'ai'], ['Programming', 'programming'], ['TypeScript', 'typescript']]) {
    const entry = entries.find((item) => item.slug === slug);
    assert(entry && entry.tag === tag && entry.count >= 1, `Topics is missing the published "${tag}" control (slug "${slug}")`);
  }
  // General sort invariant — count descending, alphabetical on ties — so
  // this still holds no matter what real content contributes.
  for (let i = 1; i < entries.length; i++) {
    const [prev, cur] = [entries[i - 1], entries[i]];
    assert(
      prev.count > cur.count || (prev.count === cur.count && prev.tag.localeCompare(cur.tag) <= 0),
      `Topics are not sorted by count desc / alphabetical: "${prev.tag}" (${prev.count}) before "${cur.tag}" (${cur.count})`,
    );
  }
  // draft.md carries [Draft Topic] and must not leak into the build-time
  // tag index, not just the visible post list.
  assert(!blog.includes('Draft Topic') && !blog.includes('data-topic="draft-topic"'), 'A draft article\'s tag leaked into the Topics index');

  console.log('Markdown, MDX, TOC, duplicate heading anchors, highlighting, tables, callouts, sorting, draft exclusion, and topic counts passed.');
  if (process.argv.includes('--keep')) console.log(`Fixture preview directory: ${root}`);
} finally {
  if (!process.argv.includes('--keep')) await rm(root, { recursive: true, force: true });
}
