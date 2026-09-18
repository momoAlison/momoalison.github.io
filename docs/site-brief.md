# Personal Website — Site Brief v1

> Historical planning document. For the current site architecture, design system, and maintenance rules, see `src/pages/site-guide.mdx`.

## 1. Purpose

Build a personal website that combines:

- a lightweight personal portfolio,
- a technical blog / knowledge space,
- a future interactive resume,
- and a distinctive but restrained illustrated homepage.

The overall principle is:

> Calm, content-first reading experience + small moments of personality and interaction.

## 2. Language

English only for v1.

## 3. Pages in v1

### Home

Purpose:
- establish the visual identity,
- introduce the site's focus,
- provide clear entry points to Blog and About,
- preview recent writing.

Visual direction:
- warm off-white / light cream background,
- minimal editorial layout,
- Notion-inspired restraint,
- black and near-black text,
- soft grey borders,
- one blue-green accent color,
- generous whitespace.

Hero:
- text on the left,
- personal illustration on the right,
- illustration is static in v1,
- no requirement to display the owner's full name prominently,
- navigation contains Home, Blog, About.

The hero should feel more expressive than the blog while still belonging to the same visual system.

Future enhancement:
- eye tracking,
- subtle head movement,
- hair movement,
- blinking,
- small hover reactions.

These interactions are explicitly out of scope for v1.

### Blog

Purpose:
- support both simple notes and richer technical writing,
- remain fast and comfortable for long-form reading.

Required features:
- Markdown and MDX content,
- published date,
- collection/category,
- tags,
- automatic table of contents,
- heading anchor links,
- code highlighting,
- tables,
- callouts,
- responsive layout,
- readable typography,
- support for custom MDX components.

Desktop article layout:
- centered readable article column,
- optional sticky TOC on the right,
- comfortable line length,
- clear heading hierarchy.

Mobile:
- no fixed sidebar,
- TOC should collapse or move into the article header area.

### About

Purpose:
- concise personal introduction,
- professional background overview,
- interests / focus,
- useful external links.

The page should remain editorial and lightweight rather than becoming a full resume.

## 4. Content Model

Use two distinct classification dimensions.

### Collection

A collection describes what kind of writing the post is.

Initial collections:

- `notes`
  - course notes
  - structured learning notes
  - reference-style material

- `essays`
  - personal technical analysis
  - comparisons
  - explanations
  - reflections and synthesized thinking

A post belongs to one primary collection.

### Tags

Tags describe what the post is about.

Examples:

- Python
- TypeScript
- Programming
- Computer Science
- AI
- Backend

Collections and tags should not be conflated.

### Suggested frontmatter

```yaml
---
title: "Python vs TypeScript"
description: "..."
published: 2026-09-16
collection: essays
tags:
  - Python
  - TypeScript
  - Programming
draft: false
---
```

Possible future extension:
- `series`

Do not add `series` until real content requires it.

### Suggested content structure

```text
src/content/blog/
├── notes/
│   └── ...
└── essays/
    └── ...
```

## 5. Existing Content

The current site has approximately two posts.

### Post type 1

Course / online learning notes.

Preferred format:
- Markdown unless richer interaction becomes necessary.

### Post type 2

Python vs TypeScript comparison.

Preferred format:
- MDX.

This article should eventually support richer comparison presentation such as:
- side-by-side code examples,
- structured comparison tables,
- section navigation,
- reusable comparison components.

## 6. Visual System

### Overall direction

Keywords:
- Notion-inspired
- editorial
- calm
- warm
- minimal
- human
- slightly playful
- developer-oriented

Avoid:
- heavy gradients,
- glassmorphism,
- excessive shadows,
- noisy backgrounds,
- generic SaaS landing-page aesthetics,
- dense dashboard layouts,
- excessive animation.

### Palette

Primary background:
- warm off-white / cream

Text:
- near black

Secondary text:
- warm grey

Borders:
- subtle light grey

Accent:
- muted blue-green inspired by the character's scrunchie

The accent color should be used sparingly for:
- active links,
- hover states,
- selected TOC item,
- small highlights,
- interactive details.

### Theme

Light mode only in v1.

Dark mode is explicitly out of scope.

### Typography

Prioritize:
- long-form readability,
- clean hierarchy,
- restrained editorial character.

Use as few font families as possible.

Avoid large font payloads.

## 7. Homepage Illustration

The character illustration is a simple hand-drawn black-and-white editorial figure.

Character identity cues:
- center-parted black hair,
- low ponytail,
- blue-green scrunchie,
- simplified face,
- developer-at-laptop composition.

The blue-green scrunchie is the primary visual accent.

For v1:
- use a static SVG asset,
- do not introduce Rive,
- do not introduce animation libraries only for the character,
- preserve room for future SVG animation.

Future interaction ideas:
- eyes follow pointer,
- subtle head movement,
- blinking,
- ponytail / loose hair secondary motion,
- hover reactions for Blog / About / Resume.

## 8. Resume Direction — Future Phase

Resume is not part of v1 navigation.

Future `/resume` page should:
- be a designed web resume,
- offer a PDF download,
- use restrained scroll / reveal animation,
- remain consistent with the rest of the site,
- avoid becoming a presentation-heavy microsite.

## 9. Technical Direction

Use:
- Astro
- TypeScript
- Astro Content Collections
- Markdown
- MDX
- static site generation
- GitHub Pages

Prefer Astro components for static UI.

Do not introduce React unless a concrete interactive component benefits from it.

Do not turn the site into an SPA.

## 10. Performance Principles

The site should remain comparable in spirit to a lightweight static blog such as Hexo.

Rules:
- Static generation by default.
- Astro components by default.
- No site-wide hydration.
- No client-side framework runtime for static content.
- Avoid `client:load` unless interaction genuinely requires it.
- Blog posts should require near-zero client JavaScript.
- Prefer small vanilla TypeScript for simple interactions.
- Prefer SVG for simple illustrations.
- Optimize raster images at build time.
- Avoid unnecessary third-party scripts.
- Avoid large animation libraries unless justified.
- Avoid shipping libraries globally for one component.
- Keep fonts and icon assets minimal.

Performance is a product requirement, not a later optimization task.

## 11. Accessibility

Required:
- semantic HTML,
- keyboard-accessible navigation,
- visible focus states,
- sufficient contrast,
- meaningful alt text,
- respect `prefers-reduced-motion`,
- heading hierarchy,
- accessible anchor links.

Interactive enhancements must never be required to navigate the site.

## 12. Responsive Design

Support:
- desktop,
- tablet,
- mobile.

The homepage illustration can reposition or simplify on narrow screens.

Blog readability takes priority over preserving desktop composition.

## 13. Out of Scope for v1

Do not implement yet:
- dark mode,
- CMS,
- database,
- authentication,
- comments,
- search unless clearly justified later,
- Rive,
- Live2D,
- Three.js,
- complex SVG animation,
- animated resume,
- multilingual routing,
- project showcase section,
- unnecessary UI libraries.

## 14. Core Design Rule

When choosing between:
1. a more impressive implementation, and
2. a simpler implementation that is faster, clearer, and easier to maintain,

prefer the simpler implementation unless the richer version creates visible user value.

The site should feel intentionally designed, not technically overbuilt.
