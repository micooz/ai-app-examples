import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

export interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem(props: MessageItemProps) {
  const { message } = props;

  const isUserMessage = message.type === 'user';

  return (
    <div className={cn('flex', isUserMessage && 'justify-end')}>
      <p
        className={cn(
          isUserMessage && 'rounded-full bg-neutral-100 px-4 py-1.5',
        )}
      >
        {message.payload.content}
      </p>
    </div>
  );
}
