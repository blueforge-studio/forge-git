# Auth Helper Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three auth-adjacent pages (`/signup`, `/forgot-token`, `/auth/callback`), extract a shared `AuthShell` layout and `useGiteaUrlMemory` hook from the login page, and refactor the OAuth callback server route to redirect through the new callback page.

**Architecture:** New pages are client components following the login redesign patterns (two-column layout, glass card, i18n via `useTranslations`). The brand aside and glass card structure move into a shared server-component `AuthShell`. The `useGiteaUrlMemory` hook gets promoted from `login/page.tsx` to `lib/auth/` (its 3rd consumer now exists). The OAuth callback server route changes its redirect targets from `/` and `/login?error=…` to `/auth/callback?status=success` and `/auth/callback?error=…`. The login page keeps its `OAuthError` banner for backwards-compatible direct visits to `/login?error=…`.

**Tech Stack:** Next.js 16.2.4 (App Router, Turbopack), React 19, TypeScript, Tailwind 4, next-intl v4.13.0 (en/es/zh), Playwright 1.60.0 (e2e), Vitest (unit), Lucide icons. Same as the login redesign.

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `apps/web/src/lib/auth/use-gitea-url-memory.ts` | NEW | Promoted from login/page.tsx. localStorage read/write for `forge-git:last-gitea-url`. |
| `apps/web/src/components/auth/auth-shell.tsx` | NEW | Server component. Two-column `<main>` + brand aside + glass card wrapper. |
| `apps/web/src/app/signup/page.tsx` | NEW | Client. 3 option cards for getting a Gitea account. |
| `apps/web/src/app/forgot-token/page.tsx` | NEW | Client. localStorage URL recovery + 4 hint bullets. |
| `apps/web/src/app/auth/callback/page.tsx` | NEW | Client. Three states: loading, success (auto-redirect), error card. |
| `apps/web/src/app/api/auth/callback/route.ts` | MODIFY | Change 7 redirect targets from `/login` to `/auth/callback`. |
| `apps/web/src/app/login/page.tsx` | MODIFY | Use AuthShell, import hook from new location, add 2 cross-links. |
| `apps/web/messages/en.json` | MODIFY | Add `auth` namespace (30 keys). |
| `apps/web/messages/es.json` | MODIFY | Add `auth` namespace (English placeholders). |
| `apps/web/messages/zh.json` | MODIFY | Add `auth` namespace (English placeholders). |
| `apps/web/e2e/auth.spec.ts` | MODIFY | Add 8 new tests, update 1 existing assertion. |
| `apps/web/e2e/oauth.spec.ts` | MODIFY | Update 1 test redirect target. |

---

## Task 1: Promote `useGiteaUrlMemory` to `lib/auth/`

**Files:**
- Create: `apps/web/src/lib/auth/use-gitea-url-memory.ts`
- Modify: `apps/web/src/app/login/page.tsx`

- [ ] **Step 1: Create the new hook module**

Create `apps/web/src/lib/auth/use-gitea-url-memory.ts` with the exact implementation currently in `apps/web/src/app/login/page.tsx` (lines 11-39, the `GITEA_URL_STORAGE_KEY` constant and the `useGiteaUrlMemory` function):

```ts
'use client'

import { useState, useEffect, useCallback } from 'react'

const GITEA_URL_STORAGE_KEY = 'forge-git:last-gitea-url'

export function useGiteaUrlMemory() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(GITEA_URL_STORAGE_KEY)
      if (stored) setUrl(stored)
    } catch {
      // private browsing / quota — degrade silently
    }
  }, [])

  const persist = useCallback((value: string) => {
    setUrl(value)
    try {
      if (value) {
        window.localStorage.setItem(GITEA_URL_STORAGE_KEY, value)
      } else {
        window.localStorage.removeItem(GITEA_URL_STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  return { url, setUrl: persist }
}
```

Note: this is `'use client'` so it can use `useEffect`/`useState`. The `'use client'` directive is required because consumers are client components.

- [ ] **Step 2: Update `login/page.tsx` to import from the new location**

In `apps/web/src/app/login/page.tsx`:
- Remove the local `GITEA_URL_STORAGE_KEY` constant (line 11) and the entire `useGiteaUrlMemory` function (lines 13-39)
- Add an import: `import { useGiteaUrlMemory } from '@/lib/auth/use-gitea-url-memory'`
- Keep the `'use client'` directive at the top of the file

The usage on line 102 (`const { url: rememberedUrl, setUrl: persistUrl } = useGiteaUrlMemory()`) stays unchanged.

- [ ] **Step 3: Run existing auth e2e tests to confirm no behavior change**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts`
Expected: 13/13 tests pass (same as before this task).

- [ ] **Step 4: Run unit tests**

Run: `cd apps/web && pnpm test`
Expected: 183/183 pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/auth/use-gitea-url-memory.ts apps/web/src/app/login/page.tsx
git commit -m "refactor(auth): promote useGiteaUrlMemory to lib/auth"
```

---

## Task 2: Extract `AuthShell` component and refactor login to use it

**Files:**
- Create: `apps/web/src/components/auth/auth-shell.tsx`
- Modify: `apps/web/src/app/login/page.tsx`

- [ ] **Step 1: Create the AuthShell component**

Create `apps/web/src/components/auth/auth-shell.tsx`:

```tsx
import Link from 'next/link'

export function AuthShell({
  tagline,
  children,
}: {
  tagline: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <BrandAside tagline={tagline} />
      <section className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-[420px]">
          <GlassCard>{children}</GlassCard>
        </div>
      </section>
    </main>
  )
}

function BrandAside({ tagline }: { tagline: string }) {
  return (
    <aside className="hidden md:flex md:w-2/5 relative overflow-hidden bg-gradient-to-br from-primary/20 via-purple-500/15 to-pink-500/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,80,200,0.15),transparent_60%)]" />
      <div className="relative z-10 flex flex-col justify-center px-12 py-16 max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <img
            src="/images/logo-mark.webp"
            alt="Forge git"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-semibold text-xl text-foreground">Forge git</span>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          {tagline}
        </h2>
      </div>
    </aside>
  )
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card p-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
      <div className="md:hidden text-center mb-6 mt-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <img
            src="/images/logo-mark.webp"
            alt="Forge git"
            width={24}
            height={24}
            className="rounded"
          />
          <span className="font-semibold text-foreground">Forge git</span>
        </Link>
      </div>
      {children}
    </div>
  )
}
```

This is a server component (no `'use client'` directive). The BrandAside and GlassCard are local subcomponents in the same file because there are only 4 consumers — promote to separate files if a 5th appears.

- [ ] **Step 2: Refactor `login/page.tsx` to use AuthShell**

In `apps/web/src/app/login/page.tsx`:
- Add import: `import { AuthShell } from '@/components/auth/auth-shell'`
- Replace the outer `<main>...</main>` and its two children (the `<aside>` brand panel + the `<section>` auth surface + its inner `<div className="w-full max-w-[420px]"><div className="glass-card...">...</div></div>`) with `<AuthShell tagline={t('tagline')}>...inner content...</AuthShell>`
- The inner content is everything currently inside `<div className="glass-card p-10 relative overflow-hidden">...</div>`, minus the absolute gradient top border div and the mobile brand header (both now in GlassCard)
- Remove the imports that are no longer used: `Link` (no longer needed for the brand Link at the top — only used in the new "Create account" / "Forgot URL" cross-links added in Task 8), the `cn` import (still needed? — check)

Keep these imports: `useActionState, Suspense, useEffect, useState, useCallback`, the `login` action, the lucide icons, `Button, cn` from `@forge-git/ui`, `useSearchParams` from `next/navigation`, `useTranslations` from `next-intl`.

After refactor, the JSX structure is roughly:

```tsx
return (
  <AuthShell tagline={t('tagline')}>
    <Suspense>
      <OAuthError />
    </Suspense>

    {/* OAuth button */}
    <div className="space-y-2 mb-5">
      <Link href="/api/auth/authorize" className="btn-glow w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium group">
        <LogIn className="w-4 h-4" />
        {t('oauthButton')}
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <p className="text-xs text-muted-foreground text-center">{t('oauthHint')}</p>
    </div>

    {/* ... rest unchanged ... */}
  </AuthShell>
)
```

- [ ] **Step 3: Run existing auth e2e tests to confirm no behavior change**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts`
Expected: 13/13 tests pass. The visible output is byte-for-byte equivalent — same brand aside, same glass card, same form.

- [ ] **Step 4: Run unit tests**

Run: `cd apps/web && pnpm test`
Expected: 183/183 pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/auth/auth-shell.tsx apps/web/src/app/login/page.tsx
git commit -m "refactor(auth): extract AuthShell component for shared layout"
```

---

## Task 3: Add i18n `auth` namespace to en/es/zh

**Files:**
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/es.json`
- Modify: `apps/web/messages/zh.json`

- [ ] **Step 1: Add the `auth` namespace and the 2 new `login` keys to `en.json`**

Open `apps/web/messages/en.json`. Find the top-level `login` key (it's near the end of the file).

**1a. Add the 2 new keys to the existing `login` namespace.** Find the `login` object's `}` and add the 2 keys just before it:

```json
  "login": {
    ...existing keys...,
    "newHereCreateAccount": "New here? Create a Gitea account →",
    "forgotGiteaUrl": "Forgot your Gitea URL?"
  },
```

**1b. Add the new `auth` namespace** AFTER `login`. Paste this between the closing `}` of the `login` namespace and the closing `}` of the top-level object:

```json
  "auth": {
    "signup": {
      "brandTagline": "Get a Gitea account",
      "headline": "Don't have an account yet?",
      "subhead": "forge-git uses your Gitea instance for everything — repos, auth, identity. You'll need a Gitea account to sign in.",
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
      "brandTagline": "Find your Gitea URL",
      "headline": "Forgot your Gitea URL?",
      "subhead": "The address of the Gitea instance you sign in to. Often looks like https://git.yourcompany.com",
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
      "brandTagline": "Welcome back",
      "signingInHeadline": "Signing you in…",
      "signingInSubhead": "Finishing your Gitea session",
      "errorHeadline": "We couldn't sign you in",
      "errorSubhead": "Something went wrong completing your Gitea session.",
      "tryAgain": "Try again"
    }
  },
```

**Namespace decision:** the 2 new cross-link keys go in the EXISTING `login` namespace (since the login page already uses `useTranslations('login')` and would have to be refactored otherwise). The 3 new page namespaces go under a new top-level `auth` key.

Make sure the trailing comma after the `auth` block closing `}` is correct (it needs to separate from whatever key comes next in the file, or be the last key).

- [ ] **Step 2: Add the same keys to `es.json` (English placeholders)**

Open `apps/web/messages/es.json`. Find the `login` namespace (the file mirrors `en.json`'s structure). Add the 2 new keys (`newHereCreateAccount`, `forgotGiteaUrl`) to the existing `login` namespace, then add the `auth` block verbatim from `en.json`. Per the spec, `es.json` ships with English placeholders.

- [ ] **Step 3: Add the same keys to `zh.json` (English placeholders)**

Open `apps/web/messages/zh.json`. Same as Step 2 — add the 2 keys to `login` and copy the `auth` block from `en.json` verbatim.

- [ ] **Step 4: Validate JSON is well-formed**

Run: `cd apps/web && node -e "JSON.parse(require('fs').readFileSync('messages/en.json'));JSON.parse(require('fs').readFileSync('messages/es.json'));JSON.parse(require('fs').readFileSync('messages/zh.json'));console.log('all valid')"`
Expected: `all valid`

- [ ] **Step 5: Verify all 32 keys exist in all 3 locales**

Run this from `apps/web`:

```bash
node -e "
const en = require('./messages/en.json');
const es = require('./messages/es.json');
const zh = require('./messages/zh.json');
const keys = ['login.newHereCreateAccount','login.forgotGiteaUrl','auth.signup.brandTagline','auth.signup.headline','auth.signup.subhead','auth.signup.step1Title','auth.signup.step1PublicTitle','auth.signup.step1PublicDesc','auth.signup.step1SelfHostTitle','auth.signup.step1SelfHostDesc','auth.signup.step1TeamTitle','auth.signup.step1TeamDesc','auth.signup.step2Title','auth.signup.step2Cta','auth.signup.backToSignIn','auth.forgotToken.brandTagline','auth.forgotToken.headline','auth.forgotToken.subhead','auth.forgotToken.checkBrowserTitle','auth.forgotToken.checkBrowserSaved','auth.forgotToken.checkBrowserEmpty','auth.forgotToken.whereToFindTitle','auth.forgotToken.whereToFindEmail','auth.forgotToken.whereToFindTeammate','auth.forgotToken.whereToFindHistory','auth.forgotToken.whereToFindWiki','auth.forgotToken.foundItSignIn','auth.callback.brandTagline','auth.callback.signingInHeadline','auth.callback.signingInSubhead','auth.callback.errorHeadline','auth.callback.errorSubhead','auth.callback.tryAgain'];
const get = (o,k) => k.split('.').reduce((a,i)=>a?.[i],o);
for (const locale of [['en',en],['es',es],['zh',zh]]) {
  for (const k of keys) {
    if (!get(locale[1],k)) { console.error('MISSING',locale[0],k); process.exit(1); }
  }
}
console.log('all 33 keys present in all 3 locales');
"
```

Expected: `all 33 keys present in all 3 locales` (2 new in `login` + 31 in `auth` = 33).

- [ ] **Step 6: Commit**

```bash
git add apps/web/messages/en.json apps/web/messages/es.json apps/web/messages/zh.json
git commit -m "i18n: add auth namespace (login/signup/forgotToken/callback) to en/es/zh"
```

---

## Task 4: Signup page

**Files:**
- Create: `apps/web/src/app/signup/page.tsx`
- Modify: `apps/web/e2e/auth.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Open `apps/web/e2e/auth.spec.ts`. Find the last test in the `test.describe('Unauthenticated pages', ...)` block (the most recently added one before this task). Add a new test inside the same `test.describe` block:

```ts
test('signup page renders helper content', async ({ page }) => {
  await page.goto('/signup')
  await expect(page.getByRole('heading', { name: /don't have an account yet/i })).toBeVisible()
  await expect(page.getByText(/sign up at a public instance/i)).toBeVisible()
  await expect(page.getByText(/self-host gitea/i)).toBeVisible()
  await expect(page.getByText(/ask your team admin/i)).toBeVisible()
  await expect(page.getByText(/create a personal access token/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /sign in/i }).last()).toBeVisible()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "signup page renders helper content"`
Expected: FAIL — navigation to `/signup` returns 404 (page doesn't exist yet).

- [ ] **Step 3: Implement the signup page**

Create `apps/web/src/app/signup/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Globe, Server, Users, ChevronRight, Key, ArrowRight } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { useGiteaUrlMemory } from '@/lib/auth/use-gitea-url-memory'

export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const tLogin = useTranslations('login')
  const { url: rememberedUrl } = useGiteaUrlMemory()

  const tokenSettingsHref = rememberedUrl
    ? `${rememberedUrl}/user/settings/applications`
    : 'https://docs.gitea.com/administration/config-cheat-sheet/'

  return (
    <AuthShell tagline={t('brandTagline')}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground text-center">
        {t('headline')}
      </h1>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed text-center mb-6">
        {t('subhead')}
      </p>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('step1Title')}
        </h2>
        <OptionCard
          href="https://codeberg.org/user/sign_up"
          icon={<Globe className="w-4 h-4" />}
          title={t('step1PublicTitle')}
          description={t('step1PublicDesc')}
        />
        <OptionCard
          href="https://docs.gitea.com/installation/install-from-binary"
          icon={<Server className="w-4 h-4" />}
          title={t('step1SelfHostTitle')}
          description={t('step1SelfHostDesc')}
        />
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
          <Users className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{t('step1TeamTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('step1TeamDesc')}</p>
          </div>
        </div>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('step2Title')}
        </h2>
        <a
          href={tokenSettingsHref}
          target="_blank"
          rel="noopener"
          data-testid="open-token-settings"
          className="btn-glow w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium group"
        >
          <Key className="w-4 h-4" />
          {t('step2Cta')}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        {tLogin.rich('oauthHint', {
          // intentionally fallback to login.oauthHint wording style — we reuse the existing copy shape
        })}{' '}
        <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-0.5">
          {t('backToSignIn')}
        </Link>
      </p>
    </AuthShell>
  )
}

function OptionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors"
    >
      <div className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  )
}
```

Note: the `tLogin.rich('oauthHint', {})` line is a placeholder for the back-link area. The intent is: show the "back to sign in" link. The `tLogin` import is needed for that. If `oauthHint` isn't the right key to reuse, simplify: drop the `tLogin` import entirely and use just `<Link href="/login">{t('backToSignIn')}</Link>` inside a `<p>` tag. The implementer can simplify if needed.

Simplified cleaner version of the bottom paragraph:

```tsx
<p className="text-xs text-muted-foreground text-center mt-6">
  <Link href="/login" className="text-primary hover:underline">
    {t('backToSignIn')}
  </Link>
</p>
```

Use this simplified version. Drop the `tLogin` import.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "signup page renders helper content"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/signup/page.tsx apps/web/e2e/auth.spec.ts
git commit -m "feat(auth): add /signup helper page with Gitea signup options"
```

---

## Task 5: Forgot-token page

**Files:**
- Create: `apps/web/src/app/forgot-token/page.tsx`
- Modify: `apps/web/e2e/auth.spec.ts`

- [ ] **Step 1: Write the failing e2e tests**

Open `apps/web/e2e/auth.spec.ts`. Add 3 new tests inside the `Unauthenticated pages` block (right after the signup test from Task 4):

```ts
test('forgot-token page shows empty state without localStorage', async ({ page }) => {
  await page.goto('/forgot-token')
  await expect(page.getByRole('heading', { name: /forgot your gitea url/i })).toBeVisible()
  await expect(page.getByText(/nothing saved on this device/i)).toBeVisible()
  await expect(page.getByText(/check the email invite/i)).toBeVisible()
  await expect(page.getByText(/ask a teammate/i)).toBeVisible()
  await expect(page.getByText(/search your browser history/i)).toBeVisible()
  await expect(page.getByText(/check your team's wiki/i)).toBeVisible()
})

test('forgot-token page shows remembered URL with localStorage', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('forge-git:last-gitea-url', 'https://git.example.com')
  })
  await page.goto('/forgot-token')
  await expect(page.getByRole('heading', { name: /forgot your gitea url/i })).toBeVisible()
  await expect(page.getByText(/we saved this from a previous sign-in/i)).toBeVisible()
  await expect(page.getByText('https://git.example.com')).toBeVisible()
  await expect(page.getByTestId('copy-code-button')).toBeVisible()
})

test('forgot-token page copy button works', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    window.localStorage.setItem('forge-git:last-gitea-url', 'https://git.example.com')
  })
  await page.goto('/forgot-token')
  const copyButton = page.getByTestId('copy-code-button')
  await copyButton.click()
  await expect(copyButton).toContainText(/copied/i)
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboardText).toBe('https://git.example.com')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "forgot-token"`
Expected: 3/3 FAIL — navigation to `/forgot-token` returns 404.

- [ ] **Step 3: Implement the forgot-token page**

Create `apps/web/src/app/forgot-token/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, MessageCircle, Search, BookOpen, Clipboard, Check } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { useGiteaUrlMemory } from '@/lib/auth/use-gitea-url-memory'

const HINT_ICONS = [Mail, MessageCircle, Search, BookOpen] as const
const HINT_KEYS = [
  'whereToFindEmail',
  'whereToFindTeammate',
  'whereToFindHistory',
  'whereToFindWiki',
] as const

export default function ForgotTokenPage() {
  const t = useTranslations('auth.forgotToken')
  const tLogin = useTranslations('login')
  const { url: rememberedUrl } = useGiteaUrlMemory()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <AuthShell tagline={t('brandTagline')}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground text-center">
        {t('headline')}
      </h1>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed text-center mb-6">
        {t('subhead')}
      </p>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('checkBrowserTitle')}
        </h2>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          {mounted && rememberedUrl ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                {t('checkBrowserSaved')}
              </p>
              <UrlCodeBlock url={rememberedUrl} copyLabel={tLogin('copyCode')} copiedLabel={tLogin('copyCodeCopied')} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('checkBrowserEmpty')}
            </p>
          )}
        </div>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('whereToFindTitle')}
        </h2>
        <ul className="space-y-2">
          {HINT_KEYS.map((key, i) => {
            const Icon = HINT_ICONS[i]
            return (
              <li
                key={key}
                data-testid={`hint-${key}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background"
              >
                <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{t(key)}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        <Link href="/login" className="text-primary hover:underline">
          {t('foundItSignIn')}
        </Link>
      </p>
    </AuthShell>
  )
}

function UrlCodeBlock({
  url,
  copyLabel,
  copiedLabel,
}: {
  url: string
  copyLabel: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — ignore
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <code className="bg-background px-2 py-1 rounded text-xs font-mono border border-border">
        {url}
      </code>
      <button
        type="button"
        onClick={onCopy}
        data-testid="copy-code-button"
        aria-label={copyLabel}
        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
        {copied ? copiedLabel : copyLabel}
      </button>
    </span>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "forgot-token"`
Expected: 3/3 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/forgot-token/page.tsx apps/web/e2e/auth.spec.ts
git commit -m "feat(auth): add /forgot-token page with URL recovery and hints"
```

---

## Task 6: Auth callback page

**Files:**
- Create: `apps/web/src/app/auth/callback/page.tsx`
- Modify: `apps/web/e2e/auth.spec.ts`

- [ ] **Step 1: Write the failing e2e tests**

Open `apps/web/e2e/auth.spec.ts`. Add 3 new tests inside the `Unauthenticated pages` block:

```ts
test('callback page shows signing in state', async ({ page }) => {
  await page.goto('/auth/callback')
  await expect(page.getByRole('heading', { name: /signing you in/i })).toBeVisible()
  await expect(page.getByText(/finishing your gitea session/i)).toBeVisible()
})

test('callback page shows error card on oauth error', async ({ page }) => {
  await page.goto('/auth/callback?error=oauth-token-invalid')
  await expect(page.getByRole('heading', { name: /couldn't sign you in/i })).toBeVisible()
  await expect(page.getByRole('alert').or(page.locator('[role="alert"]'))).toContainText(/invalid token/i)
  await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
})

test('callback page redirects to login on unknown state', async ({ page }) => {
  // No ?status=success and no ?error= — should redirect to /login after 3s safety net
  await page.goto('/auth/callback')
  // The 600ms success redirect won't fire (no ?status=success), but the 3s safety net will
  await page.waitForURL(/\/login/, { timeout: 5000 })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "callback page"`
Expected: 3/3 FAIL — navigation to `/auth/callback` returns 404.

- [ ] **Step 3: Implement the auth callback page**

Create `apps/web/src/app/auth/callback/page.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { XCircle } from 'lucide-react'
import { Button } from '@forge-git/ui'
import { AuthShell } from '@/components/auth/auth-shell'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth.callback')
  const tLogin = useTranslations('login')

  const error = searchParams.get('error')
  const status = searchParams.get('status')

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => router.replace('/repositories'), 600)
      return () => clearTimeout(timer)
    }
    if (!error && !status) {
      // No params at all — direct visit. Safety net: redirect to /login after 3s.
      const timer = setTimeout(() => router.replace('/login'), 3000)
      return () => clearTimeout(timer)
    }
  }, [error, status, router])

  let errorMessage: string
  if (error) {
    try {
      errorMessage = tLogin(`oauthError.${error}` as never)
    } catch {
      errorMessage = tLogin('oauthError.unknown', { error })
    }
  }

  if (error) {
    return (
      <div className="text-center" data-testid="callback-error">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('errorHeadline')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {t('errorSubhead')}
        </p>
        <p
          role="alert"
          aria-live="polite"
          className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 mt-4"
        >
          {errorMessage}
        </p>
        <Button asChild className="mt-6 w-full h-11">
          <Link href="/login" data-testid="callback-try-again">
            {t('tryAgain')}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center" data-testid="callback-loading">
      <div
        role="status"
        aria-live="polite"
        className="mx-auto w-10 h-10 rounded-full border-2 border-muted border-t-primary animate-spin mb-4"
      />
      <span className="sr-only">{t('signingInHeadline')}</span>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t('signingInHeadline')}
      </h1>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
        {t('signingInSubhead')}
      </p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <AuthShell tagline="">
      <Suspense fallback={null}>
        <CallbackContent />
      </Suspense>
    </AuthShell>
  )
}

import { Suspense } from 'react'
```

Note: the `import { Suspense } from 'react'` should be at the TOP of the file with the other imports, not the bottom. Move it up.

Corrected import section (top of file):

```tsx
'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { XCircle } from 'lucide-react'
import { Button } from '@forge-git/ui'
import { AuthShell } from '@/components/auth/auth-shell'
```

Remove the duplicate `import { Suspense } from 'react'` at the bottom.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "callback page"`
Expected: 3/3 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/auth/callback/page.tsx apps/web/e2e/auth.spec.ts
git commit -m "feat(auth): add /auth/callback page with loading and error states"
```

---

## Task 7: Refactor OAuth callback server route

**Files:**
- Modify: `apps/web/src/app/api/auth/callback/route.ts`
- Modify: `apps/web/e2e/oauth.spec.ts`

- [ ] **Step 1: Update the 7 redirect targets**

Open `apps/web/src/app/api/auth/callback/route.ts`. Find each occurrence of:

```ts
const loginUrl = new URL('/login', request.url)
loginUrl.searchParams.set('error', `oauth-${errorParam}`)
return NextResponse.redirect(loginUrl)
```

And each variation where the error key is different (e.g. `'oauth-missing-params'`, `'oauth-session-expired'`, etc.). There are 7 such blocks. For each, change the URL from `/login` to `/auth/callback`:

```ts
const callbackUrl = new URL('/auth/callback', request.url)
callbackUrl.searchParams.set('error', `oauth-${errorParam}`)
return NextResponse.redirect(callbackUrl)
```

Note: replace the variable name `loginUrl` with `callbackUrl` for clarity in the new code. If your editor doesn't refactor well, leave the variable name as-is — the URL change is what matters.

The final redirect (success case) also changes:

**Before:**
```ts
const response = NextResponse.redirect(new URL('/', request.url))
```

**After:**
```ts
const response = NextResponse.redirect(
  new URL('/auth/callback?status=success', request.url)
)
```

- [ ] **Step 2: Find and update the test in `oauth.spec.ts` that asserts the old redirect target**

Open `apps/web/e2e/oauth.spec.ts`. Find the test that asserts a redirect lands on `/login?error=...`. It looks something like:

```ts
await expect(page).toHaveURL(/\/login\?error=oauth-/)
```

Update to:

```ts
await expect(page).toHaveURL(/\/auth\/callback\?error=oauth-/)
```

If there are multiple such tests, update all of them. If the test then asserts content that's specific to the login page, remove that assertion (the new content is tested in `auth.spec.ts` callback tests from Task 6).

- [ ] **Step 3: Run the affected tests**

Run: `cd apps/web && npx playwright test e2e/oauth.spec.ts e2e/auth.spec.ts`
Expected: all pass. (The login page's `OAuthError` banner still works for direct `/login?error=` visits, so any other test that navigates to `/login?error=` directly still passes.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/auth/callback/route.ts apps/web/e2e/oauth.spec.ts
git commit -m "refactor(auth): redirect OAuth callback through /auth/callback page"
```

---

## Task 8: Login page additions (cross-links)

**Files:**
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/e2e/auth.spec.ts`

- [ ] **Step 1: Update the existing test assertion**

Open `apps/web/e2e/auth.spec.ts`. Find the `login page renders the sign in form` test. Add two new assertions at the end of that test:

```ts
// New in this task:
await expect(page.getByRole('link', { name: /new here\?.*create a gitea account/i })).toBeVisible()
await expect(page.getByRole('link', { name: /forgot your gitea url\?/i })).toBeVisible()
```

The first link points to `/signup`, the second to `/forgot-token`. Note: the PAT details `<details>` is collapsed by default, so the "Forgot your Gitea URL?" link isn't visible until the details is opened. To assert the link exists, query by role + name without visibility check, OR open the details first.

Update the test to open the PAT details first:

```ts
test('login page renders the sign in form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /sign in with gitea/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /new here\?.*create a gitea account/i })).toBeVisible()

  // Open PAT details to verify the "Forgot your Gitea URL?" link
  await page.getByRole('group').filter({ hasText: /use a personal access token/i }).click()
  await expect(page.getByRole('link', { name: /forgot your gitea url\?/i })).toBeVisible()
})
```

Adjust the locator for the PAT details toggle as needed — match whatever the current implementation uses (`summary` element with text "Use a personal access token", wrapped in `<details>`).

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "login page renders the sign in form"`
Expected: FAIL — the two new links don't exist yet.

- [ ] **Step 3: Add the two cross-links to `login/page.tsx`**

Open `apps/web/src/app/login/page.tsx`. The page uses `useTranslations('login')` and the 2 new keys are in the `login` namespace (added in Task 3), so no i18n changes needed for this step.

Find the OAuth section (after `t('oauthHint')` paragraph). Add a new link below it:

```tsx
<p className="text-xs text-muted-foreground text-center">
  <Link href="/signup" className="text-primary hover:underline">
    {t('newHereCreateAccount')}
  </Link>
</p>
```

Inside the PAT details, after the tokenHint paragraph, add the second link:

```tsx
<p className="text-xs text-muted-foreground mt-1">
  <Link href="/forgot-token" className="text-primary hover:underline">
    {t('forgotGiteaUrl')}
  </Link>
</p>
```

Make sure `Link` is imported (it should be — login/page.tsx still uses Link for the OAuth button).

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "login page renders the sign in form"`
Expected: PASS.

- [ ] **Step 5: Run all auth tests to confirm no regressions**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts`
Expected: all pass (the original 13 + 8 new = 21 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/login/page.tsx apps/web/e2e/auth.spec.ts
git commit -m "feat(auth): add signup and forgot-token cross-links on login page"
```

---

## Task 9: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run all e2e tests**

Run: `cd apps/web && npx playwright test`
Expected: all pass. The auth.spec.ts should have 21 tests (13 original + 8 new), oauth.spec.ts should pass with the updated redirect target assertion.

- [ ] **Step 2: Run all unit tests**

Run: `cd apps/web && pnpm test`
Expected: 183/183 pass (no new unit tests added; existing tests unaffected).

- [ ] **Step 3: Run type check**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep -v "test\.tsx" | head -20`
Expected: no errors in `apps/web/src/`. The pre-existing test-file errors (JSX namespace, GiteaUser, GiteaRepo, Session) are out of scope — ignore them.

- [ ] **Step 4: Run `next build`**

Run: `cd apps/web && npx next build 2>&1 | tail -30`
Expected: build succeeds. The OAuth callback route now redirects to `/auth/callback` which is a valid route, so the dynamic route list includes it.

- [ ] **Step 5: Run i18n smoke test (manual in browser, optional)**

Open `http://localhost:3000/en/signup` and `http://localhost:3000/es/signup` and `http://localhost:3000/zh/signup` (with dev server running). Verify the headlines render in all 3 locales (English copy, since es/zh ship with English placeholders). If any key is missing, the page would show the raw key string (e.g. `auth.signup.headline`) — verify no keys are missing.

- [ ] **Step 6: Commit any verification artifacts**

If any cleanup is needed (e.g. a stray comment, a console.log left in), fix it and commit:

```bash
git status
# (if there are changes)
git add -A
git commit -m "chore: cleanup from final verification"
```

If no changes, skip this step.

---

## Notes for the implementer

- **Order matters**: Tasks 1-3 build shared infrastructure. Tasks 4-6 add the new pages. Task 7 wires up the server route. Task 8 adds login cross-links. Task 9 verifies.
- **i18n namespace decision**: When implementing Task 3, place the new cross-link keys under the top-level `login` namespace (as Task 3 already specifies), not under a new `auth.login.*` sub-namespace. The 3 new page namespaces go under the new top-level `auth` key. This is already reflected in Task 3 — no deviation needed.
- **Test isolation**: Each new page test should be independent. Don't rely on localStorage from a previous test — use `addInitScript` for the localStorage cases.
- **Visual review**: After implementation, navigate the 4 auth pages in a browser at desktop and mobile widths to confirm the two-column / single-column behavior matches the spec.
- **OAuth end-to-end**: This plan does NOT include a full OAuth round-trip test (requires a real Gitea instance). Document this in the PR description.
- **Loading skeletons**: The new pages don't get custom `loading.tsx` files. Next.js will use the default suspense behavior. If a loading skeleton is needed later, add it as a follow-up.
