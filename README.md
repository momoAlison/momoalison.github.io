# Personal website

A static Astro website for building, learning, and writing. Phase 1 includes Home, Blog, About, and a reusable Markdown/MDX article layout. The source briefs and original character SVG are preserved.

## Local development

Use Node.js 22.12+ (Node 22 LTS is used in CI).

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/`.

```sh
npm run check       # Astro + TypeScript
npm run test:content # Isolated Markdown/MDX fixture build; never publishes fixtures
npm run build       # Production output in dist/
npm test            # Validate generated routes, links, anchors, and zero client scripts
npm run preview     # Serve the production build
```

No separate linter or formatter is configured. `npm run test:content -- --keep` retains an isolated temporary site for visual article testing; its location is printed. Never deploy that fixture build.

Astro may report that the blog collection is empty until real posts are added; this is intentional. The current MDX fixture build also emits an upstream Vite warning about Astro’s `use astro:head-inject` directive. Rendered MDX, styles, and static output are verified despite that warning.

## Content and editing

- `src/data/site.ts`: editable introduction, hero, and About copy. Biography and external profile links await real content.
- `src/styles/global.css`: design tokens, responsive layout, and article typography.
- `src/content/blog/notes/` and `src/content/blog/essays/`: real Markdown or MDX posts. There are intentionally no public sample posts.
- `src/content.config.ts`: current Content Layer glob loader and validated schema. Collection is a writing type; tags are separate topics.

Frontmatter:

```yaml
---
title: Your real article title
description: Optional short summary
published: 2026-09-16
collection: notes
tags: [Programming, TypeScript]
draft: false
---
```

A file `notes/example.md` becomes `/blog/notes/example/`. Filenames determine URLs; keep them stable. `draft: true` excludes a post from every listing and from static routes, including development. Dates sort newest first and display in UTC. Future dates do not schedule publication; use `draft` until ready. Tags are nonempty, case-insensitively unique strings.

Use h2/h3 for article sections; h1 is provided by the layout. TOC appears with two or more h2/h3 headings. Heading links and syntax highlighting are generated at build time. Wide tables and code blocks scroll inside the reading column. Standard Markdown needs no components. MDX can optionally import `src/components/Callout.astro` using a relative path from the article file. Rich comparison components are deferred.

For Markdown images, prefer local relative images so Astro can process them. For public assets or internal links, use root-relative paths such as `/images/character.svg` and `/blog/`; in Astro/MDX use `withBase` from `src/lib/urls.ts` where practical. The supplied character SVG remains byte-for-byte unchanged as an external, dimensioned image, ready for later SVG interaction work.

## GitHub Pages

The existing remote is `momoAlison/momoalison.github.io`. This is a GitHub Pages user site served from `/`. `astro.config.mjs` sets:

- site: `https://momoalison.github.io`
- base: `/`
- static output and trailing slashes

The workflow in `.github/workflows/deploy.yml` checks types, tests isolated fixtures, builds production, validates it, and uploads only `dist/` before deploying. It runs on pushes to `main` or manual dispatch.

Before the first deployment, select **Settings → Pages → Build and deployment → Source → GitHub Actions** in the repository. The expected URL is `https://momoalison.github.io/`. This implementation does not push, trigger a workflow, or change repository settings. If the repository is renamed or a custom domain is added, update site/base and the build-validation base together.

## Scope

Astro 7 uses the explicitly configured Unified processor for build-time heading links and accessible scroll containers, following the [current Markdown processor API](https://docs.astro.build/en/guides/markdown-content/#setting-up-a-markdown-processor). Its dependencies run only during builds. Caches live in `.astro/cache` to keep temporary fixture builds isolated.

No frontend framework, hydration, remote fonts, or client JavaScript. No Resume, character animation, search, dark mode, CMS, authentication, comments, projects, or rich comparison widgets. Real posts and biography belong to the next content phase.
