import { Context, Next } from 'koa';
import { Backpressure } from './backpressure';

export type BackpressureOptions = {
  maxCalls?: number;
};

export function backpressure(opts: BackpressureOptions) {
  const backpressure = new Backpressure(fillDefaults(opts).maxCalls);
  const handler = async function (_ctx: Context, next: Next) {
    await next();
  };
  return backpressure.wrap(handler);
}

function fillDefaults(opts: BackpressureOptions) {
  return {
    maxCalls: 2,
    ...opts
  };
}
