import { Backpressure } from './backpressure';

const SLEEP_TIME_MS = 100;

describe('backpressure', () => {
  it('only allows N concurrect calls of a function', async () => {
    const backpressure = new Backpressure(2);
    const sleeper = async (callback: Function) => {
      await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
      callback(Date.now());
    };
    const backpressuredSleeper = backpressure.wrap(sleeper);

    const doneTrackers = Array.from(Array(3)).map(() => jest.fn());
    const calls = doneTrackers.map(isDone => {
      return backpressuredSleeper(isDone);
    });

    await Promise.all(calls);

    const doneTimestamps = doneTrackers
      .map(jestFn => {
        return jestFn.mock.calls[0][0];
      })
      .sort();
    expect(doneTimestamps[2] - doneTimestamps[1]).toBeGreaterThan(SLEEP_TIME_MS);
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
});
