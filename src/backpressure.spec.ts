import { Backpressure } from './backpressure';

const SLEEP_TIME_MS = 100;
const SLEEP_TIME_WITH_ERROR_MARGINAL = SLEEP_TIME_MS - 10;

describe('backpressure', () => {
  it('only allows N concurrect calls of a function', async () => {
    const backpressure = new Backpressure(2);
    const sleeper = async () => {
      await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
      return Date.now();
    };
    const backpressuredSleeper = backpressure.wrap(sleeper);

    const calls = Array.from(Array(3)).map(backpressuredSleeper);

    const results = await Promise.all(calls);

    results.reduce((previousResult, result, index) => {
      if (index === 2) {
        expect(result - previousResult).toBeGreaterThanOrEqual(SLEEP_TIME_WITH_ERROR_MARGINAL);
      }
      return result;
    }, 0);
  });

  it('allows functions to fail', async () => {
    const backpressure = new Backpressure(1);
    const maybeThrow = async (shouldThrow: boolean) => {
      await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
      if (shouldThrow) throw new Error('boom');
      return 'success';
    };
    const backpressuredFunction = backpressure.wrap(maybeThrow);

    const shouldThrows = Array.from(Array(4)).map((_, i) => (i % 2 === 0 ? true : false));
    const calls = shouldThrows.map(shouldThrow => {
      return backpressuredFunction(shouldThrow).catch(() => 'failed');
    });

    const results = await Promise.all(calls);

    expect(results.filter(result => result === 'success').length).toEqual(2);
    expect(results.filter(result => result === 'failed').length).toEqual(2);
  });

  it('backpressures even when some of the functions fail', async () => {
    const backpressure = new Backpressure(1);
    const maybeThrow = async (shouldThrow: boolean) => {
      await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
      if (shouldThrow) throw new Error('boom');
      return Date.now();
    };
    const backpressuredFunction = backpressure.wrap(maybeThrow);

    const shouldThrows = Array.from(Array(4)).map((_, i) => (i % 2 === 0 ? true : false));
    const calls = shouldThrows.map(shouldThrow => {
      return backpressuredFunction(shouldThrow).catch(() => Date.now());
    });

    const results = await Promise.all(calls);
    results.reduce((previous, current) => {
      if (previous !== undefined) {
        expect(current - previous).toBeGreaterThanOrEqual(SLEEP_TIME_WITH_ERROR_MARGINAL);
      }
      return current;
    });
  });

  it('shares the same inflight counter with different functions', async () => {
    const backpressure = new Backpressure(1);

    const firstFn = async () => {
      await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
      return Date.now();
    };
    const backpressuredFirstFn = backpressure.wrap(firstFn);
    const secondFn = async () => {
      await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
      return Date.now();
    };
    const backpressuredSecondFn = backpressure.wrap(secondFn);
    const functions = Array.from(Array(4)).map((_, i) => {
      return i % 2 === 0 ? backpressuredFirstFn : backpressuredSecondFn;
    });

    const results = await Promise.all(functions.map(fn => fn()));
    results.reduce((previous, current) => {
      if (previous !== undefined) {
        expect(current - previous).toBeGreaterThanOrEqual(SLEEP_TIME_WITH_ERROR_MARGINAL);
      }
      return current;
    });
  });

  it('uses fifo strategy when deciding which function to invoke', async () => {
    const backpressure = new Backpressure(1);

    const sleeper = async () => {
      await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
      return Date.now();
    };
    const backpressuredSleeper = backpressure.wrap(sleeper);

    const start = Date.now();
    const finishedTimes = await Promise.all(Array.from(Array(3)).map(backpressuredSleeper));

    finishedTimes.forEach((finishedTime, index) => {
      const elapsedTime = finishedTime - start;
      const nextCallSlot = (index + 2) * SLEEP_TIME_MS;
      expect(elapsedTime).toBeLessThanOrEqual(nextCallSlot);
    });
  });
});
