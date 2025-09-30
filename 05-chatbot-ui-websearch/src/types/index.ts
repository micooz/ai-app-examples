export type ChatMessage =
  | {
      type: 'system';
      partial?: false;
      payload: { content: string };
    }
  | {
      type: 'user';
      partial?: false;
      payload: { content: string };
    }
  | {
      type: 'assistant';
      partial?: boolean;
      payload: {
        subtype: 'websearch-keywords' | 'websearch-results' | 'reply';
        content: string;
      };
    };

export type WebsearchResult = {
  title: string;
  link: string;
  description?: string;
}[];
