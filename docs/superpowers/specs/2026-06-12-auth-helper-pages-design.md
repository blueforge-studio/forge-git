# forge-git: Auth Helper Pages — Design Spec

Date: 2026-06-12
Scope: Three new auth-adjacent pages + login page additions + OAuth callback
       refactor. All visual / UX only — no auth contract changes.
Out of scope: any new Gitea API integrations, password reset, account
              creation, mobile-specific layout beyond column collapse

---

## Overview

Add three new auth-adjacent pages that complete the user journey started by
the login redesign:

- **`/signup`** — a helper page that explains "forge-git uses Gitea for
  accounts" and links out to Gitea signup paths
- **`/forgot-token`** — a URL-recovery page for users who don't remember
  their Gitea instance URL
- **`/auth/callback`** — replaces the bare server redirect after OAuth
  with a branded loading + error page

All three pages share the same visual treatment as the login page (two-
column layout, brand aside, glass card). The login page gains two
small cross-links.

The OAuth callback server route (`/api/auth/callback/route.ts`) is
refactored to redirect to the new `/auth/callback` page instead of
directly to `/` or `/login?error=`. The login page's `OAuthError` banner
stays in place for direct `/login?error=` visits (backwards-compatible).

## Architecture

### Shared code (new, promoted from login)

Two small modules get extracted from `login/page.tsx` because they're
now needed by 3+ pages. Both are < 50 lines and have no client state of
their own beyond what was already in-file.

**`apps/web/src/lib/auth/use-gitea-url-memory.ts`**

Promoted from `login/page.tsx` (was 27 lines, in-file per login spec).
Identical behavior. Used by:
- `login/page.tsx` (existing consumer)
- `signup/page.tsx` (new — for the "Open Gitea token settings" CTA link)
- `forgot-token/page.tsx` (new — for the "We may have saved it" section)

The login spec's "promote when there's a second consumer" trigger is
met: the second and third consumers now exist.

**`apps/web/src/components/auth/auth-shell.tsx`** (server component)

Renders the two-column layout shell — brand aside (left) + content
surface (right, contains children). Reused by all 4 auth pages
(login, signup, forgot-token, callback).

```tsx
// auth-shell.tsx — server component
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <BrandAside />
      <section className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-[420px]">
          <GlassCard>{children}</GlassCard>
        </div>
      </section>
    </main>
  )
}
```

`BrandAside` and `GlassCard` are local subcomponents in the same file
(under 30 lines each). If a 5th consumer appears, promote to separate
files.

**Visual details:**
- Brand aside uses the same gradient mesh + logo + wordmark + tagline
  from `login/page.tsx:133-147`
- Glass card uses the same `glass-card p-10` + gradient top border from
  `login/page.tsx:152-154`
- Mobile: brand aside hidden, card takes full width

### File layout

```
apps/web/src/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx          # NEW: client component
│   ├── api/auth/
│   │   └── callback/
│   │       └── route.ts          # MODIFIED: redirect targets
│   ├── forgot-token/
│   │   └── page.tsx              # NEW: client component
│   ├── signup/
│   │   └── page.tsx              # NEW: client component
│   └── login/
│       └── page.tsx              # MODIFIED: extract shell, add 2 links
├── components/auth/
│   └── auth-shell.tsx            # NEW: server component
└── lib/auth/
    └── use-gitea-url-memory.ts   # NEW: promoted from login
```

## Page designs

### Signup page (`/signup`)

Client component, uses `useTranslations('auth.signup')` and
`useGiteaUrlMemory()` (for the "Create token" CTA URL).

```
<AuthShell>
  <CardHeader>
    Wordmark + headline "Don't have an account yet?"
  </CardHeader>
  <Subhead>
    "forge-git uses your Gitea instance for everything — repos, auth, 
     identity. You'll need a Gitea account to sign in."
  </Subhead>

  <Section "1. Get a Gitea account">
    3 vertical option cards, each: icon + title + 1-line description + 
    right-arrow that nudges on hover. Opens external link in new tab 
    with rel="noopener".
    
    - [Globe] Sign up at a public instance → codeberg.org / gitea.com
    - [Server] Self-host Gitea → gitea.com/installation
    - [Users] Ask your team admin to invite you (no link, just a tip)
  </Section>

  <Divider />

  <Section "2. Create a personal access token">
    Brief explanation (1 line) + CTA button 
    "Open Gitea token settings" → 
      rememberedUrl
        ? `${rememberedUrl}/user/settings/applications`
        : 'https://docs.gitea.com/administration/config-cheat-sheet/'
    Disabled state with tooltip when no URL is known yet? — no, YAGNI.
    Always show the CTA, the link gracefully falls back to docs.
  </Section>

  <FooterLink>Already have an account? Sign in →</FooterLink>
</AuthShell>
```

### Forgot-token page (`/forgot-token`)

Client component, uses `useTranslations('auth.forgotToken')` and
`useGiteaUrlMemory()` (for the "saved URL" section).

```
<AuthShell>
  <CardHeader>
    Wordmark + headline "Forgot your Gitea URL?"
  </CardHeader>
  <Subhead>
    "The address of the Gitea instance you sign in to. Often looks 
     like https://git.yourcompany.com"
  </Subhead>

  <Section "Check your browser">
    Two states based on useGiteaUrlMemory.url:
    
    [HAS saved URL]
    Card with the URL in a code span + Copy button (reuses CodeBlock 
    pattern from login). Caption: "We saved this from a previous 
    sign-in on this device."
    
    [NO saved URL]
    Muted text: "Nothing saved on this device. Try the suggestions 
    below or ask your team."
  </Section>

  <Divider />

  <Section "Where to find it">
    4 hint bullets, each with a small icon:
    - [Mail] Check the email invite from your team admin
    - [MessageCircle] Ask a teammate for the URL they use
    - [Search] Search your browser history for "gitea" or "forge"
    - [BookOpen] Check your team's wiki or runbook
  </Section>

  <FooterLink>Found it? Sign in →</FooterLink>
</AuthShell>
```

### Auth callback page (`/auth/callback`)

Client component, uses `useSearchParams` and
`useTranslations('auth.callback')`. Three render states based on
query params.

```
[STATE: loading — no params, or ?status=success]
  <AuthShell>
    <GlassCard className="text-center">
      <Spinner className="mx-auto" />
      <h1 className="text-2xl font-semibold mt-4">Signing you in…</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Finishing your Gitea session
      </p>
    </GlassCard>
  </AuthShell>
  // On mount: if ?status=success, wait 600ms then router.replace('/repositories')

[STATE: error — ?error=oauth-... or ?error=callback-failed]
  <AuthShell>
    <GlassCard className="text-center">
      <IconCircle variant="error" className="mx-auto">
        <XCircle />
      </IconCircle>
      <h1 className="text-2xl font-semibold mt-4">We couldn't sign you in</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {translated error message from auth.login.oauthError.* map}
      </p>
      <Button className="mt-6" asChild>
        <Link href="/login">Try again</Link>
      </Button>
    </GlassCard>
  </AuthShell>

[STATE: success — handled by loading state above]
  // Same render as loading, just auto-redirects after 600ms
```

**Decision:** the loading and success states share the same render
(same spinner + copy). The only difference is the `useEffect` that
triggers the redirect. This avoids a visual flash between "loading"
and "success" — the user just sees the spinner, then the dashboard.

## Server route refactor

### `apps/web/src/app/api/auth/callback/route.ts`

Two redirect targets change. All other logic (state validation, code
exchange, session creation) stays exactly as-is.

**Before:**
```ts
// On error:
const loginUrl = new URL('/login', request.url)
loginUrl.searchParams.set('error', `oauth-${errorParam}`)
return NextResponse.redirect(loginUrl)
// ... (5 more error branches, all redirect to /login)

// On success:
const response = NextResponse.redirect(new URL('/', request.url))
```

**After:**
```ts
// On error:
const callbackUrl = new URL('/auth/callback', request.url)
callbackUrl.searchParams.set('error', `oauth-${errorParam}`)
return NextResponse.redirect(callbackUrl)
// ... (5 more error branches, all redirect to /auth/callback)

// On success:
const response = NextResponse.redirect(
  new URL('/auth/callback?status=success', request.url)
)
```

**Backwards compat:** the login page's `OAuthError` banner (which reads
`?error=` from `useSearchParams`) stays in place. Users who bookmark
`/login?error=oauth-...` or arrive there via any other redirect see the
existing behavior — graceful degradation.

## Login page additions

Two cross-links added to the existing `login/page.tsx`. Both are small
visual additions, no structural changes.

**Below the OAuth button** (around line 188, after the `oauthHint`
paragraph):

```tsx
<p className="text-xs text-muted-foreground text-center mt-3">
  {t.rich('newHereCreateAccount', {
    link: (chunks) => (
      <Link href="/signup" className="text-primary hover:underline">
        {chunks}
      </Link>
    ),
  })}
</p>
```

**Inside the PAT details, after the token field** (around line 291,
after the `tokenHint` paragraph):

```tsx
<p className="text-xs text-muted-foreground mt-1">
  <Link href="/forgot-token" className="text-primary hover:underline">
    {t('forgotGiteaUrl')}
  </Link>
</p>
```

Both follow the existing secondary-copy style. No new client logic.

## i18n

### Integration with existing infra

- Uses the same `next-intl` v4 setup: `apps/web/src/i18n/request.ts`
  (which now correctly uses `getMessageFallback` per the recent fix)
- No config changes needed — `getRequestConfig` auto-loads the whole
  locale message file, so adding new top-level keys just works
- Same locales: en, es, zh
- Same fallback policy: missing keys render as the key string itself
  (e.g. `auth.signup.headline` if `es.json` doesn't have the key)

### New `auth` namespace

Top-level key in `apps/web/messages/{en,es,zh}.json`. Sub-namespaces
mirror the page structure:

```json
{
  "auth": {
    "login": {
      "newHereCreateAccount": "New here? {link} →",
      "forgotGiteaUrl": "Forgot your Gitea URL?"
    },
    "signup": {
      "headline": "Don't have an account yet?",
      "subhead": "forge-git uses your Gitea instance for everything...",
      "step1Title": "1. Get a Gitea account",
      "step1PublicTitle": "Sign up at a public instance",
      "step1PublicDesc": "Use a hosted Gitea service. Free, no setup.",
      "step1SelfHostTitle": "Self-host Gitea",
      "step1SelfHostDesc": "Run your own instance. Full control.",
      "step1TeamTitle": "Ask your team admin",
      "step1TeamDesc": "Most teams have a shared Gitea instance.",
      "step2Title": "2. Create a personal access token",
      "step2Cta": "Open Gitea token settings",
      "backToSignIn": "Already have an account? Sign in →"
    },
    "forgotToken": {
      "headline": "Forgot your Gitea URL?",
      "subhead": "The address of the Gitea instance you sign in to...",
      "checkBrowserTitle": "Check your browser",
      "checkBrowserSaved": "We saved this from a previous sign-in on this device.",
      "checkBrowserEmpty": "Nothing saved on this device. Try the suggestions below or ask your team.",
      "whereToFindTitle": "Where to find it",
      "whereToFindEmail": "Check the email invite from your team admin",
      "whereToFindTeammate": "Ask a teammate for the URL they use",
      "whereToFindHistory": "Search your browser history for \"gitea\" or \"forge\"",
      "whereToFindWiki": "Check your team's wiki or runbook",
      "foundItSignIn": "Found it? Sign in →"
    },
    "callback": {
      "signingInHeadline": "Signing you in…",
      "signingInSubhead": "Finishing your Gitea session",
      "errorHeadline": "We couldn't sign you in",
      "errorSubhead": "Something went wrong completing your Gitea session.",
      "tryAgain": "Try again"
    }
  }
}
```

The existing `login.oauthError.*` map (10 keys) is reused by the
callback page's error state via `useTranslations('login')` in a small
inline helper component — no duplication.

**`es.json` and `zh.json`:** ship with English placeholders for all new
keys. Per the existing `MISSING_MESSAGE → key` fallback (now correctly
implemented via `getMessageFallback`), the UI degrades to the key text
rather than crashing. Translations can be added in a follow-up.

## Error handling

### Signup / Forgot-token (mostly static content)

The only "error" case is no Gitea URL remembered for the "Create token"
CTA. Handled by the existing fallback to docs.gitea.com (graceful
degradation, no banner needed).

### Callback page

Three error sources, three render paths:

**E1. Unknown `?error=` key** — `useTranslations` throws if key
missing. Catch in a try/catch, fall back to a generic message:

```tsx
let message: string
try {
  message = tLogin(`oauthError.${error}` as const)
} catch {
  message = tLogin('oauthError.unknown', { error })
}
```

**E2. Missing `?error=` and no `?status=success`** — defaults to
loading state. If neither is present (user navigates directly to
`/auth/callback` with no params), show the spinner indefinitely. After
3s, the useEffect should redirect to `/login` as a safety net (don't
trap users on a page that does nothing).

**E3. Server route error** — when `/api/auth/callback` itself
crashes, the Next.js error boundary catches it. The user sees the
generic 500 page. The new `?error=callback-failed` redirect path is
for known/handled errors only.

### URL health check failures are NOT errors

The signup page's "Create token" CTA goes to Gitea regardless of
network status. If Gitea is down, the user finds out when they get
there — same as clicking any external link.

### Accessibility

- Error card on `/auth/callback`: `role="alert"`, `aria-live="polite"`
  on the error message span
- Spinner: `role="status"`, `aria-live="polite"` on the parent
- Spinner has accessible label: `sr-only` "Signing you in"
- All external links get `rel="noopener"` (already standard for the
  brand pattern)
- `<Link>` to `/login` on the error card uses a `<Button asChild>` so
  it's keyboard-focusable as a button but semantically still a link

## Testing

### Update `apps/web/e2e/auth.spec.ts`

| Test | Change |
|---|---|
| `login page renders the sign in form` | Add assertions for the two new cross-links |
| `login page PAT form is behind details toggle` | No change (still works) |

### New tests to add

1. `signup page renders helper content` — navigate to `/signup`,
   assert headline + 3 option cards visible + "Back to sign in" link
2. `forgot-token page shows empty state without localStorage` —
   navigate to `/forgot-token`, assert the "Nothing saved" message
3. `forgot-token page shows remembered URL with localStorage` —
   addInitScript sets the storage key, navigate, assert URL displayed
   + Copy button
4. `forgot-token page copy button works` — click copy, assert icon
   swap (uses existing clipboard permissions in playwright config)
5. `callback page shows signing in state` — navigate to
   `/auth/callback`, assert spinner + headline (no auto-redirect
   because no `?status=success` in this test)
6. `callback page shows error card on ?error=oauth-token-invalid` —
   assert error headline + translated error message + "Try again"
   button
7. `callback page redirects on ?status=success` — navigate, wait for
   redirect to `/repositories` (will trigger auth redirect since no
   session, lands on `/login` — assert this chain)

### Update `apps/web/e2e/oauth.spec.ts`

Find the test that asserts the OAuth error redirect lands on
`/login?error=`. Update the assertion to expect `/auth/callback?error=`
instead. The test now needs to also assert the new page renders
correctly (delegated to the new `auth.spec.ts` callback tests).

### New i18n keys test

Add a small smoke test in `auth.spec.ts`:

8. `auth pages render in all 3 locales` — loop over `en`/`es`/`zh`,
   navigate to `/signup`, assert headline is non-empty (catches
   missing translation key breakage)

### Unit tests

None new. The promoted hook is a thin move, identical behavior. The
shared `AuthShell` is a pure presentational server component, not
worth a unit test (e2e covers it).

### Manual browser check

- Full OAuth round trip: requires real Gitea instance with OAuth
  configured. Document in PR description that this was not exercised
  in CI.
- Mobile: resize browser to 375px width, navigate to each new page,
  confirm single-column layout renders.

## Files touched

| File | Change |
|---|---|
| `apps/web/src/app/signup/page.tsx` | **New** — client component |
| `apps/web/src/app/forgot-token/page.tsx` | **New** — client component |
| `apps/web/src/app/auth/callback/page.tsx` | **New** — client component |
| `apps/web/src/app/api/auth/callback/route.ts` | **Modified** — redirect targets |
| `apps/web/src/app/login/page.tsx` | **Modified** — extract shell, add 2 links, import from new locations |
| `apps/web/src/components/auth/auth-shell.tsx` | **New** — server component (AuthShell + BrandAside + GlassCard) |
| `apps/web/src/lib/auth/use-gitea-url-memory.ts` | **New** — promoted from login |
| `apps/web/messages/en.json` | **Modified** — add `auth` namespace (~30 keys) |
| `apps/web/messages/es.json` | **Modified** — add `auth` namespace (English placeholders) |
| `apps/web/messages/zh.json` | **Modified** — add `auth` namespace (English placeholders) |
| `apps/web/e2e/auth.spec.ts` | **Modified** — 2 existing test updates + 8 new tests |
| `apps/web/e2e/oauth.spec.ts` | **Modified** — 1 test update (redirect target) |

## What's NOT in scope

- Self-service password reset (delegated to Gitea)
- Self-service account creation (delegated to Gitea)
- PKCE flow changes (no changes to `/api/auth/authorize`)
- Session refresh logic (no changes to `lib/session.ts`)
- Brand panel customization per page (all 4 use the same brand aside)
- Mobile-specific layout beyond column collapse
- Translated copy for `es.json` / `zh.json` (English placeholders only)
- Visual regression infrastructure
- Unit tests for the promoted hook (e2e coverage is sufficient)

## Open questions for the user

None — the design follows the established login page patterns and
the user's scope answers above.
