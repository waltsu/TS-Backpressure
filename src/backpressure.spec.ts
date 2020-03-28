import { Backpressure } from './backpressure';

const SLEEP_TIME_MS = 100;

describe('backpressure', () => {
  it('only allows N concurrect calls of a function', async () => {
    const backpressure = new Backpressure(2);
    const sleeper = async () => {
      await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
      return Date.now();
    };
    const backpressuredSleeper = backpressure.wrap(sleeper);

    const calls = Array.from(Array(3)).map(() => {
      return backpressuredSleeper();
    });

    const results = await Promise.all(calls);

    results.reduce((previousResult, result, index) => {
      if (index === 2) {
        expect(result - previousResult).toBeGreaterThanOrEqual(SLEEP_TIME_MS);
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
        expect(current - previous).toBeGreaterThanOrEqual(SLEEP_TIME_MS);
      }
      return current;
    });
  });
});
