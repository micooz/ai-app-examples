import { HumanMessage } from '@langchain/core/messages';

import { loadContext, messages } from './context.ts';
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

  let context = loadContext();

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
      type: 'assistant',
      payload: {
        subtype: 'websearch-keywords',
        content: keywords,
      },
    };

    messages.push(keywordsMessage);

    // 通知前端展示搜索关键词
    yield keywordsMessage;

    // 2. 进行搜索
    const searchResults = await tools.websearch(keywords);

    const searchResultsMessage: ChatMessage = {
      type: 'assistant',
      payload: {
        subtype: 'websearch-results',
        content: JSON.stringify(searchResults),
      },
    };

    messages.push(searchResultsMessage);

    // 通知前端展示搜索结果
    yield searchResultsMessage;
  }

  // 上下文在经过 websearch 后会变化，重新加载一下。
  context = loadContext();

  // 调用模型 API
  const stream = await llm.stream(context, { signal });

  let reply = '';

  // 接收模型流式响应
  for await (const chunk of stream) {
    const content = chunk.content.toString();

    yield {
      type: 'assistant',
      partial: true,
      payload: { subtype: 'reply', content },
    };

    reply += content;
  }

  // 保存本次模型回复，即便中途断开导致不完整。
  messages.push({
    type: 'assistant',
    payload: { subtype: 'reply', content: reply },
  });
}
