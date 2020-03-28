import { Backpressure } from './backpressure';

describe('backpressure', () => {
  it('only allows 2 inflight calls of function', async () => {
    const backpressure = new Backpressure();
    const sleeper = async (callback: Function) => {
      await new Promise(resolve => setTimeout(resolve, 500));
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
    expect(doneTimestamps[2] - doneTimestamps[1]).toBeGreaterThan(500);
  });
});
