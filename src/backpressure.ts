export class Backpressure {
  private inflightCalls = 0;
  /**
   * Returns function whose execution is delayed if there is too many inflight calls
   */
  public wrap<T extends CallableFunction>(fn: T): T {
    const backpressuredFunction = (...args: any[]) => {
      this.inflightCalls++;
      const returnValue = fn(...args);
      this.inflightCalls--;

      return returnValue;
    };
    return backpressuredFunction as any;
  }
}
