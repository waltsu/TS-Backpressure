export type Leash = {
  promise: Promise<void>;
  release: () => void;
};

export function getLeash(): Leash {
  let resolveFn: any;
  const promise = new Promise<void>((resolve, _reject) => {
    resolveFn = resolve;
  });

  return {
    promise,
    release: resolveFn
  };
}
