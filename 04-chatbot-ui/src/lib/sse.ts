export type SSEOptions = {
  params: Record<string, string>;
  signal: AbortSignal;
};

export async function sse<T>(path: string, options: SSEOptions) {
  const { params, signal } = options;

  const search = new URLSearchParams(params);
  const url = `${path}?${search}`;

  return new Promise<AsyncGenerator<T | null>>((resolve, reject) => {
    let resolvers: PromiseWithResolvers<T | null>;

    const generator = async function* () {
      while (true) {
        resolvers = Promise.withResolvers<T | null>();
        yield await resolvers.promise;
      }
    };

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      resolve(generator());
    };

    eventSource.onerror = () => {
      reject(new Error('EventSource connection error'));
      // 防止浏览器自动重连
      eventSource.close();
    };

    eventSource.onmessage = (event) => {
      if (!event.data) {
        return;
      }
      try {
        resolvers?.resolve(JSON.parse(event.data));
      } catch (err) {
        resolvers?.reject(err);
      }
    };

    // 自定义 close 事件
    eventSource.addEventListener('close', () => {
      resolvers?.resolve(null);
    });

    signal.addEventListener('abort', () => {
      eventSource.close();
      resolvers?.reject(new Error('Aborted'));
    });
  });
}
