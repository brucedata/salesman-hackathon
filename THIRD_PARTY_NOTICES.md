# Third-party notices

The root MIT license covers the project contributions for which the authors
can grant rights. It does not replace third-party licenses or grant trademark
rights. Preserve upstream copyright and license notices when redistributing.

## Dependencies

Exact package versions and declared licenses are recorded in `package-lock.json`.
Installed packages contain their own license texts. Dependencies include React,
TanStack, Vite, Tailwind CSS, Zustand, Radix UI, Lucide, Sentry SDKs, Daytona and
Nosana. Do not treat this list as a complete dependency license inventory.

The locked `@sentry/node` dependency includes `@sentry/bundler-plugins`, which
in turn includes the `sentry` CLI under **FSL-1.1-Apache-2.0**. That CLI has
different license restrictions from the MIT-licensed Sentry SDKs. Other
dependencies also include licenses such as Apache-2.0, MPL-2.0 and CC-BY-4.0.
Review the exact installed license texts for your distribution and usage.

## Original scaffold and assets

This project began in Grok App Builder. The original scaffold includes
`public/__grok/`, `scripts/grok-pwa-*`, `scripts/install-page.html`,
`server/middleware/grok-pwa.ts`, preview bridges and authentication helpers.
The repository retains the original Grok attribution and platform integration.
No separate upstream license for these bundled scaffold assets was present in
the original repository; this notice does not invent or grant additional rights
over those third-party materials. Confirm the applicable upstream terms before
redistributing them separately or representing them as your own work.

The Grok name and logos and other service names remain their owners' marks.
The root MIT license does not authorize use of those marks or imply endorsement.

## External resources and services

The app requests Outfit and Instrument Serif through Google Fonts and loads
the Grok App Builder extension script. These externally served resources are
subject to their own terms and are not bundled under this project's license.
Optional AI, data collection, sandbox, GPU and monitoring services require your
own accounts and are governed by their respective terms. No API credits or
provider credentials are included.
