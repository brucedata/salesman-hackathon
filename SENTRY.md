# Sentry errors

Error monitoring is optional and disabled by default. There is no built-in
destination. A fork or local checkout does not report to the original owner's
Sentry project.

To enable production browser errors and TanStack error-boundary failures, set
both `VITE_SENTRY_ENABLED=true` and `VITE_SENTRY_DSN` to your own project's DSN
before building. To enable unexpected server request failures, set both
`SENTRY_ENABLED=true` and `SENTRY_DSN` in the deployment environment. Missing or
blank DSNs, omitted flags, and any flag value other than `true` disable the
corresponding reporter. Browser and server settings are independent. Service
tags distinguish `salesman-web` from `salesman-server`.

The outgoing event is rebuilt from an allowlist: standard error type,
application bundle filename, line, column and a fixed service tag. Free-form
messages, names, contacts, transcripts, prompts, responses, request data,
headers, cookies, URLs/query strings, user/context/extra fields, console logs
and breadcrumbs are excluded. Logs, metrics, transactions, automatic sessions,
Replay, profiling and source-map uploads are not enabled.

Development does not send telemetry. Build with `VITE_SENTRY_ENABLED=false` to
disable browser capture; set `SENTRY_ENABLED=false` in the deployment to disable
server reporting. A Sentry DSN is public routing configuration, not an
authentication token. Do not add Sentry authentication tokens to browser
environment variables or source control.

Verify `node --test scripts/sentry-privacy.test.mjs scripts/monitoring-opt-in.test.mjs`, `npm run typecheck`,
`npm run build` and the existing browser smoke before deploying. A telemetry
failure leaves the original request failure unchanged.
