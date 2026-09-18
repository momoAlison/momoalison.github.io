import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, collectionLabels } from '../lib/blog';
import { site } from '../data/site';
import { withBase } from '../lib/urls';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: posts.map(({ id, data }) => ({
      title: data.title,
      description: data.description,
      pubDate: data.published,
      link: withBase(`blog/${id}/`),
      categories: [collectionLabels[data.collection], ...data.tags],
    })),
    customData: '<language>en</language>',
  });
}
