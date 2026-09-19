# Personal website

Alison's personal site — an Astro static site (Home, Blog, About).

**Read [`src/pages/site-guide.mdx`](src/pages/site-guide.mdx) (live at [/site-guide/](https://momoalison.github.io/site-guide/)) before making structural or visual changes.** It's the current source of truth for the design system, content authoring, page contracts, and the decisions that should not be casually changed.

## Local development

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/`.

## Working with an AI assistant on content edits

These conventions apply to any AI tool (or human contributor) editing published article content in this repo — they aren't specific to one assistant.

### Red/green draft review

When making substantial edits to an existing article — trimming, correcting factual errors, restructuring based on review feedback — mark the changes for review instead of rewriting prose in place silently. Default to this whenever the edit touches an already-published article's content, even if not explicitly asked. The only exception is a single small fix the user has already explicitly agreed to (e.g. they quoted exact replacement text) — that can be a direct edit, but say plainly that it was unmarked.

**Setup** (recreate if missing — these are deleted again during final cleanup, so they won't persist between review passes):
- `src/components/DraftHighlight.astro` — green box, `label` prop (default `"New"`), used for new or corrected content.
- `src/components/DraftRemoved.astro` — red box, strikethrough, fixed label `"Removing"`, used for original content being replaced or cut.
- Matching `.draft-highlight` / `.draft-removed` CSS in `src/styles/global.css` (dashed border + badge; keep it visually distinct from `.callout`).
- Import both components at the top of the `.mdx` file being edited.

**Usage:**
- Wrap the *original* text being changed in `<DraftRemoved>`, immediately followed by the *new* text in `<DraftHighlight>`, so both are visible side by side for review.
- For a pure addition (nothing being replaced), use `<DraftHighlight>` alone — no red counterpart needed.
- For a pure deletion with no replacement, use `<DraftRemoved>` alone.
- Add a short italicized reasoning note inside the `<DraftRemoved>` block explaining *why* — this is a review note for the human, not final copy, and gets deleted along with the block during cleanup.
- **Exception — do not wrap table cells or Markdown list items individually**: inserting a block-level `<div>` mid-table or mid-list breaks the structure. For those, make the edit directly (no markup) and explicitly say which specific edits were unmarked and why. Wrapping an *entire* self-contained table or list (not a partial row/item) in one block is fine.
- After every edit, run the full validation suite before reporting back: `npm run check`, `npm run build`, `npm test`, `npm run test:content`, `git diff --check`. All internal `#anchor` links must resolve — the anchor validator in `test`/`test:content` catches broken ones, including any new cross-reference links added as part of the edit.

**Final cleanup** (only once the user explicitly signs off on the review):
- Unwrap every `<DraftHighlight>` — remove the two tags, keep the inner content.
- Delete every `<DraftRemoved>` block entirely, including its content.
- Delete `DraftHighlight.astro` and `DraftRemoved.astro`.
- Remove their CSS rules and their imports from the `.mdx` file.
- Re-run the full validation suite above.

### Verifying technical claims

Before trusting or applying any factual/technical claim in an edit (a language semantics claim, a library behavior, a framework's assertion behavior, etc.) — whether it's your own or from an external review someone pastes in — verify it by actually running the relevant code (Python, Node, a real package install in a throwaway venv/dir) rather than reasoning from memory alone. This project's content has had several must-fix corrections that were only caught this way.
