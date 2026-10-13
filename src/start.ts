import { createStart, createMiddleware } from '@tanstack/react-start';

const errors = createMiddleware().server(async ({ next }) => {
  try { return await next(); }
  catch (error) {
    try {
      const { reportServerError } = await import('./lib/monitoring.server');
      await reportServerError(error);
    } catch { /* Reporting must not change the original request failure. */ }
    throw error;
  }
});
export const startInstance = createStart(() => ({ requestMiddleware: [errors] }));
