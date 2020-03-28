type BackpressuredFunction<T> = (...args: any[]) => Promise<T>;

export class Backpressure {
  private inflightCalls = 0;
  /**
   * Returns Promise whose execution is delayed if there is too many inflight calls
   */
  public wrap<T>(fn: BackpressuredFunction<T>): BackpressuredFunction<T> {
    const backpressuredFunction = async (...args: any[]) => {
      this.inflightCalls++;

      try {
        console.log(this.inflightCalls);
        const returnValue = await fn(...args);
        return returnValue;
      } finally {
        this.inflightCalls--;
      }
    };
    return backpressuredFunction as any;
  }
}
