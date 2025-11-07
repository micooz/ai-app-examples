import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GlobeIcon, SearchIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ChatMessage, WebsearchResult } from '@/types';

import 'github-markdown-css/github-markdown.css';

export interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem(props: MessageItemProps) {
  const { message } = props;

  const isUserMessage = message.type === 'user';

  return (
    <div className={cn('flex', isUserMessage && 'justify-end')}>
      {isUserMessage && <UserMessage {...message.payload} />}

      {message.type === 'assistant' && (
        <AssistantMessage {...message.payload} />
      )}

      {message.type === 'tool_call' && message.payload.name === 'websearch' && (
        <ToolCallMessage {...message.payload} />
      )}

      {message.type === 'tool_result' && (
        <ToolResultMessage {...message.payload} />
      )}
    </div>
  );
}

function UserMessage(props: { content: string }) {
  const { content } = props;

  return <p className="rounded-full bg-neutral-100 px-4 py-1.5">{content}</p>;
}

function AssistantMessage(props: { content: string }) {
  const { content } = props;

  return (
    <div className="markdown-body">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}

function ToolCallMessage(props: {
  id: string;
  name: string;
  args: Record<string, any>;
}) {
  const { name, args } = props;

  if (name === 'websearch') {
    return <WebsearchKeywordsMessage keywords={args.keywords} />;
  }

  // TODO: 其他工具调用渲染

  return null;
}

function ToolResultMessage(props: {
  tool_call_id: string;
  name: string;
  content: string;
}) {
  const { name, content } = props;

  if (name === 'websearch') {
    return (
      <WebsearchResultsMessage
        searchResults={JSON.parse(content) as WebsearchResult}
      />
    );
  }

  // TODO: 其他工具调用结果渲染

  return null;
}

function WebsearchKeywordsMessage(props: { keywords: string }) {
  const { keywords } = props;

  return (
    <div className="flex items-center gap-2 truncate rounded-full bg-neutral-100 px-4 py-1.5">
      <SearchIcon className="shrink-0" size={18} />
      <span className="truncate">
        正在搜索：
        <span className="text-sm text-gray-500">{keywords}</span>
      </span>
    </div>
  );
}

function WebsearchResultsMessage(props: { searchResults: WebsearchResult }) {
  const { searchResults } = props;

  const [showAll, setShowAll] = useState(false);

  const displayedResults = showAll ? searchResults : searchResults.slice(0, 5);

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-neutral-100 py-3">
      {/* 结果标题 */}
      <p className="flex items-center gap-2 px-4 font-medium">
        <GlobeIcon size={18} />
        已搜索 {searchResults.length} 条结果
      </p>

      {/* 结果列表 */}
      <div className="flex flex-col">
        {displayedResults.map((result, index) => (
          <a
            key={index}
            className="mx-2 flex flex-col gap-1 rounded-md p-2 hover:bg-neutral-200"
            href={result.link}
            target="_blank"
          >
            <p className="font-medium">{result.title}</p>
            <p className="line-clamp-2 text-sm">{result.description}</p>
          </a>
        ))}
      </div>

      {/* 展开、收起 */}
      <div className="mt-1 flex justify-center">
        <span
          className="cursor-pointer text-sm text-gray-500"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? '收起' : '展开所有'}
        </span>
      </div>
    </div>
  );
}
