import test from 'node:test';
import assert from 'node:assert/strict';
import { scrubErrorEvent } from '../src/lib/sentry-privacy.ts';

test('browser and server errors retain stack grouping without customer data', () => {
  const secret = 'customer@example.com secret-token';
  const result = scrubErrorEvent({ event_id: 'a'.repeat(32), timestamp: 1,
    message: secret, user: { email: secret }, request: { data: secret, headers: { authorization: secret } },
    extra: { secret }, contexts: { trace: { data: { secret } } }, breadcrumbs: [{ message: secret }], tags: { customer: secret },
    exception: { values: [{ type: 'TypeError', value: secret, stacktrace: { frames: [
      { filename: 'https://service.test/assets/main-123.js?token=secret-token', lineno: 42, colno: 2, vars: { secret }, pre_context: [secret] },
    ] } }] } }, 'salesman-web');
  assert.deepEqual(result.exception.values[0].stacktrace.frames, [{ filename: 'main-123.js', in_app: true, lineno: 42, colno: 2 }]);
  for (const key of ['user', 'request', 'extra', 'contexts', 'breadcrumbs']) assert.equal(key in result, false);
  assert.equal(JSON.stringify(result).includes('customer'), false);
  assert.equal(JSON.stringify(result).includes('secret-token'), false);
  assert.deepEqual(result.tags, { service: 'salesman-web' });
});

test('non-error events and arbitrary error class names cannot transmit private text', () => {
  assert.equal(scrubErrorEvent({ type: 'transaction' }, 'salesman-web'), null);
  assert.equal(scrubErrorEvent({ message: 'customer input' }, 'salesman-web'), null);
  assert.equal(scrubErrorEvent({ exception: { values: [{ type: 'customer@example.com' }] } }, 'salesman-server').exception.values[0].type, 'Error');
});
