# Personal Website — Roadmap

## Phase 1 — Foundation

Goal: get a complete, deployable v1 website running with the correct visual system.

### Deliverables

- Initialize Astro + TypeScript project.
- Configure static output for GitHub Pages.
- Create global layout.
- Create responsive header / navigation.
- Establish design tokens:
  - colors,
  - spacing,
  - typography,
  - borders,
  - radii.
- Implement Home.
- Implement Blog index.
- Implement Blog article layout.
- Implement About.
- Configure Astro Content Collections.
- Configure Markdown and MDX.
- Configure code highlighting.
- Add collection and tags metadata.
- Add date rendering.
- Add automatic article TOC.
- Add heading anchors.
- Add responsive behavior.
- Add accessibility basics.
- Add static homepage character SVG placeholder.
- Deploy successfully to GitHub Pages.

### Exit criteria

- `astro build` passes.
- The site works without JavaScript for core navigation and article reading.
- Home, Blog, article page, and About are usable on desktop and mobile.
- Blog posts render from the content collection.
- The deployed GitHub Pages version works correctly.

## Phase 2 — Content Migration

Goal: move the existing writing into the new system.

### Course / online-learning notes

- Migrate as Markdown where possible.
- Preserve headings and code blocks.
- Assign:
  - collection: `notes`
  - relevant tags.

### Python vs TypeScript article

- Migrate to MDX.
- Assign:
  - collection: `essays`
  - tags such as Python, TypeScript, Programming.
- Improve structure before adding visual complexity.

### Exit criteria

- Both existing posts are readable and correctly categorized.
- No migration depends on raw HTML copied from the old site.

## Phase 3 — Rich Blog Components

Goal: improve articles where Markdown alone is not expressive enough.

Potential reusable components:
- `CodeCompare`
- `ComparisonTable`
- `Callout`
- `ArticleTOC`
- optional `SectionLink`

For Python vs TypeScript:
- create a clear side-by-side comparison layout on desktop,
- stack gracefully on mobile,
- avoid horizontal overflow,
- maintain accessible source order.

Do not create components merely for decorative purposes.

## Phase 4 — Homepage Character Interaction

Goal: make the static illustration subtly interactive.

Start with the existing SVG.

Suggested sequence:
1. inspect and clean SVG groups,
2. eye tracking,
3. blink animation,
4. subtle head following,
5. loose hair / ponytail secondary motion,
6. hover reactions.

Prefer:
- SVG,
- CSS,
- small TypeScript.

Only introduce Rive if interaction complexity clearly exceeds what maintainable SVG code can handle.

Respect `prefers-reduced-motion`.

## Phase 5 — Resume

Goal: add a polished web resume.

Route:
- `/resume`

Features:
- structured experience,
- education,
- skills / focus,
- selected projects or work highlights where appropriate,
- downloadable PDF,
- subtle scroll/reveal animation.

Avoid:
- excessive timeline animation,
- parallax-heavy layouts,
- large animation dependencies.

## Phase 6 — Polish

Possible future work:
- refined page transitions,
- improved mobile navigation,
- reading progress,
- lightweight search,
- series support,
- additional MDX visual components,
- dark mode,
- more character states.

Only add features after real usage demonstrates a need.

# Implementation Order

Use this order unless there is a concrete reason not to:

```text
Site shell
→ design system
→ Home
→ Blog content model
→ Blog index
→ Article layout
→ About
→ GitHub Pages deployment
→ migrate existing content
→ rich MDX components
→ character interaction
→ Resume
→ optional polish
```

Do not start with animation.

Do not start with custom MDX widgets.

First establish a clean, fast, deployable website.
