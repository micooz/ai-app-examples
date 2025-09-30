import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';

// 和前端共享的类型
import type { ChatMessage } from '../src/types';

/**
 * 全量消息列表
 */
export const messages: ChatMessage[] = [
  {
    type: 'system',
    payload: {
      content: '你是一位乐于助人的 AI 助手，可以帮助用户解决各种问题。',
    },
  },
];

/**
 * 加载模型需要的上下文
 */
export function loadContext() {
  const context: BaseMessage[] = [];

  for (const message of messages) {
    if (message.type === 'system') {
      context.push(new SystemMessage(message.payload.content));
    }

    if (message.type === 'user') {
      context.push(new HumanMessage(message.payload.content));
    }

    if (message.type === 'assistant') {
      if (message.payload.subtype === 'websearch-keywords') {
        context.push(new AIMessage(`正在搜索：${message.payload.content}`));
      }

      if (message.payload.subtype === 'websearch-results') {
        context.push(new AIMessage(`搜索结果：${message.payload.content}`));
      }

      if (message.payload.subtype === 'reply') {
        context.push(new AIMessage(message.payload.content));
      }
    }
  }

  return context;
}
