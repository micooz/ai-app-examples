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
      type: 'tool_call';
      partial?: false;
      payload: {
        id: string;
        name: string;
        args: Record<string, any>;
      };
    }
  | {
      type: 'tool_result';
      partial?: false;
      payload: {
        tool_call_id: string;
        name: string;
        content: string;
      };
    };

export type WebsearchResult = {
  title: string;
  link: string;
  description?: string;
}[];
