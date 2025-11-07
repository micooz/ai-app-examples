import { ChatOpenAI } from '@langchain/openai';

// 取得调用模型 API 的必要参数
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const MODEL = 'qwen-turbo';

if (!API_KEY) {
  throw new Error('请在 .env 中设置 API_KEY');
}

// 创建 LangChain 模型实例
export const llm = new ChatOpenAI({
  model: MODEL,
  configuration: {
    baseURL: BASE_URL,
    apiKey: API_KEY,
  },
  streaming: true,
});
