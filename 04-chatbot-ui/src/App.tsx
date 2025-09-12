import { ArrowRightIcon, Loader2Icon, SquareIcon } from 'lucide-react';
import { useKeyPress, useMount, useReactive } from 'ahooks';
import { useRef } from 'react';

import { cn } from './lib/utils';
import { MessageItem } from './components/MessageItem';

import { sse } from './lib/sse';
import type { ChatMessage } from './types';

export default function App() {
  const state = useReactive({
    messages: [] as ChatMessage[],
    input: '',
    isConnecting: false,
    isReplying: false,
    error: '',
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 监听输入框的回车事件
  useKeyPress('Enter', handleSend, { target: inputRef });

  /**
   * 加载历史消息
   */
  useMount(async () => {
    const response = await fetch('/api/history');
    const messages = await response.json().catch(() => []);
    state.messages = messages;

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
    });
  });

  /**
   * 发送消息
   */
  async function handleSend() {
    if (state.isConnecting) {
      return;
    }

    // 如果正在回复，再次点击按钮则中断流。
    if (state.isReplying) {
      abortControllerRef.current?.abort();
      return;
    }

    if (state.input.trim() === '') {
      inputRef.current?.focus();
      return;
    }

    try {
      state.isConnecting = true;
      state.error = '';

      abortControllerRef.current = new AbortController();

      // 创建 SSE 连接
      const stream = await sse<ChatMessage>('/api/sse', {
        signal: abortControllerRef.current.signal,
        params: {
          query: state.input.trim(),
        },
      });

      state.messages.push({
        type: 'user',
        payload: { content: state.input },
      });

      state.input = '';
      state.isConnecting = false;
      state.isReplying = true;

      // 接收 SSE 消息
      for await (const message of stream) {
        if (!message) {
          break;
        }

        const lastMessage = state.messages[state.messages.length - 1];

        // 处理不完全消息
        if (message.partial && lastMessage?.partial) {
          lastMessage.payload.content += message.payload.content;
          continue;
        }

        // 其他类型的消息
        state.messages.push(message);
      }

      state.isReplying = false;
    } catch (err: any) {
      state.error = err.message;
    } finally {
      state.isReplying = false;
      state.isConnecting = false;
    }
  }

  const isInitial = state.messages.length === 0;

  return (
    <main
      className={cn(
        'pb-28',
        isInitial && 'flex h-screen flex-col justify-center',
      )}
    >
      {/* 标题 */}
      <section className="sticky left-0 top-0">
        <h1
          className={cn(
            'md:w-3xl bg-background relative mx-auto p-4 text-3xl font-medium',
          )}
        >
          {isInitial ? '有什么可以帮忙的？' : 'Chatbot UI'}
        </h1>
      </section>

      {/* 聊天消息 */}
      <section
        className={cn(
          'md:w-3xl mx-auto flex w-full flex-col justify-between px-4 pb-6 leading-relaxed',
        )}
      >
        <div className="flex flex-1 flex-col gap-4">
          {state.messages.map((message, index) => (
            <MessageItem key={index} message={message} />
          ))}
        </div>

        {/* 错误提示 */}
        {state.error && (
          <div className="mt-4 rounded bg-red-50 p-4 py-3 text-sm text-red-500">
            {state.error}
          </div>
        )}
      </section>

      {/* 底部输入框 */}
      <section
        className={cn(
          'bg-background md:w-3xl w-full p-4 pt-0',
          isInitial
            ? 'relative left-0 mx-auto -translate-x-0'
            : 'fixed bottom-0 left-1/2 -translate-x-1/2',
        )}
      >
        <div
          className={cn(
            'relative flex flex-col gap-2 rounded-xl border-2 pb-10',
            'bg-background focus-within:border-primary',
          )}
        >
          <input
            ref={inputRef}
            className="h-11 resize-none px-4 outline-none"
            autoFocus
            value={state.input}
            onChange={(e) => (state.input = e.target.value)}
            placeholder="尽管问..."
          />
          <div
            className={cn(
              'absolute bottom-2 right-2 flex cursor-pointer justify-end rounded-full bg-black p-1.5 text-white',
              state.isConnecting && 'pointer-events-none bg-neutral-500',
            )}
            onClick={handleSend}
          >
            {/* 正在连接图标 */}
            {state.isConnecting && (
              <Loader2Icon size={16} className="animate-spin" />
            )}
            {/* 中断图标 */}
            {state.isReplying && <SquareIcon size={16} />}
            {/* 发送图标 */}
            {!state.isConnecting && !state.isReplying && (
              <ArrowRightIcon size={16} className="-rotate-90" />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
