import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('news', ({ data }) => !data.draft)).sort(
    (a, b) => +b.data.date - +a.data.date
  );
  return rss({
    title: 'St Barnabas Church, Ealing — News',
    description: 'News, notices and reflections from St Barnabas Church, Ealing.',
    site: context.site ?? 'https://www.barnabites.org',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: `/news/${post.id}/`,
      categories: post.data.category ? [post.data.category] : [],
    })),
  });
}
