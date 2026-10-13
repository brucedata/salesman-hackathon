import { init, captureException, globalHandlersIntegration, browserApiErrorsIntegration } from '@sentry/browser';
import { privateCollection, scrubErrorEvent } from './sentry-privacy';

const publicDsn = '';
let initialized = false;
export function initializeMonitoring() {
  if (initialized || typeof window === 'undefined' || !import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED === 'false') return;
  initialized = true;
  init({ dsn: import.meta.env.VITE_SENTRY_DSN || publicDsn,
    defaultIntegrations: false, integrations: [globalHandlersIntegration(), browserApiErrorsIntegration()],
    dataCollection: privateCollection, maxBreadcrumbs: 0, beforeBreadcrumb: () => null,
    beforeSend: (event) => scrubErrorEvent(event, 'salesman-web'),
    beforeSendLog: () => null, beforeSendMetric: () => null, 
    
    sendClientReports: false, ignoreSpans: [/.*/], tracePropagationTargets: [],
  });
}
export function reportRenderError(error: unknown) { captureException(error); }

