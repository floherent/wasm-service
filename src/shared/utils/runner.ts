import { parentPort } from 'worker_threads';
import { WasmRunner } from '@coherentglobal/wasm-runner';

import { ExecRequestData } from './types';
import { Model } from './spark';

parentPort?.on('message', async (data: { model: Model; records: ExecRequestData[]; replicas: number }) => {
  const { replicas, model, records } = data;
  const runners: WasmRunner[] = [];
  const results = [];

  // initialization phase.
  for (let i = 0; i < replicas; i++) {
    const runner = new WasmRunner(model);
    await runner.initialize();
    runners.push(runner);
  }

  // execution phase.
  const size = Math.ceil(records.length / replicas);
  const batches = Array.from({ length: size }, (_, i) => records.slice(i * replicas, (i + 1) * replicas));

  for (const batch of batches) {
    const handlers = batch.map(async (b, i) => {
      const start = performance.now();
      return runners[i]
        .execute(b, model.id)
        .then((output) => ({ input: b, output, elapsed: performance.now() - start }))
        .catch((error) => ({ input: b, output: error ?? {}, elapsed: performance.now() - start }));
    });
    const all = await Promise.all(handlers);
    results.push(...all.flat());
  }

  // cleanup phase.
  for (const runner of runners) {
    await runner.remove(model.id);
  }
  runners.length = 0;

  parentPort?.postMessage(results);
});
