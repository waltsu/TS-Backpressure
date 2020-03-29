import * as Koa from 'koa';
import axios from 'axios';
import { Server } from 'http';
import { AddressInfo } from 'net';

import { backpressure } from './koa-middleware';

const SLEEP_TIME_MS = 100;
const sleepEndpoint = async (ctx: Koa.Context, _next: Koa.Next) => {
  await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_MS));
  ctx.body = 'done';
};

const createTestApp = () => {
  const app = new Koa();
  app.use(backpressure({ maxCalls: 1 }));
  app.use(sleepEndpoint);

  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  return { app, server, address };
};

describe('koa-middleware', () => {
  let server: Server;
  let port: number;

  beforeAll(() => {
    const app = createTestApp();
    server = app.server;
    port = app.address.port;
  });

  afterAll(() => {
    server.close();
  });

  it('applies backpressure', async () => {
    const now = Date.now();
    const responses = await Promise.all(
      Array.from(Array(3)).map(() => axios.get(`http://localhost:${port}`))
    );
    const elapsed = Date.now() - now;

    responses.forEach(response => expect(response.status).toEqual(200));
    expect(elapsed).toBeGreaterThanOrEqual(3 * SLEEP_TIME_MS);
  });
});
