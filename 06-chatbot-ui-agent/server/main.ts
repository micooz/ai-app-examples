import express, { type Request, type Response } from 'express';
import {
  AIMessageChunk,
  HumanMessage,
  ToolMessage,
} from '@langchain/core/messages';

// 和前端共享的类型
import type { ChatMessage } from '../src/types/index.ts';

import { context } from './context.ts';
import * as agent from './agent.ts';
import { isToolCall } from './utils.ts';

const app = express();

// 添加 JSON 请求体解析中间件
app.use(express.json());

/**
 * 历史消息查询接口
 */
app.get('/history', (req, res) => {
  const messages: ChatMessage[] = [];

  // 将 LangChain 消息类型转换为前端展示用的 ChatMessage 类型
  for (const message of context) {
    if (message instanceof HumanMessage) {
      messages.push({
        type: 'user',
        payload: { content: message.content.toString() },
      });
    }

    if (message instanceof AIMessageChunk) {
      if (isToolCall(message)) {
        for (const item of message.tool_calls) {
          messages.push({
            type: 'tool_call',
            payload: {
              id: item.id!,
              name: item.name,
              args: item.args,
            },
          });
        }
      } else {
        messages.push({
          type: 'assistant',
          payload: { content: message.content.toString() },
        });
      }
    }

    if (message instanceof ToolMessage) {
      messages.push({
        type: 'tool_result',
        payload: {
          tool_call_id: message.tool_call_id!,
          name: message.name!,
          content: message.content.toString(),
        },
      });
    }
  }

  res.json(messages);
});

/**
 * 当前上下文查询接口（方便调试）
 */
app.get('/context', (req, res) => {
  res.json(context);
});

/**
 * SSE 通信接口（EventSource GET 版本）
 */
app.get('/sse', sseHandler);

/**
 * SSE 通信接口（fetch POST 版本）
 */
app.post('/sse', sseHandler);

async function sseHandler(req: Request, res: Response) {
  let query = '';

  if (req.method === 'GET') {
    query = req.query.query as unknown as string;
  }

  if (req.method === 'POST') {
    query = req.body.query;
  }

  const abortController = new AbortController();

  // 执行 workflow
  const stream = agent.stream({
    signal: abortController.signal,
    query,
  });

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 提前发送响应头
  res.flushHeaders();

  // 如果客户端断开连接，则取消模型请求。
  req.on('end', () => {
    // 这会让下面的 for await 循环抛出 Error: Aborted 异常。
    abortController.abort();
  });

  // 接收流式响应
  try {
    for await (const message of stream) {
      // 发送给前端
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
  } catch (err: any) {
    // 可以在这里处理前端的主动中断动作
    console.error(err);
  }

  // 最后发送一个 close 事件，触发前端 EventSource 的自定义 close 事件，
  // 该事件必须通过 EventSource.addEventListener('close') 添加。
  // 这里必须带一个 data: 否则前端的自定义 close 事件不会触发，原因是：
  // 前端的自定义事件会在 message 事件触发后再触发。
  res.end('event: close\ndata:\n\n');
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
