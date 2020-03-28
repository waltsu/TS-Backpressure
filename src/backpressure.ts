import { getLeash, Leash } from './util';

type BackpressuredFunction<T> = (...args: any[]) => Promise<T>;

export class Backpressure {
  private inflightCalls = 0;
  private leashes: Leash[] = [];

  constructor(private maxCalls: number = 2) {}
  /**
   * Returns Promise whose execution is delayed if there is too many inflight calls
   */
  public wrap<T>(fn: BackpressuredFunction<T>): BackpressuredFunction<T> {
    const backpressuredFunction = async (...args: any[]): Promise<T> => {
      if (this.isInvocationAllowed()) {
        this.inflightCalls++;
        const returnValue = await fn(...args);
        this.inflightCalls--;

        const waitingLeash = this.leashes.shift();
        if (waitingLeash) {
          waitingLeash.release();
        }

        return returnValue;
      } else {
        const leash = getLeash();
        this.leashes.push(leash);
        await leash.promise;

        return backpressuredFunction(...args);
      }
    };

    return backpressuredFunction as any;
  }

  private isInvocationAllowed(): boolean {
    return this.inflightCalls < this.maxCalls;
  }
}
