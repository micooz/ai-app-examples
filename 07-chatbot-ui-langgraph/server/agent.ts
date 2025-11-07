import { HumanMessage, ToolMessage } from '@langchain/core/messages';

import { context } from './context.ts';
import { isToolCall } from './utils.ts';
import { createGraph } from './graph.ts';

// 和前端共享的类型
import type { ChatMessage } from '../src/types/index.ts';

export type StreamOptions = {
  signal: AbortSignal;
  query: string;
};

export async function* stream(
  options: StreamOptions,
): AsyncGenerator<ChatMessage> {
  const { signal, query } = options;

  // 添加用户消息到上下文
  context.push(new HumanMessage(query));

  // 创建新的 graph 实例
  const graph = createGraph();

  // 启动 graph，并传入历史上下文。
  const stream = await graph.stream({ messages: context }, { signal });

  // 观测 graph 的状态更新和自定义消息
  for await (const output of stream) {
    // tips：output 包含每个节点的返回值
    // output = {
    //   <node_name>: <return_value>,
    //   <node_name>: <return_value>,
    //   ...
    // }
    // 遍历节点
    for (const [node, value] of Object.entries(output)) {
      // 遍历节点返回的 messages 字段
      for (const message of value.messages || []) {
        // start 节点可能输出工具调用或者模型回复
        if (node === 'start') {
          // 添加模型回复到上下文
          context.push(message);

          if (isToolCall(message)) {
            // 通知前端展示工具调用
            for (const item of message.tool_calls) {
              yield {
                type: 'tool_call',
                payload: {
                  id: item.id!,
                  name: item.name,
                  args: item.args,
                },
              };
            }
          } else {
            // 通知前端展示模型回复
            yield {
              type: 'assistant',
              partial: false,
              payload: {
                content: message.content.toString(),
              },
            };
          }
        }

        // tools 节点输出工具调用结果
        if (node === 'tools' && message instanceof ToolMessage) {
          // 添加工具调用结果到上下文
          context.push(message);

          // 通知前端展示工具调用结果
          yield {
            type: 'tool_result',
            payload: {
              tool_call_id: message.tool_call_id!,
              content: message.content.toString(),
              name: message.name!,
            },
          };
        }
      }
    }
  }
}
