import { init, captureException, globalHandlersIntegration, browserApiErrorsIntegration } from '@sentry/browser';
import { privateCollection, scrubErrorEvent } from './sentry-privacy';

let initialized = false;
export function initializeMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (initialized || typeof window === 'undefined' || !import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED !== 'true' || !dsn) return;
  initialized = true;
  init({ dsn,
    defaultIntegrations: false, integrations: [globalHandlersIntegration(), browserApiErrorsIntegration()],
    dataCollection: privateCollection, maxBreadcrumbs: 0, beforeBreadcrumb: () => null,
    beforeSend: (event) => scrubErrorEvent(event, 'salesman-web'),
    beforeSendLog: () => null, beforeSendMetric: () => null, 
    
    sendClientReports: false, ignoreSpans: [/.*/], tracePropagationTargets: [],
  });
}
export function reportRenderError(error: unknown) {
  if (initialized) captureException(error);
}

