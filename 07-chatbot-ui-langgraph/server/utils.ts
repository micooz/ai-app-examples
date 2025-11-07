import { BaseMessage, type AIMessageChunk } from '@langchain/core/messages';
import type { ToolCall } from '@langchain/core/messages/tool';

/**
 * 判断模型返回消息是否为工具调用
 */
export function isToolCall(
  message?: BaseMessage,
): message is AIMessageChunk & { tool_calls: ToolCall[] } {
  return Boolean(
    message &&
      'tool_calls' in message &&
      Array.isArray(message.tool_calls) &&
      message.tool_calls.length,
  );
}

export function last<T>(arr?: T[]) {
  return arr?.[arr.length - 1];
}
