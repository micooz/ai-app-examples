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
        content: string;
      };
    }
  | {
      type: 'websearch-keywords';
      partial?: false;
      payload: {
        keywords: string;
      };
    }
  | {
      type: 'websearch-results';
      partial?: false;
      payload: {
        searchResults: WebsearchResult;
      };
    };

export type WebsearchResult = {
  title: string;
  link: string;
  description?: string;
}[];
