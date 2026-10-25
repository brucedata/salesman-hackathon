/**
 * Keys alone must never enable billable work in a public demo. This server-side
 * switch is deliberately independent of user input and client build variables.
 * Vercel deployments always stay in demo mode, including previews.
 */
export function paidProvidersEnabled(): boolean {
  return (
    process.env.SALESMAN_ENABLE_PAID_PROVIDERS === "true" &&
    !process.env.VERCEL &&
    !process.env.VERCEL_ENV
  );
}
