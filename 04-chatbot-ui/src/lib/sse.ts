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

  const eventSource = new EventSource(`${path}?${search}`);

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
    const { promise, resolve: _resolve } = Promise.withResolvers<T | null>();
    resolve = _resolve;
    yield await promise;
  }
}
