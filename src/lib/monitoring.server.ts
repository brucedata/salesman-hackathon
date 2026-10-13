import { init, captureException, flush } from '@sentry/node';
import { privateCollection, scrubErrorEvent } from './sentry-privacy';
let initialized = false;
export async function reportServerError(error: unknown) {
  if (process.env.NODE_ENV !== 'production' || process.env.SENTRY_ENABLED === 'false') return;
  if (!initialized) {
    initialized = true;
    init({ dsn: process.env.SENTRY_DSN || '',
      defaultIntegrations: false, integrations: [], dataCollection: privateCollection,
      maxBreadcrumbs: 0, beforeBreadcrumb: () => null,
      beforeSend: (event) => scrubErrorEvent(event, 'salesman-server'),
      beforeSendLog: () => null, beforeSendMetric: () => null, 
      
      sendClientReports: false, includeServerName: false, ignoreSpans: [/.*/], tracePropagationTargets: [],
    });
  }
  captureException(error);
  await flush(1500);
}

