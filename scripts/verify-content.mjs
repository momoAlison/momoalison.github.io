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
  console.log('Markdown, MDX, TOC, duplicate heading anchors, highlighting, tables, callouts, sorting, and draft exclusion passed.');
  if (process.argv.includes('--keep')) console.log(`Fixture preview directory: ${root}`);
} finally {
  if (!process.argv.includes('--keep')) await rm(root, { recursive: true, force: true });
}
