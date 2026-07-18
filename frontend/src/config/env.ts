export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  mockNetworkDelayMs: Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 550),
  appName: "G.A.R.Y",
} as const;
