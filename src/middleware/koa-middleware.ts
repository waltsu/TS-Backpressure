import { Context, Next } from 'koa';
import { Backpressure } from '../lib/backpressure';

export type BackpressureOptions = {
  maxCalls?: number;
};

export function init(opts: BackpressureOptions) {
  const backpressure = new Backpressure(fillDefaults(opts).maxCalls);
  const handler = async function (_ctx: Context, next: Next) {
    await next();
  };
  return {
    middleware: backpressure.wrap(handler),
    backpressure: backpressure
  };
}

function fillDefaults(opts: BackpressureOptions) {
  return {
    maxCalls: 2,
    ...opts
  };
}
