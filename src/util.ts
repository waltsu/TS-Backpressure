export type DeferredFunction<T> = {
  promise: Promise<T>;
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
};

export function defer<T>(): DeferredFunction<T> {
  let resolveFn: any;
  let rejectFn: any;
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  return {
    promise,
    resolve: resolveFn,
    reject: rejectFn
  };
}
