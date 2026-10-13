# Sentry errors

Production browser errors, TanStack error-boundary failures and unexpected
request failures report to the organization's `salesman-web` project. Service
tags distinguish `salesman-web` from `salesman-server`.

The outgoing event is rebuilt from an allowlist: standard error type,
application bundle filename, line, column and a fixed service tag. Free-form
messages, names, contacts, transcripts, prompts, responses, request data,
headers, cookies, URLs/query strings, user/context/extra fields, console logs
and breadcrumbs are excluded. Logs, metrics, transactions, automatic sessions,
Replay, profiling and source-map uploads are not enabled.

Development does not send telemetry. Build with `VITE_SENTRY_ENABLED=false` to
disable browser capture; set `SENTRY_ENABLED=false` in the deployment to disable
server reporting. Public DSNs can be overridden by `VITE_SENTRY_DSN` and
`SENTRY_DSN`. No new authentication token is needed.

Verify `node --test scripts/sentry-privacy.test.mjs`, `npm run typecheck`,
`npm run build` and the existing browser smoke before deploying. A telemetry
failure leaves the original request failure unchanged.
