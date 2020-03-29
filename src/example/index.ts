import * as Koa from 'koa';
import { AddressInfo } from 'net';

import { backpressure } from '../middleware/koa-middleware';

import * as debug from 'debug';
const log = debug('ts-backpressure');

const LOOP_COUNT = 1000 * 1000 * 10;

const spendCPUCycles = () => {
  let result = 0;
  let firstLoop = LOOP_COUNT;
  let secondLoop = LOOP_COUNT;
  let thirdLoop = LOOP_COUNT;

  while (firstLoop >= 0) {
    while (secondLoop >= 0) {
      while (thirdLoop >= 0) {
        result = Math.random() * Math.random();
        thirdLoop--;
      }
      secondLoop--;
    }
    firstLoop--;
  }

  return result;
};

const heavyCalculation = async (ctx: Koa.Context, _next: Koa.Next) => {
  log('Starting to spend cycles');
  const result = spendCPUCycles();
  log('Finished doing that');

  ctx.body = result;
};

const app = new Koa();
app.use(backpressure({ maxCalls: 1 }));
app.use(heavyCalculation);

const server = app.listen(4000);
const address = server.address() as AddressInfo;
log(`Server started at: ${address.address}:${address.port}`);
