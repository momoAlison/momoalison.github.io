import { getCollection, type CollectionEntry } from 'astro:content';
export const collectionLabels = { notes: 'Notes', essays: 'Essays' } as const;
export async function getPublishedPosts() {
  return (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf() || a.id.localeCompare(b.id));
}
export const formatDate = (date: Date) => new Intl.DateTimeFormat('en', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(date);

/** Canonical filter key for a tag; the frontmatter string stays the human-readable display label. */
export const slugifyTag = (tag: string) => tag.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export interface TopicCount { tag: string; slug: string; count: number; }

/**
 * Build-time tag index: one entry per canonical tag, counted once per
 * published article. This is the single source of truth for Topic
 * statistics — future tag archives/graphs should read from here rather
 * than maintaining a second hand-written count.
 */
export function getTopicCounts(posts: CollectionEntry<'blog'>[]): TopicCount[] {
  const bySlug = new Map<string, TopicCount>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = slugifyTag(tag);
      const existing = bySlug.get(slug);
      if (existing) existing.count += 1;
      else bySlug.set(slug, { tag, slug, count: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
