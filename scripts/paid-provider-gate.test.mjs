import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

// Execute the real server handler bodies with an isolated environment and inert
// network/SDK boundaries. A disabled provider attempt is counted even if the
// application catches its exception and returns a fallback.
function loadServer(env, response) {
  const calls = { fetch: [], sdk: [] };
  const modules = new Map();
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exports = {};
    modules.set(name, exports);
    runInNewContext(outputText, {
      exports,
      process: { env },
      AbortSignal, Blob, FormData, atob, setTimeout,
      fetch: async (...args) => {
        calls.fetch.push(args);
        if (response) return response(...args);
        throw new Error('Unexpected network request in safe demo');
      },
      require: (dependency) => {
        if (dependency === 'zod') return { z };
        if (dependency === '@tanstack/react-start') return {
          createServerFn: () => {
            let validate = (value) => value;
            const builder = {
              validator: (fn) => { validate = fn; return builder; },
              handler: (fn) => async (options = {}) => fn({ data: validate(options.data) }),
            };
            return builder;
          },
        };
        if (dependency.startsWith('./')) return load(dependency.slice(2));
        calls.sdk.push(dependency);
        throw new Error(`Unexpected SDK import: ${dependency}`);
      },
    }, { filename: name, timeout: 1000 });
    return exports;
  }
  return { load, calls };
}

// Fictional credentials ensure a stale deployment key cannot activate a call.
const configured = {
  DASHSCOPE_API_KEY: 'test-only-qwen', QWEN_API_KEY: 'test-only-qwen-alias',
  XAI_API_KEY: 'test-only-grok', BRIGHTDATA_API_TOKEN: 'test-only-brightdata',
  DAYTONA_API_KEY: 'test-only-daytona', NOSANA_API_KEY: 'test-only-nosana',
  NOSANA_MARKET: 'test-only-market', NOSANA_SCORE_IMAGE: 'example.invalid/demo:latest',
};
const leadInput = {
  companyName: 'Demo Studio', founderName: 'Demo Owner', tone: 'Plain',
  refund: 'Confirm terms', delivery: 'Confirm scope', doNot: ['No unapproved discount'],
  products: [],
  lead: { name: 'Demo Customer', contact: 'demo@example.com', channel: 'email', message: 'A website inquiry' },
};
const outreachInput = {
  ...leadInput, productName: 'Demo Website', productSummary: 'A small website',
  consultUrl: 'https://example.invalid/consult', paymentUrl: 'https://example.invalid/pay',
  prospect: { name: 'Demo Customer', area: 'Design', signal: 'A website inquiry' },
};
const architectInput = {
  ...outreachInput, ...outreachInput.prospect, url: 'https://example.invalid/target',
};

for (const [label, overrides] of [
  ['no opt-in', {}],
  ['explicitly disabled', { SALESMAN_ENABLE_PAID_PROVIDERS: 'false' }],
  ['non-exact opt-in', { SALESMAN_ENABLE_PAID_PROVIDERS: 'TRUE' }],
  ['client flag only', { VITE_SALESMAN_ENABLE_PAID_PROVIDERS: 'true' }],
  ['Vercel runtime with opt-in', { SALESMAN_ENABLE_PAID_PROVIDERS: 'true', VERCEL: '1' }],
  ['Vercel preview with opt-in', { SALESMAN_ENABLE_PAID_PROVIDERS: 'true', VERCEL_ENV: 'preview' }],
  ['Vercel production with opt-in', { SALESMAN_ENABLE_PAID_PROVIDERS: 'true', VERCEL_ENV: 'production' }],
]) {
  test(`all demo flows avoid billable calls and SDKs with configured keys: ${label}`, async () => {
    const { load, calls } = loadServer({ ...configured, ...overrides });
    const ai = load('ai');
    const architect = load('architect');
    const analyzed = await ai.analyzeAndDraft({ data: leadInput });
    assert.equal(analyzed.ok, true);
    assert.equal(analyzed.intentScore, 58);
    assert.match(analyzed.draft, /Demo Customer/);
    const outreach = await ai.generateOutreach({ data: outreachInput });
    assert.equal(outreach.ok, true);
    assert.match(outreach.text, /Demo Customer/);
    // Invalid encoded audio proves the disabled path stops before decoding too.
    const transcription = await ai.transcribeVoice({ data: { audioBase64: 'invalid***', mimeType: 'audio/webm' } });
    assert.equal(transcription.ok, false);
    assert.match(transcription.error, /disabled in this safe demo/);
    const status = await architect.getInfraStatus();
    assert.equal(status.length, 4);
    assert.ok(status.every((provider) => provider.live === false));
    const run = await architect.runArchitect({ data: architectInput });
    assert.equal(run.ok, true);
    assert.equal(run.intel, architectInput.signal);
    assert.equal(run.score, 58);
    assert.equal(run.policyPass, true);
    assert.equal(run.steps.find((step) => step.id === 'brightdata').via, 'inbox-signal');
    assert.match(run.steps.find((step) => step.id === 'brightdata').detail, /URL collection disabled/);
    assert.equal(run.steps.find((step) => step.id === 'qwen').via, 'local');
    assert.equal(run.steps.find((step) => step.id === 'nosana').via, 'score:local');
    assert.equal(run.steps.find((step) => step.id === 'daytona').via, 'isolate');
    assert.deepEqual(calls, { fetch: [], sdk: [] });
  });
}

test('an explicit non-Vercel opt-in preserves provider routing without a real network call', async () => {
  const { load, calls } = loadServer({ ...configured, SALESMAN_ENABLE_PAID_PROVIDERS: 'true' }, async () => ({
    ok: true, json: async () => ({ choices: [{ message: { content: 'Mock provider response' } }] }),
  }));
  const result = await load('provider').chatComplete([{ role: 'user', content: 'Synthetic example' }], 100);
  assert.equal(result.ok, true);
  assert.equal(result.provider, 'qwen');
  assert.equal(result.text, 'Mock provider response');
  assert.equal(calls.fetch.length, 1);
  assert.deepEqual(calls.sdk, []);
});
