export type ChatMessage = {
  type: 'user' | 'assistant';
  partial?: boolean;
  payload: {
    content: string;
  };
};
