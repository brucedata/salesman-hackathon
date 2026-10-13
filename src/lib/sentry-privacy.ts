import type { ErrorEvent, Event, StackFrame } from '@sentry/browser';

const errorTypes = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'EvalError', 'AggregateError']);
export function scrubErrorEvent(event: Event, service: string): ErrorEvent | null {
  if (event.type || !event.exception?.values?.length) return null;
  const values = event.exception.values.slice(0, 3).map((exception) => {
    const frames = (exception.stacktrace?.frames ?? []).flatMap((frame): StackFrame[] => {
      if (frame.in_app === false || typeof frame.filename !== 'string') return [];
      const filename = frame.filename.split(/[?#]/, 1)[0].replaceAll('\\', '/').split('/').at(-1);
      if (!filename || !/^[A-Za-z0-9_.$-]+\.(?:[cm]?[jt]sx?)$/.test(filename)) return [];
      return [{ filename, in_app: true,
        ...(Number.isInteger(frame.lineno) && frame.lineno! > 0 ? { lineno: frame.lineno } : {}),
        ...(Number.isInteger(frame.colno) && frame.colno! > 0 ? { colno: frame.colno } : {}),
      }];
    }).slice(-30);
    return {
      type: errorTypes.has(exception.type ?? '') ? exception.type : 'Error',
      value: 'Application error (message removed for privacy)',
      ...(frames.length ? { stacktrace: { frames } } : {}),
      mechanism: { type: 'generic', handled: exception.mechanism?.handled !== false },
    };
  });
  return { type: undefined,
    ...(typeof event.event_id === 'string' && /^[a-f0-9]{32}$/.test(event.event_id) ? { event_id: event.event_id } : {}),
    ...(Number.isFinite(event.timestamp) ? { timestamp: event.timestamp } : {}),
    platform: 'javascript', level: 'error', exception: { values }, tags: { service },
  };
}

export const privateCollection = { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false, graphQL: { document: false, variables: false }, genAI: { inputs: false, outputs: false }, databaseQueryData: false, queues: false, stackFrameVariables: false, frameContextLines: 0 };
