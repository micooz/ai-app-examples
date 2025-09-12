export type SSEOptions = {
  params: Record<string, string>;
  signal: AbortSignal;
};

export async function* sse<T>(
  path: string,
  options: SSEOptions,
): AsyncGenerator<T | null> {
  const { params, signal } = options;

  const search = new URLSearchParams(params).toString();

  let resolve: ((value: T | null) => void) | undefined;
  let reject: ((reason?: any) => void) | undefined;

  const eventSource = new EventSource(`${path}?${search}`);

  // TODO: 区分连接错误和正常结束
  eventSource.onerror = () => {
    eventSource.close();
    resolve?.(null);
  };

  eventSource.onmessage = (event) => {
    resolve?.(JSON.parse(event.data));
  };

  signal.addEventListener('abort', () => {
    eventSource.close();
    resolve?.(null);
  });

  while (true) {
    const p = Promise.withResolvers<T | null>();
    resolve = p.resolve;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reject = p.reject;

    yield await p.promise;
  }
}
