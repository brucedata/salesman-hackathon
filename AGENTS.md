# Contributor instructions

Salesman is an approval-first sales demo built with TanStack Start, React,
Vite and Zustand. Read README.md and CONTRIBUTING.md before changing it.
CODEX.md is historical product context; current source and these instructions
are authoritative for setup and existing behavior.

## Boundaries

- Keep the existing app; make focused changes rather than scaffolding again.
- Current UI and seed data are English. Documentation is primarily Korean.
- State lives in localStorage (`salesman-studio`). Do not enable authentication,
  add a database, change persistence versions or reset saved data incidentally.
- Sending records an owner-approved action locally. Never add real email, SMS,
  Kakao, payment or calling side effects without an explicit feature request.
- Never commit secrets, customer data, .env files or local build artifacts.
  Use fictional demo identities and example.com/example.invalid endpoints.
- Keep optional provider credentials on the server, never in VITE_ variables.
- Monitoring requires explicit opt-in and the deployer's own DSN.
- Preserve Grok platform attribution, preview bridges and original brand assets;
  see THIRD_PARTY_NOTICES.md for upstream limitations.

## Development

Use Node from .nvmrc, npm ci, and npm run dev. Always use the npm scripts so
scripts/with-app-env.mjs resolves the same flags for dev, build and preview.
A clean clone must work without private .grok files, credentials or /workspace.
Development listens on port 8080; built preview uses 8081. Routes live in
src/routes; don't hand-edit generated src/routeTree.gen.ts.

## Validation

Run npm run typecheck, npm run lint, npm test and npm run build after relevant
changes. Make sure tests actually execute. For runtime/UI changes, also check
the running dev app and built preview in desktop and mobile viewports using
scripts/browser-smoke.mjs, inspect the screenshots, and check console errors.
Paid services need a separate explicit test setup; do not call them during CI.

## Collaboration

Assign non-overlapping files to parallel contributors. Preserve unrelated user
changes. Describe the resulting behavior, checks performed, and known limits
in the pull request. See SECURITY.md before exposing a provider-enabled server.
