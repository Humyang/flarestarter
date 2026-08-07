# End-to-end visual sweeps (Playwright)

These drive a real Chromium against a running dev server to capture screenshots
and exercise client-only behaviour (drawers, theme toggle, toasts, sort/paginate
clicks) that the Vitest suite (`pnpm test`) cannot. They are **not** run by
`pnpm test` and are **not** required for the gate — they are an on-demand visual
check, useful in CI or any environment where a browser can launch.

## Prerequisites

A machine where Chromium can actually run (the dev sandbox cannot — it lacks the
system libraries and root to install them). One-time browser download:

```bash
npx playwright install chromium
```

## Run

```bash
pnpm e2e
```

`playwright.config.ts` has a `webServer` that migrates + seeds the local D1 and
boots `pnpm dev` automatically, then tears it down. Screenshots are written to
`e2e/screenshots/` (git-ignored).

If a dev server is already running on :3000 it is reused (outside CI).

## What the specs cover

`free-plan.spec.ts` verifies the default unpaid flow:

- A newly registered user can enter `/app` and is labelled Free.
- The account page offers Upgrade and never exposes subscription management.
- The Pro area remains a locked preview whose CTA leads to `/pricing`.
- Registration creates no row in `subscription`, so it does not create billing state.

`free-render-job.spec.ts` verifies the local free render flow:

- A free user uploads an MP4 from `/app/render`.
- FlareStarter stores the source in R2 and submits a local-only Renderer task.
- The completed output returns to R2 and downloads through an authenticated route.
- The user still has no `subscription` row after rendering.

`admin-users.spec.ts` verifies the admin user-management flow:

- Signs in as an admin (`admin@example.com` — in `ADMIN_EMAILS`, so it gets the
  admin role; the spec marks the email verified directly in the local D1 as a
  dev shortcut).
- `/admin/users` renders the loader-driven table with seeded users.
- Dark (default) and light screenshots via the topbar theme toggle.
- Opens the per-user detail Drawer (row click) and screenshots it.

Manual things still worth an eyeball when you run it: header-sort and pagination
clicks, the ban (reason + expiry calendar) / unban / copy-email / Stripe-link /
impersonate flows and their sonner toasts, and the Drawer direction (right on
desktop, bottom on mobile).

> Selectors are derived from source; if the UI labels change, update the
> `getByRole`/locator calls here.
