export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  mockNetworkDelayMs: Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 550),
  appName: "GapLens",
} as const;
