import express, { Request, Response } from 'express';

// 和前端共享的类型
import type { ChatMessage } from '../src/types';

import { messages } from './context';
import * as workflow from './workflow';

const app = express();

// 添加 JSON 请求体解析中间件
app.use(express.json());

/**
 * 历史消息查询接口
 */
app.get('/history', (req, res) => {
  const historyMessages: ChatMessage[] = messages.filter((message) => {
    // 系统消息不能传给前端
    if (message.type === 'system') {
      return false;
    }
    return true;
  });

  res.json(historyMessages);
});

/**
 * 全量消息查询接口（方便调试）
 */
app.get('/messages', (req, res) => {
  res.json(messages);
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
  let websearch = false;

  if (req.method === 'GET') {
    query = req.query.query as unknown as string;
    websearch = req.query.websearch === 'true';
  }

  if (req.method === 'POST') {
    query = req.body.query;
    websearch = req.body.websearch;
  }

  messages.push({
    type: 'user',
    payload: { content: query },
  });

  const abortController = new AbortController();

  // 执行 workflow
  const stream = workflow.stream({
    signal: abortController.signal,
    query,
    websearch,
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
