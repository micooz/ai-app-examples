import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 联网搜索函数，这里使用 Bing 搜索引擎的 rss 响应接口，进行简单的正则提取。
 */
async function websearch(args: { keywords: string }) {
  const { keywords } = args;

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

/**
 * 用 langchain 的 tool 封装一下才能配合模型使用
 */
const websearchTool = tool(
  // tips: 这里将工具调用结果转换为字符串，目的是避免多轮对话时发送给模型的 ToolMessage 的 content 不是字符串而报错。
  (args) => websearch(args).then((res) => JSON.stringify(res)),
  {
    description: '搜索互联网',
    name: 'websearch',
    schema: z.object({
      keywords: z.string().describe('关键词，用空格分隔。'),
    }),
  },
);

export const tools = [websearchTool];
