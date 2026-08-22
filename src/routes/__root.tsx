import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { HydrateStudio } from "@/components/hydrate-studio";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Salesman";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content: "An AI sales workspace that collects inquiries, prepares policy-aware drafts, and records approved follow-up for solo businesses.",
      },
      { name: "theme-color", content: "#ffffff" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@400;500;600&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <HydrateStudio>
            <Outlet />
          </HydrateStudio>
        </AuthProvider>
        <Toaster
          theme="light"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#111827",
              border: "1px solid rgb(17 24 39 / 0.12)",
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  ),
});
