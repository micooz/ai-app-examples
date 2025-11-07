import { AIMessageChunk, HumanMessage } from '@langchain/core/messages';

import { context } from './context.ts';
import { llm } from './llm.ts';
import * as tools from './tools.ts';

// 和前端共享的类型
import type { ChatMessage } from '../src/types/index.ts';

export type StreamOptions = {
  signal: AbortSignal;
  query: string;
  websearch: boolean;
};

export async function* stream(
  options: StreamOptions,
): AsyncGenerator<ChatMessage> {
  const { signal, query, websearch = false } = options;

  // 添加用户消息到上下文
  context.push(new HumanMessage(query));

  // 如果启用 websearch，则先生成搜索关键词，再进行搜索。
  if (websearch) {
    // 1. 生成搜索关键词
    const keywords = await llm
      .invoke(
        [
          ...context,
          new HumanMessage(query),
          new HumanMessage(
            '根据当前问题和历史消息，设计一组简洁、精准的搜索关键词，用空格分隔。',
          ),
        ],
        { signal },
      )
      .then((res) => res.content.toString());

    const keywordsMessage: ChatMessage = {
      type: 'websearch-keywords',
      payload: {
        keywords,
      },
    };

    // 将搜索关键词添加到上下文
    context.push(new AIMessageChunk(`正在搜索：${keywords}`));

    // 通知前端展示搜索关键词
    yield keywordsMessage;

    // 2. 进行搜索
    const searchResults = await tools.websearch(keywords);

    const searchResultsMessage: ChatMessage = {
      type: 'websearch-results',
      payload: {
        searchResults,
      },
    };

    // 将搜索结果添加到上下文
    context.push(
      new AIMessageChunk(`搜索结果：${JSON.stringify(searchResults)}`),
    );

    // 通知前端展示搜索结果
    yield searchResultsMessage;
  }

  // 调用模型 API
  const stream = await llm.stream(context, { signal });

  let reply = '';

  // 接收模型流式响应
  for await (const chunk of stream) {
    const content = chunk.content.toString();

    yield {
      type: 'assistant',
      partial: true,
      payload: { content },
    };

    reply += content;
  }

  // 保存本次模型回复，即便中途断开导致不完整。
  context.push(new AIMessageChunk(reply));
}
