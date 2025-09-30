/**
 * 联网搜索函数，这里使用 Bing 搜索引擎的 rss 响应接口，进行简单的正则提取。
 */
export async function websearch(keywords: string) {
  const res = await fetch(
    `https://www.bing.com/search?format=rss&q=${encodeURIComponent(keywords)}`,
  );

  const rss = await res.text();

  const matches = rss.match(/<item>(.*?)<\/item>/g);

  if (!matches) {
    return [];
  }

  const results = matches.map((match) => {
    const title = match.match(/<title>(.*?)<\/title>/)?.[1];
    const link = match.match(/<link>(.*?)<\/link>/)?.[1];
    const description = match.match(/<description>(.*?)<\/description>/)?.[1];

    if (!title || !link) {
      return null;
    }

    return { title, link, description };
  });

  return results.filter((result) => result !== null);
}
