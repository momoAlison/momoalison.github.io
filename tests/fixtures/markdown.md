---
title: Markdown rendering fixture
description: A private fixture for verifying the article layout.
published: 2026-01-15
collection: notes
tags: [Programming, TypeScript]
draft: false
---
This is test content, not a public article. It checks **emphasis**, *italics*, and `inline code`.

## Reading and navigation

A paragraph with an [external link](https://example.com) and enough text to inspect the reading rhythm. Technical writing should stay comfortable on a small screen as well as a large one.

### A nested heading

- First item
- Second item with **emphasis**

1. Understand the input.
2. Check the result.

> A blockquote should have a clear visual identity without interrupting the flow.

## Code and tables

```typescript
const greeting: string = 'Hello, reader';
console.log(greeting);
const intentionallyLongLine = 'This long code line verifies that code scrolls within its own container instead of widening the mobile page.';
```

| Concept | Example | Purpose |
| --- | --- | --- |
| Collection | notes | Kind of writing |
| Tags | TypeScript, Programming | Topics |

## Images

![The existing developer illustration](/personal-website/images/character.svg)

## Reading and navigation

Duplicate headings must receive distinct IDs and working TOC links.
