import { env } from '@/config/env';

/**
 * Simulates real network latency (+ light jitter) so loading/skeleton states
 * are exercised the same way they would be against a live API.
 */
export function withMockDelay<T>(payload: T, delayMs: number = env.mockNetworkDelayMs): Promise<T> {
  const jitter = Math.random() * 200;
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delayMs + jitter);
  });
}
