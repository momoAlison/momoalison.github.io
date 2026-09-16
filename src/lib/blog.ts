import { getCollection } from 'astro:content';
export const collectionLabels = { notes: 'Notes', essays: 'Essays' } as const;
export async function getPublishedPosts() {
  return (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf() || a.id.localeCompare(b.id));
}
export const formatDate = (date: Date) => new Intl.DateTimeFormat('en', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(date);
