import { BaseMessage } from '@langchain/core/messages';
import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';

import { llm } from './llm.ts';
import { tools } from './tools.ts';
import { isToolCall, last } from './utils.ts';

const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

type State = typeof GraphState.State;

export function createGraph() {
  const graph = new StateGraph(GraphState);

  graph
    // nodes
    .addNode('start', start)
    // Good to known：ToolNode 内部会取出 messages 中的工具调用消息，执行工具调用后，再将结果追加到 messages 字段上。
    .addNode('tools', new ToolNode(tools))
    // edges
    .addEdge(START, 'start')
    .addConditionalEdges('start', beforeToolCall)
    .addConditionalEdges('tools', afterToolCall);

  return graph.compile();
}

async function start(state: State) {
  const { messages } = state;

  // 给模型绑定可用工具
  const llmWithTools = llm.bindTools(tools);

  // TODO: 简单起见这里用的是同步调用（invoke），应该改造为流式调用（stream）。
  const response = await llmWithTools.invoke(messages, {
    tool_choice: 'auto',
  });

  return {
    messages: [response],
  };
}

/**
 * 工具调用前处理节点
 * 1. 判断是不是工具调用
 * 2. 将工具调用消息路由到 tools 节点，否则直接结束。
 */
function beforeToolCall(state: State) {
  const lastMessage = last(state.messages);

  if (isToolCall(lastMessage)) {
    return 'tools';
  }

  return END;
}

/**
 * 工具调用后处理节点。
 * tips：这个节点不是必须的，可以在这里按需处理工具调用结果。
 */
function afterToolCall(state: State) {
  return 'start';
}
