import * as Koa from 'koa';
import { AddressInfo } from 'net';

import { init as initMiddleware } from '../src/middleware/koa-middleware';

import * as debug from 'debug';
const log = debug('ts-backpressure');
const statsLog = debug('ts-backpressure:stats');

const LOOP_COUNT = 100;

const calculateRandom = (): Promise<number> => {
  return new Promise(resolve => {
    setTimeout(() => {
      let result = 0;
      let loop = LOOP_COUNT * 1000 * 2;
      while (loop >= 0) {
        result = Math.random() * Math.random();
        loop--;
      }
      resolve(result);
    }, 0);
  });
};

const spendCPUCycles = async () => {
  let result = 0;
  let loop = LOOP_COUNT;

  while (loop >= 0) {
    result = await calculateRandom();
    loop--;
  }

  return result;
};

const heavyCalculation = async (ctx: Koa.Context, _next: Koa.Next) => {
  log('Starting to spend cycles');
  const result = await spendCPUCycles();
  log('Finished doing that');

  ctx.body = result;
};

const app = new Koa();

const { backpressure, middleware } = initMiddleware({ maxCalls: 2 });
app.use(middleware);

app.use(heavyCalculation);

const server = app.listen(4000);
const address = server.address() as AddressInfo;
log(`Server started at: ${address.address}:${address.port}`);

process.on('SIGUSR2', () => {
  setInterval(() => {
    statsLog(backpressure.getStats());
  }, 1000);
});
