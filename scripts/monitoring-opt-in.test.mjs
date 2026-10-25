import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { privateCollection, scrubErrorEvent } from '../src/lib/sentry-privacy.ts';

// Run the real reporter modules with an inert SDK, so checking production
// opt-in behavior never sends events or needs live credentials.
function loadReporter(filename, env, browser = false) {
  const calls = { init: [], capture: [], flush: [] };
  const sdk = {
    init: (options) => calls.init.push(options),
    captureException: (error) => calls.capture.push(error),
    flush: async (timeout) => calls.flush.push(timeout),
    globalHandlersIntegration: () => ({}),
    browserApiErrorsIntegration: () => ({}),
  };
  const source = readFileSync(new URL(`../src/lib/${filename}`, import.meta.url), 'utf8')
    .replaceAll('import.meta.env', 'testEnv');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    testEnv: env,
    process: { env },
    ...(browser ? { window: {} } : {}),
    require: (name) => {
      if (name === '@sentry/browser' || name === '@sentry/node') return sdk;
      if (name === './sentry-privacy') return { privateCollection, scrubErrorEvent };
      throw new Error(`Unexpected reporter import: ${name}`);
    },
  }, { filename, timeout: 1000 });
  return { reporter: exports, calls };
}

const dsn = 'https://public@example.com/123';

test('browser telemetry stays inactive without explicit opt-in, a DSN, and production', () => {
  for (const env of [
    { PROD: true },
    { PROD: true, VITE_SENTRY_DSN: dsn },
    { PROD: true, VITE_SENTRY_ENABLED: 'true' },
    { PROD: true, VITE_SENTRY_ENABLED: 'true', VITE_SENTRY_DSN: '  ' },
    { PROD: true, VITE_SENTRY_ENABLED: 'false', VITE_SENTRY_DSN: dsn },
    { PROD: true, VITE_SENTRY_ENABLED: 'TRUE', VITE_SENTRY_DSN: dsn },
    { PROD: false, VITE_SENTRY_ENABLED: 'true', VITE_SENTRY_DSN: dsn },
  ]) {
    const { reporter, calls } = loadReporter('monitoring.ts', env, true);
    reporter.initializeMonitoring();
    reporter.reportRenderError(new Error('private customer input'));
    assert.deepEqual(calls, { init: [], capture: [], flush: [] }, JSON.stringify(env));
  }
});

test('browser telemetry initializes once with only the configured DSN', () => {
  const env = { PROD: true, VITE_SENTRY_ENABLED: 'true', VITE_SENTRY_DSN: ` ${dsn} ` };
  const { reporter, calls } = loadReporter('monitoring.ts', env, true);
  reporter.reportRenderError(new Error('before initialization'));
  assert.equal(calls.capture.length, 0);
  reporter.initializeMonitoring();
  reporter.initializeMonitoring();
  reporter.reportRenderError(new Error('reported after initialization'));
  assert.equal(calls.init.length, 1);
  assert.equal(calls.init[0].dsn, dsn);
  assert.equal(calls.capture.length, 1);
  assert.equal(calls.init[0].beforeSend({ message: 'private text' }), null);

  const serverRender = loadReporter('monitoring.ts', env);
  serverRender.reporter.initializeMonitoring();
  assert.equal(serverRender.calls.init.length, 0);
});

test('server telemetry stays inactive without explicit opt-in, a DSN, and production', async () => {
  for (const env of [
    { NODE_ENV: 'production' },
    { NODE_ENV: 'production', SENTRY_DSN: dsn },
    { NODE_ENV: 'production', SENTRY_ENABLED: 'true' },
    { NODE_ENV: 'production', SENTRY_ENABLED: 'true', SENTRY_DSN: '  ' },
    { NODE_ENV: 'production', SENTRY_ENABLED: 'false', SENTRY_DSN: dsn },
    { NODE_ENV: 'production', SENTRY_ENABLED: 'TRUE', SENTRY_DSN: dsn },
    { NODE_ENV: 'development', SENTRY_ENABLED: 'true', SENTRY_DSN: dsn },
  ]) {
    const { reporter, calls } = loadReporter('monitoring.server.ts', env);
    await reporter.reportServerError(new Error('private customer input'));
    assert.deepEqual(calls, { init: [], capture: [], flush: [] }, JSON.stringify(env));
  }
});

test('server telemetry uses the configured DSN and retains privacy filtering', async () => {
  const { reporter, calls } = loadReporter('monitoring.server.ts', {
    NODE_ENV: 'production', SENTRY_ENABLED: 'true', SENTRY_DSN: ` ${dsn} `,
  });
  await reporter.reportServerError(new Error('first failure'));
  await reporter.reportServerError(new Error('second failure'));
  assert.equal(calls.init.length, 1);
  assert.equal(calls.init[0].dsn, dsn);
  assert.equal(calls.capture.length, 2);
  assert.deepEqual(calls.flush, [1500, 1500]);
  assert.equal(calls.init[0].beforeSend({ message: 'private text' }), null);
});
