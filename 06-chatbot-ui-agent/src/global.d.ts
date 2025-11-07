// 浏览器中的 ReadableStream 基本已经支持 [Symbol.asyncIterator]，这里给出定义避免 IDE 标红。
// https://developer.mozilla.org/zh-CN/docs/Web/API/ReadableStream#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7
declare global {
  interface ReadableStream<R = any> {
    [Symbol.asyncIterator](): AsyncIterableIterator<R>;
  }
}

export {};
