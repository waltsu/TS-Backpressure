# Backpressure

Library for applying backpressure to the function invocations.

## Usage

```typescript
import { Backpressure } from './backpressure';

const sleep = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
};

const backpressure = new Backpressure(1); // Allow only one call to be inflight
const backpressuredSleep = backpressure.wrap(sleep);

const promises = Array.from(Array(3)).map(backpressuredSleep);

await Promise.all(promises); // Resolves after 3 seconds
```
