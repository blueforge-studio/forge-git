# forge-git: Login Screen Redesign — Design Spec

Date: 2026-06-12
Scope: `/login` page only (deep polish + QoL features)
Out of scope: signup, forgot-token, auth flow changes, brand shell expansion

---

## Overview

Rewrite the login page with a modern two-column layout, polished visual
hierarchy, and three small quality-of-life features. Server auth contract
(`actions.ts`) is unchanged. The result should feel like a first-class
landing surface for the product, not a placeholder form.

## Layout

### Desktop (≥768px)

Two-column grid filling the viewport height (`min-h-screen`):

- **Left column — 40% width.** Brand panel. Sticky-feel content: large logo
  wordmark, the product tagline, a 2–3 line value prop. Background: subtle
  animated gradient mesh (purple → pink → indigo) at low opacity behind a
  soft noise texture. Rounded inner edge on the right (so the card feels
  like it sits over the panel rather than next to it).
- **Right column — 60% width.** Auth surface. Vertically centered, max-width
  420px. Glass card with the existing gradient top border. Generous
  internal padding (`p-10`), tighter type scale.

### Mobile (<768px)

Single column. Brand collapses to a compact header (logo + name only);
gradient moves to a soft background wash. Brand panel hidden entirely on
mobile to keep focus on the form. Auth card takes full width with
standard padding.

### Visual details

- Headline: `text-2xl font-semibold tracking-tight`
- Subhead: `text-sm text-muted-foreground leading-relaxed`
- OAuth button: keep `btn-glow`, add `h-11` and an inline right-arrow
  that nudges on hover
- PAT section: keep the `<details>` toggle; restyle the summary as a
  subtle `text-xs uppercase tracking-wider` link
- All form inputs use the `@forge-git/ui` `Input` primitive (replace
  raw `<input>` classes) for consistency
- Setup instructions at the bottom become a `<details>` (was always
  visible) so the default card stays focused
- Loading state (`loading.tsx`) updated to match the new two-column
  skeleton — no layout flash on slow networks

## Component structure

Single file rewritten: `apps/web/src/app/login/page.tsx` stays the only
client component. No new components extracted — the login page is the
only consumer of this exact composition.

### Layout of `page.tsx`

```
<main min-h-screen>
  <div md:grid md:grid-cols-[40%_60%]>
    <BrandPanel />         // hidden <md, animated gradient + logo + tagline
    <AuthCard>
      <CardHeader />       // logo + wordmark + headline + subhead
      <OAuthError />       // reads ?error= from useSearchParams
      <OAuthButton />      // anchor to /api/auth/authorize
      <Divider>Or use a personal access token</Divider>
      <PATDetails>         // <details>/<summary>
        <form action={formAction}>...inputs...submit</form>
      </PATDetails>
      <SetupHelp />        // <details> with copyable code blocks
    </AuthCard>
  </div>
</main>
```

### Client-side helpers (in-file, no new modules)

Both helpers are < 25 lines each and only used here. If a second page
ever needs them, promote to `lib/login/`.

- `useGiteaUrlMemory()` — reads/writes the last-used Gitea URL to
  `localStorage` under key `forge-git:last-gitea-url`. Returns
  `{ url, setUrl }`. Hydration-safe (SSR returns empty string,
  `useEffect` populates on mount).
- `useUrlHealth()` — debounced (400ms) fetch to
  `${giteaUrl}/api/v1/version` GET request. Returns
  `'idle' | 'checking' | 'ok' | 'unreachable'`. Aborts in-flight requests
  via `AbortController` on new input.

## QoL features

### F1. Remember Gitea URL (localStorage)

- On mount, `useGiteaUrlMemory` pre-fills the URL input from localStorage.
  Token field always starts empty (never persisted).
- Visual cue: when the input is pre-filled from memory, show a tiny
  `text-[10px] text-muted-foreground` line below: `Last used: just now`.
- Write path: a hidden `useEffect` syncs the `giteaUrl` input value to
  localStorage (debounced 300ms).
- Storage key: `forge-git:last-gitea-url`. Wrap in try/catch — private
  browsing / quota errors degrade silently.

### F2. Inline URL health check

- On URL input blur (or 400ms after the user stops typing), fire
  `fetch(${url}/api/v1/version, { method: 'GET', signal })`.
- Render a small status pill to the right of the input:
  - green dot + `Connected to Gitea`
  - red dot + `Unreachable`
  - spinner + `Checking…`
- Purely informational — never blocks submit. If the URL is bad, the
  server action's existing error handling catches it.
- Aborts in-flight requests on new input via `AbortController`.

### F3. Better setup help

- Move the bottom block into a `<details>` so the default card is short.
- Replace the inline `code` spans with copyable code blocks: small
  `Copy` button (lucide `Clipboard` icon) that flips to `Check` for 1.5s
  on success. Uses `navigator.clipboard.writeText`.
- Add a "New here? Get a token →" link in the PAT section that points to
  `${giteaUrl}/user/settings/applications` once a URL is entered
  (falls back to `https://docs.gitea.com/administration/config-cheat-sheet/`
  as the help URL when no URL is entered yet). Opens in a new tab with
  `rel="noopener"`.

## Data flow

No server changes. `actions.ts` stays exactly as-is — validates URL and
token, calls `getCurrentUser`, creates the session, redirects. All three
QoL features are non-blocking client-side enhancements that improve UX
without changing the auth contract.

## Error handling

Three error sources, three render paths. Server-side error contract
(`{ error: string }` from `useActionState`) is unchanged.

### E1. URL validation (client-side, new)

If `new URL(giteaUrl)` throws or protocol isn't `http(s)`, show an
inline message under the URL input: `Use a full URL starting with
http:// or https://`. Mirrors the server check so the user gets feedback
before round-tripping.

### E2. Form action errors (existing, polished)

The `state.error` from `useActionState` is rendered in the existing
destructive banner. Three cases route through this banner:

- `Invalid token` (401 from Gitea) — already handled in `actions.ts`
- `Cannot reach Gitea: <reason>` — already handled
- Network failures (e.g. `TypeError: fetch failed`) — surface as
  `Cannot reach Gitea. Check the URL and your connection.`

Banner gets a subtle entrance animation
(`animate-in fade-in slide-in-from-top-1 duration-200`).

### E3. OAuth callback errors (existing, polished)

`OAuthError` stays — reads `?error=` from `useSearchParams`. The error
map in the current file stays unchanged. Same destructive banner
styling as E2 for consistency.

### URL health check failures (F2) are NOT errors

The pill just shows `Unreachable` — submit stays enabled, server-side
validation is the source of truth. Mixing a "soft" health indicator with
the form's error state would be confusing.

### Accessibility

- All error messages get `role="alert"` and `aria-live="polite"`.
- Input has `aria-invalid="true"` and `aria-describedby="<error-id>"`
  when the URL is invalid.
- `<details>` toggles get `aria-expanded` (native behavior covers it).

## i18n

Wrap new strings in `useTranslations('login')` and add entries to both
`en.json` and `da.json`. New keys:

- `tagline`
- `or_use_pat`
- `pat_summary`
- `gitea_url_health_ok`
- `gitea_url_health_unreachable`
- `gitea_url_health_checking`
- `setup_help_summary`
- `setup_help_step_1` … `setup_help_step_4`
- `new_here_get_token`
- `last_used_hint`
- `url_invalid`

## Testing

### Update `apps/web/e2e/auth.spec.ts`

The existing tests assert copy and structure that is changing. Concrete
updates:

| Test | Change |
|---|---|
| `login page renders the sign in form` | Update heading locator to match the new headline copy. Update OAuth button locator to match the new copy. |
| `login page PAT form is behind details toggle` | Add an assertion for the new PAT summary text. Keep the toggle behavior test. |
| `login page shows OAuth setup instructions` | Click the new `<details>` first to open setup help, then assert. Was always-visible before. |
| `PAT form shows error with empty fields` | Still works — server action returns the same error. |
| `protected pages redirect to login` | No change. |
| Landing page / nav tests | No change. |

### New tests to add

1. `login page remembers last Gitea URL` — set
   `localStorage.setItem('forge-git:last-gitea-url', 'https://demo.example.com')`
   in `addInitScript`, navigate to `/login`, open PAT details, assert
   the URL input is pre-filled.
2. `login page URL health check shows status` — stub
   `GET /api/v1/version` to return 200 for `https://test-gitea.example.com`
   (and 5xx for `https://broken.example.com`) via `page.route`, type each
   URL, wait 500ms, assert the pill shows the matching status.
3. `login page setup help is collapsed by default` — assert the setup
   `<details>` is not open on first load.
4. `login page setup help copy button works` — open setup help, click
   copy on a code block, assert the icon swaps to a check (use
   `page.evaluate` to spy on `navigator.clipboard.writeText`).

### Playwright config

The `addInitScript` pattern for the localStorage test and the clipboard
spy need `permissions: ['clipboard-read', 'clipboard-write']` in the
test or project config. Add a comment in the affected tests.

### Unit tests

None new. The two client hooks are tightly coupled to the form
component and tested implicitly via the e2e flow. If they grow
complexity, promote + test then.

### Visual regression

Skip. No Chromatic/Percy configured. E2e assertions + manual browser
review are enough for a single-page change.

## Files touched

| File | Change |
|---|---|
| `apps/web/src/app/login/page.tsx` | Full rewrite (layout, components, hooks) |
| `apps/web/src/app/login/loading.tsx` | Update skeleton to match new two-column layout |
| `apps/web/e2e/auth.spec.ts` | Update existing assertions, add 4 new tests |
| `apps/web/playwright.config.ts` | Add clipboard permissions (if not already set) |
| `apps/web/messages/en.json` | Add new i18n keys |
| `apps/web/messages/da.json` | Add new i18n keys (Danish translations) |

## What's NOT in scope

- Signup, forgot-token, recovery routes (future iterations)
- Middleware changes (existing route protection pattern stays)
- Auth flow changes (callback, session refresh, etc.)
- Brand panel reuse on other pages (extract when there's a second consumer)
- Mobile-specific layout beyond the column collapse
- Visual regression infrastructure
- Unit tests for the two client hooks
