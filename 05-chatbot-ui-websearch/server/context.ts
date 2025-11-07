import { BaseMessage, SystemMessage } from '@langchain/core/messages';

/**
 * 全量上下文
 */
export const context: BaseMessage[] = [
  new SystemMessage('你是一位乐于助人的 AI 助手，可以帮助用户解决各种问题。'),
];
