/** Minimal async-iterable queue for bridging callback-style event streams into an async generator. */
export class PushQueue<T> {
  private values: T[] = [];
  private resolvers: ((result: IteratorResult<T>) => void)[] = [];
  private closed = false;
  private failure: unknown;

  push(value: T): void {
    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver({ value, done: false });
    } else {
      this.values.push(value);
    }
  }

  finish(): void {
    this.closed = true;
    while (this.resolvers.length) {
      this.resolvers.shift()!({ value: undefined as unknown as T, done: true });
    }
  }

  fail(error: unknown): void {
    this.failure = error;
    this.finish();
  }

  next(): Promise<IteratorResult<T>> {
    if (this.values.length) {
      return Promise.resolve({ value: this.values.shift()!, done: false });
    }
    if (this.closed) {
      if (this.failure) return Promise.reject(this.failure);
      return Promise.resolve({ value: undefined as unknown as T, done: true });
    }
    return new Promise((resolve) => this.resolvers.push(resolve));
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return { next: () => this.next() };
  }
}
