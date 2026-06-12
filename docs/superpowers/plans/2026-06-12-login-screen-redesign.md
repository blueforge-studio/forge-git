# Login Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/login` with a two-column layout, polished visual hierarchy, and three QoL features (remember Gitea URL, inline URL health check, better setup help). Server auth contract unchanged.

**Architecture:** Single-page rewrite of `apps/web/src/app/login/page.tsx`. Two-column grid (brand panel left, auth card right) on desktop, stacked on mobile. Two small in-file hooks for localStorage and URL health. No new modules, no new server code. i18n added to the login page for the first time (`en`/`es`/`zh`).

**Tech Stack:** Next.js 16, React 19, Tailwind 4, `@forge-git/ui` (Input, Button), `next-intl` (`useTranslations`), `iron-session` (unchanged), Playwright (e2e).

**Working directory:** All paths are relative to repo root (`/Users/kmandrup/Projects/Repos/forge-git/`). The dev server is already running on port 3008 from the brainstorming phase; the playwright config uses port 3344 for its own server.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `apps/web/src/app/login/page.tsx` | Rewrite | Two-column layout, brand panel, auth card, all hooks, all new copy |
| `apps/web/src/app/login/loading.tsx` | Rewrite | Two-column skeleton matching new layout |
| `apps/web/e2e/auth.spec.ts` | Modify | Update existing assertions, add 6 new tests |
| `apps/web/playwright.config.ts` | Modify | Add clipboard permissions to chromium project |
| `apps/web/messages/en.json` | Modify | Add `login` namespace |
| `apps/web/messages/es.json` | Modify | Add `login` namespace |
| `apps/web/messages/zh.json` | Modify | Add `login` namespace |

No new files. No new components. No new modules. All client logic lives inside `page.tsx`.

---

## Task 1: Add i18n keys (en, es, zh)

**Files:**
- Modify: `apps/web/messages/en.json` (add `login` block before the closing `}`)
- Modify: `apps/web/messages/es.json` (add `login` block, English placeholders are fine — `MISSING_MESSAGE` handler falls back to the key)
- Modify: `apps/web/messages/zh.json` (add `login` block, English placeholders are fine)

- [ ] **Step 1: Add the `login` block to `en.json`**

Open `apps/web/messages/en.json` and add this block at the end (just before the final `}`), separated by a comma from the previous block:

```json
,
"login": {
  "tagline": "Self-hosted Git forge CI/CD. One click from your Gitea instance.",
  "headline": "Welcome back",
  "subhead": "Sign in to your forge-git account",
  "oauthButton": "Sign in with Gitea",
  "oauthHint": "One-click sign in. Requires OAuth2 configured in your Gitea instance.",
  "orUsePat": "Or use a personal access token",
  "patSummary": "Use a personal access token",
  "giteaUrlPlaceholder": "https://forge-git.blueforge.studio",
  "tokenPlaceholder": "Paste your token",
  "tokenHint": "Generate one at your Gitea user settings → Applications",
  "submitPat": "Sign in with PAT",
  "submitting": "Signing in...",
  "newHereGetToken": "New here? Get a token →",
  "lastUsedHint": "Last used",
  "urlInvalid": "Use a full URL starting with http:// or https://",
  "urlHealthIdle": "Not yet checked",
  "urlHealthChecking": "Checking…",
  "urlHealthOk": "Connected to Gitea",
  "urlHealthUnreachable": "Unreachable",
  "setupHelpSummary": "Setting up OAuth",
  "setupHelpStep1": "Go to your Gitea instance → Site Administration → Applications → OAuth2 Applications",
  "setupHelpStep2": "Register a new application with redirect URI:",
  "setupHelpRedirect": "/api/auth/callback",
  "setupHelpStep3": "Set the environment variables GITEA_OAUTH_CLIENT_ID and GITEA_OAUTH_CLIENT_SECRET",
  "setupHelpStep4": "Or use the CLI:",
  "setupHelpCli": "fgit token setup-oauth",
  "copyCode": "Copy",
  "copyCodeCopied": "Copied",
  "oauthError": {
    "no-gitea-url": "Gitea URL is not configured. Set GITEA_URL environment variable.",
    "oauth-not-configured": "OAuth is not configured. Set GITEA_OAUTH_CLIENT_ID and GITEA_OAUTH_CLIENT_SECRET.",
    "oauth-session-expired": "Your OAuth session expired. Please try signing in again.",
    "oauth-state-mismatch": "Security check failed. Please try signing in again.",
    "oauth-exchange-failed": "Failed to exchange authorization code. Please try again.",
    "oauth-token-invalid": "Received an invalid token from Gitea. Please try again.",
    "oauth-access_denied": "You denied the authorization request.",
    "oauth-missing-params": "Missing required OAuth parameters. Please try again.",
    "oauth-invalid-state": "Invalid OAuth state. Please try signing in again.",
    "unknown": "Authentication error: {error}"
  }
}
```

- [ ] **Step 2: Add the same `login` block to `es.json`**

Copy the block from Step 1 verbatim. (English placeholders are acceptable — the i18n handler falls back gracefully.)

- [ ] **Step 3: Add the same `login` block to `zh.json`**

Copy the block from Step 1 verbatim. (Same reasoning — placeholder is fine.)

- [ ] **Step 4: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json'))" && node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/es.json'))" && node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/zh.json'))"`
Expected: no output (silent success)

If JSON is invalid, fix the syntax error and re-run.

- [ ] **Step 5: Commit**

```bash
git add apps/web/messages/en.json apps/web/messages/es.json apps/web/messages/zh.json
git commit -m "i18n: add login namespace to en/es/zh"
```

---

## Task 2: Update Playwright config for clipboard permissions

**Files:**
- Modify: `apps/web/playwright.config.ts` (add `permissions` to the `chromium` project)

- [ ] **Step 1: Add clipboard permissions to the chromium project**

In `apps/web/playwright.config.ts`, find the `chromium` project block (the one with `testMatch: /^(?!.*authenticated\/).*\.spec\.ts$/`). Add `permissions: ['clipboard-read', 'clipboard-write']` inside its `use: { ... }` object. The result should look like:

```typescript
{
  name: 'chromium',
  testMatch: /^(?!.*authenticated\/).*\.spec\.ts$/,
  testIgnore: /auth\.setup\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    permissions: ['clipboard-read', 'clipboard-write'],
  },
},
```

- [ ] **Step 2: Validate TypeScript**

Run: `pnpm --filter @forge-git/web exec tsc --noEmit`
Expected: no errors related to playwright.config.ts

- [ ] **Step 3: Commit**

```bash
git add apps/web/playwright.config.ts
git commit -m "test(e2e): grant clipboard permissions for login copy tests"
```

---

## Task 3: Add new e2e tests (failing)

**Files:**
- Modify: `apps/web/e2e/auth.spec.ts` (add 4 new tests inside the existing `Unauthenticated pages` describe block)

These tests will fail until the implementation tasks run. That's the point.

- [ ] **Step 1: Add 4 new tests inside the `Unauthenticated pages` describe block**

In `apps/web/e2e/auth.spec.ts`, after the existing `PAT form shows error with empty fields` test and before `protected pages redirect to login`, insert:

```typescript
  test('login page remembers last Gitea URL from localStorage', async ({ page, context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('forge-git:last-gitea-url', 'https://demo.example.com')
    })
    await page.goto('/login')
    await page.locator('details summary').first().click()
    await expect(page.locator('input[name="giteaUrl"]')).toHaveValue('https://demo.example.com')
  })

  test('login page URL health check shows reachable status', async ({ page }) => {
    await page.route('**/api/v1/version', (route) => route.fulfill({ status: 200, body: '{}' }))
    await page.goto('/login')
    await page.locator('details summary').first().click()
    await page.locator('input[name="giteaUrl"]').fill('https://test-gitea.example.com')
    await page.locator('input[name="giteaUrl"]').blur()
    await expect(page.getByTestId('url-health-pill')).toHaveText(/Connected to Gitea/, { timeout: 5000 })
  })

  test('login page URL health check shows unreachable status', async ({ page }) => {
    await page.route('**/api/v1/version', (route) => route.abort('failed'))
    await page.goto('/login')
    await page.locator('details summary').first().click()
    await page.locator('input[name="giteaUrl"]').fill('https://broken.example.com')
    await page.locator('input[name="giteaUrl"]').blur()
    await expect(page.getByTestId('url-health-pill')).toHaveText(/Unreachable/, { timeout: 5000 })
  })

  test('login page setup help is collapsed by default', async ({ page }) => {
    await page.goto('/login')
    const setupDetails = page.locator('summary', { hasText: 'Setting up OAuth' })
    await expect(setupDetails).toBeVisible()
    // The <details> containing setup help should not be open
    const setupOpen = await setupDetails.evaluate((el) => (el.closest('details') as HTMLDetailsElement).open)
    expect(setupOpen).toBe(false)
  })
```

- [ ] **Step 2: Add the copy button test**

After the 4 tests above, add a 5th:

```typescript
  test('login page setup help copy button copies the code', async ({ page }) => {
    await page.goto('/login')
    // Open setup help
    await page.locator('summary', { hasText: 'Setting up OAuth' }).click()
    // Click the first copy button in setup help
    const copyButton = page.getByTestId('copy-code-button').first()
    await expect(copyButton).toBeVisible()
    await copyButton.click()
    // Button label should flip to "Copied"
    await expect(copyButton).toHaveText(/Copied/, { timeout: 2000 })
  })
```

- [ ] **Step 3: Run the new tests to verify they fail**

Run: `pnpm --filter @forge-git/web exec playwright test --project=chromium -g "remembers last Gitea URL|URL health check|setup help is collapsed|setup help copy" e2e/auth.spec.ts`
Expected: 5 failing tests (all the new ones).

The failure messages should reference the missing functionality (no `input[name="giteaUrl"]` pre-fill, no `url-health-pill` testid, setup help is currently always-visible not in a `<details>`, no copy button). These confirm the tests exercise what we want.

- [ ] **Step 4: Commit the failing tests**

```bash
git add apps/web/e2e/auth.spec.ts
git commit -m "test(e2e): add failing tests for login screen QoL features"
```

---

## Task 4: Update existing e2e tests for new copy (failing)

**Files:**
- Modify: `apps/web/e2e/auth.spec.ts`

These tests will fail until Task 8 (layout rewrite) lands. That's the point.

- [ ] **Step 1: Update the `login page renders the sign in form` test**

Find the test:

```typescript
  test('login page renders the sign in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Sign in to forge-git')).toBeVisible()
    await expect(page.locator('text=Sign in with Gitea')).toBeVisible()
    await expect(page.locator('text=Manual token')).toBeVisible()
  })
```

Replace it with:

```typescript
  test('login page renders the sign in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toHaveText('Welcome back')
    await expect(page.locator('a', { hasText: 'Sign in with Gitea' })).toBeVisible()
    await expect(page.locator('summary', { hasText: 'Use a personal access token' })).toBeVisible()
  })
```

The OAuth button now uses the headline copy "Sign in with Gitea" (no longer "Sign in to forge-git" — that's the headline). The PAT summary now reads "Use a personal access token" (not "Manual token"). These match the i18n keys from Task 1.

- [ ] **Step 2: Update the `login page PAT form is behind details toggle` test**

Find the test that asserts `input[name="giteaUrl"]` is hidden inside a `<details>` then visible after clicking the summary. The test should still work as-is because the structure (PAT behind `<details>`) is preserved. But the summary text changes from "Manual token" to "Use a personal access token". Update any summary locator accordingly. Final form:

```typescript
  test('login page PAT form is behind details toggle', async ({ page }) => {
    await page.goto('/login')
    const details = page.locator('details').filter({ has: page.locator('input[name="giteaUrl"]') })
    await expect(details.locator('input[name="giteaUrl"]')).not.toBeVisible()
    await details.locator('summary').click()
    await expect(page.locator('input[name="giteaUrl"]')).toBeVisible()
    await expect(page.locator('input[name="token"]')).toBeVisible()
  })
```

This filters the `details` locator to the one that *contains* the giteaUrl input, so it doesn't accidentally grab the setup help details.

- [ ] **Step 3: Update the `login page shows OAuth setup instructions` test**

Find the test:

```typescript
  test('login page shows OAuth setup instructions', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Setting up OAuth')).toBeVisible()
  })
```

Replace it with (setup help is now collapsed by default):

```typescript
  test('login page shows OAuth setup instructions', async ({ page }) => {
    await page.goto('/login')
    const summary = page.locator('summary', { hasText: 'Setting up OAuth' })
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(page.locator('text=fgit token setup-oauth')).toBeVisible()
  })
```

- [ ] **Step 4: Run all updated tests to verify they fail**

Run: `pnpm --filter @forge-git/web exec playwright test --project=chromium e2e/auth.spec.ts`
Expected: failures in the 3 updated tests (and the 5 new tests from Task 3). The error messages should reference the new copy not being present.

- [ ] **Step 5: Commit the updated tests**

```bash
git add apps/web/e2e/auth.spec.ts
git commit -m "test(e2e): update login assertions for new copy and structure"
```

---

## Task 5: Implement `useGiteaUrlMemory` hook + URL pre-fill

**Files:**
- Modify: `apps/web/src/app/login/page.tsx` (add hook, use it in the form's URL input)

This is the smallest vertical slice. Once this lands, the "remembers last Gitea URL" test from Task 3 passes.

- [ ] **Step 1: Add the `useGiteaUrlMemory` hook at the top of `page.tsx`** (above `OAuthError`)

```typescript
import { useEffect, useState, useCallback } from 'react'

const GITEA_URL_STORAGE_KEY = 'forge-git:last-gitea-url'

function useGiteaUrlMemory() {
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

- [ ] **Step 2: Use the hook inside `LoginPage`**

In the `LoginPage` function (the default export), at the top of the function body, add:

```typescript
  const { url: rememberedUrl, setUrl: persistUrl } = useGiteaUrlMemory()
  const [giteaUrl, setGiteaUrl] = useState('')

  useEffect(() => {
    if (rememberedUrl) setGiteaUrl(rememberedUrl)
  }, [rememberedUrl])
```

- [ ] **Step 3: Wire the URL input to state and persistence**

Find the URL `<input>` in the PAT form. Replace its existing attributes with:

```tsx
<input
  id="giteaUrl"
  name="giteaUrl"
  type="text"
  placeholder={t('giteaUrlPlaceholder')}
  required
  value={giteaUrl}
  onChange={(e) => {
    setGiteaUrl(e.target.value)
    persistUrl(e.target.value)
  }}
  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
/>
```

Keep the existing classes for now — the layout-rewrite task (Task 8) will adjust them as part of the larger structure change.

Also add the `lastUsedHint` text below the input when `giteaUrl` is non-empty and equal to `rememberedUrl`:

```tsx
{giteaUrl && giteaUrl === rememberedUrl && (
  <p data-testid="last-used-hint" className="text-[10px] text-muted-foreground">
    {t('lastUsedHint')}
  </p>
)}
```

- [ ] **Step 4: Add `t = useTranslations('login')` to the component**

At the top of `LoginPage`, after the `useActionState` line, add:

```typescript
const t = useTranslations('login')
```

And add the import at the top of the file:

```typescript
import { useTranslations } from 'next-intl'
```

- [ ] **Step 5: Run the "remembers last Gitea URL" test to verify it passes**

Run: `pnpm --filter @forge-git/web exec playwright test --project=chromium -g "remembers last Gitea URL" e2e/auth.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/login/page.tsx
git commit -m "feat(login): remember last Gitea URL via localStorage"
```

---

## Task 6: Implement `useUrlHealth` hook + status pill

**Files:**
- Modify: `apps/web/src/app/login/page.tsx`

The two URL health tests from Task 3 will pass after this.

- [ ] **Step 1: Add the `useUrlHealth` hook below `useGiteaUrlMemory`**

```typescript
type HealthStatus = 'idle' | 'checking' | 'ok' | 'unreachable'

function useUrlHealth(url: string) {
  const [status, setStatus] = useState<HealthStatus>('idle')

  useEffect(() => {
    if (!url) {
      setStatus('idle')
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setStatus('checking')
    const timer = setTimeout(async () => {
      try {
        await fetch(`${url}/api/v1/version`, { method: 'GET', signal: controller.signal })
        if (!cancelled) setStatus('ok')
      } catch (err) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('unreachable')
      }
    }, 400)

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [url])

  return status
}
```

- [ ] **Step 2: Use the hook in `LoginPage`**

Right after the `giteaUrl` state declaration, add:

```typescript
const healthStatus = useUrlHealth(giteaUrl)
```

- [ ] **Step 3: Add the status pill next to the URL input**

Wrap the URL input in a flex container with the pill rendered next to it:

```tsx
<div className="flex items-center gap-2">
  <input
    id="giteaUrl"
    name="giteaUrl"
    type="text"
    placeholder={t('giteaUrlPlaceholder')}
    required
    value={giteaUrl}
    onChange={(e) => {
      setGiteaUrl(e.target.value)
      persistUrl(e.target.value)
    }}
    className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
  />
  {healthStatus !== 'idle' && (
    <span
      data-testid="url-health-pill"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs whitespace-nowrap',
        healthStatus === 'checking' && 'text-muted-foreground',
        healthStatus === 'ok' && 'text-emerald-600 dark:text-emerald-400',
        healthStatus === 'unreachable' && 'text-destructive',
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          healthStatus === 'checking' && 'bg-muted-foreground animate-pulse',
          healthStatus === 'ok' && 'bg-emerald-600 dark:bg-emerald-400',
          healthStatus === 'unreachable' && 'bg-destructive',
        )}
      />
      {healthStatus === 'checking' && t('urlHealthChecking')}
      {healthStatus === 'ok' && t('urlHealthOk')}
      {healthStatus === 'unreachable' && t('urlHealthUnreachable')}
    </span>
  )}
</div>
```

Also add the import:

```typescript
import { cn } from '@forge-git/ui'
```

(Check `@forge-git/ui` exports `cn` — it does, from `packages/ui/src/cn.ts`.)

- [ ] **Step 4: Run the URL health tests to verify they pass**

Run: `pnpm --filter @forge-git/web exec playwright test --project=chromium -g "URL health check" e2e/auth.spec.ts`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/login/page.tsx
git commit -m "feat(login): add inline URL health check with status pill"
```

---

## Task 7: Move setup help to collapsed `<details>` + add copy buttons

**Files:**
- Modify: `apps/web/src/app/login/page.tsx`

After this, the "setup help is collapsed by default" and "setup help copy button" tests from Task 3 pass.

- [ ] **Step 1: Wrap the setup instructions in a `<details>` element**

Find the `<div className="text-xs text-muted-foreground space-y-1 border-t border-border mt-5 pt-4">` block (the bottom setup help section). Replace it with:

```tsx
<details className="text-xs text-muted-foreground border-t border-border mt-5 pt-4 group">
  <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
    {t('setupHelpSummary')}
  </summary>
  <ol className="list-decimal list-inside space-y-1 mt-3 pl-1">
    <li>{t('setupHelpStep1')}</li>
    <li>
      {t('setupHelpStep2')}{' '}
      <CodeBlock code={t('setupHelpRedirect')} />
    </li>
    <li>{t('setupHelpStep3')}</li>
    <li>
      {t('setupHelpStep4')}{' '}
      <CodeBlock code={t('setupHelpCli')} />
    </li>
  </ol>
</details>
```

- [ ] **Step 2: Add the `CodeBlock` component at the bottom of `page.tsx`**

```tsx
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — ignore
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{code}</code>
      <button
        type="button"
        onClick={onCopy}
        data-testid="copy-code-button"
        aria-label={t('copyCode')}
        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
        {copied ? t('copyCodeCopied') : t('copyCode')}
      </button>
    </span>
  )
}
```

- [ ] **Step 3: Add the new icon imports**

Replace the existing `import { ... } from 'lucide-react'` line with:

```typescript
import { LogIn, ChevronRight, Key, AlertCircle, Clipboard, Check } from 'lucide-react'
```

(`Server` was in the old imports but is not used in the new layout. `Key` is used for the PAT section icon. `Clipboard` and `Check` are new for the copy button.)

- [ ] **Step 4: Run the two setup-help tests to verify they pass**

Run: `pnpm --filter @forge-git/web exec playwright test --project=chromium -g "setup help" e2e/auth.spec.ts`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/login/page.tsx
git commit -m "feat(login): collapsible setup help with copyable code blocks"
```

---

## Task 8: Full layout rewrite — two-column, new copy, brand panel

**Files:**
- Modify: `apps/web/src/app/login/page.tsx` (major restructure)

After this, the 3 updated tests from Task 4 pass. The OAuth callback error test (reading `?error=`) and the protected-pages-redirect-to-login test are unaffected by this change but should also still pass.

- [ ] **Step 0: Migrate the `OAuthError` component to use i18n**

Replace the existing `OAuthError` component (above `LoginPage`) with:

```tsx
function OAuthError() {
  const searchParams = useSearchParams()
  const t = useTranslations('login')
  const error = searchParams.get('error')

  if (!error) return null

  let message: string
  try {
    message = t(`oauthError.${error}` as const)
  } catch {
    message = t('oauthError.unknown', { error })
  }

  return (
    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 mb-4">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
```

(The `t(\`oauthError.${error}\`)` call will fall back to the key name if the
error is unknown to next-intl, so no `try/catch` is strictly required — but
explicit handling is clearer.)

- [ ] **Step 1: Replace the entire `LoginPage` function with the new two-column layout**

The function body becomes:

```tsx
export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: '' })
  const t = useTranslations('login')
  const { url: rememberedUrl, setUrl: persistUrl } = useGiteaUrlMemory()
  const [giteaUrl, setGiteaUrl] = useState('')
  const healthStatus = useUrlHealth(giteaUrl)
  const [urlError, setUrlError] = useState('')

  useEffect(() => {
    if (rememberedUrl) setGiteaUrl(rememberedUrl)
  }, [rememberedUrl])

  const validateUrl = (value: string): boolean => {
    if (!value) {
      setUrlError('')
      return false
    }
    try {
      const parsed = new URL(value)
      if (!parsed.protocol.startsWith('http')) throw new Error()
      setUrlError('')
      return true
    } catch {
      setUrlError(t('urlInvalid'))
      return false
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Brand panel — hidden on mobile */}
      <aside className="hidden md:flex md:w-2/5 relative overflow-hidden bg-gradient-to-br from-primary/20 via-purple-500/15 to-pink-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,80,200,0.15),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/images/logo-mark.webp" alt="Forge git" width={32} height={32} className="rounded" />
            <span className="font-semibold text-xl text-foreground">Forge git</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            {t('tagline')}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('subhead')}
          </p>
        </div>
      </aside>

      {/* Auth surface */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-[420px]">
          <div className="glass-card p-10 relative overflow-hidden">
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

            {/* Mobile-only brand header */}
            <div className="md:hidden text-center mb-6 mt-2">
              <Link href="/" className="inline-flex items-center gap-2">
                <img src="/images/logo-mark.webp" alt="Forge git" width={24} height={24} className="rounded" />
                <span className="font-semibold text-foreground">Forge git</span>
              </Link>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t('headline')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {t('subhead')}
              </p>
            </div>

            <Suspense>
              <OAuthError />
            </Suspense>

            {/* OAuth button */}
            <div className="space-y-2 mb-5">
              <Link
                href="/api/auth/authorize"
                className="btn-glow w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium group"
              >
                <LogIn className="w-4 h-4" />
                {t('oauthButton')}
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                {t('oauthHint')}
              </p>
            </div>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('orUsePat')}
                </span>
              </div>
            </div>

            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                <Key className="w-3.5 h-3.5" />
                {t('patSummary')}
              </summary>

              <form
                action={(formData) => {
                  if (!validateUrl(giteaUrl)) return
                  formAction(formData)
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      id="giteaUrl"
                      name="giteaUrl"
                      type="text"
                      placeholder={t('giteaUrlPlaceholder')}
                      required
                      value={giteaUrl}
                      onChange={(e) => {
                        setGiteaUrl(e.target.value)
                        persistUrl(e.target.value)
                        if (urlError) validateUrl(e.target.value)
                      }}
                      onBlur={(e) => validateUrl(e.target.value)}
                      aria-invalid={urlError ? 'true' : 'false'}
                      aria-describedby={urlError ? 'giteaUrl-error' : undefined}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    />
                    {healthStatus !== 'idle' && (
                      <span
                        data-testid="url-health-pill"
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs whitespace-nowrap',
                          healthStatus === 'checking' && 'text-muted-foreground',
                          healthStatus === 'ok' && 'text-emerald-600 dark:text-emerald-400',
                          healthStatus === 'unreachable' && 'text-destructive',
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            healthStatus === 'checking' && 'bg-muted-foreground animate-pulse',
                            healthStatus === 'ok' && 'bg-emerald-600 dark:bg-emerald-400',
                            healthStatus === 'unreachable' && 'bg-destructive',
                          )}
                        />
                        {healthStatus === 'checking' && t('urlHealthChecking')}
                        {healthStatus === 'ok' && t('urlHealthOk')}
                        {healthStatus === 'unreachable' && t('urlHealthUnreachable')}
                      </span>
                    )}
                  </div>
                  {urlError && (
                    <p id="giteaUrl-error" role="alert" className="text-xs text-destructive mt-1">
                      {urlError}
                    </p>
                  )}
                  {giteaUrl && giteaUrl === rememberedUrl && (
                    <p data-testid="last-used-hint" className="text-[10px] text-muted-foreground mt-1">
                      {t('lastUsedHint')}
                    </p>
                  )}
                </div>

                <input
                  id="token"
                  name="token"
                  type="password"
                  placeholder={t('tokenPlaceholder')}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <p className="text-xs text-muted-foreground">
                  {t('tokenHint')}{' '}
                  <a
                    href={giteaUrl ? `${giteaUrl}/user/settings/applications` : 'https://docs.gitea.com/administration/config-cheat-sheet/'}
                    target="_blank"
                    rel="noopener"
                    data-testid="new-here-get-token"
                    className="text-primary hover:underline"
                  >
                    {t('newHereGetToken')}
                  </a>
                </p>

                {state.error && (
                  <p
                    role="alert"
                    aria-live="polite"
                    className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    {state.error}
                  </p>
                )}

                <Button type="submit" disabled={pending} className="w-full h-11">
                  {pending ? t('submitting') : t('submitPat')}
                </Button>
              </form>
            </details>

            <details className="text-xs text-muted-foreground border-t border-border mt-5 pt-4 group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                {t('setupHelpSummary')}
              </summary>
              <ol className="list-decimal list-inside space-y-1 mt-3 pl-1">
                <li>{t('setupHelpStep1')}</li>
                <li>
                  {t('setupHelpStep2')} <CodeBlock code={t('setupHelpRedirect')} />
                </li>
                <li>{t('setupHelpStep3')}</li>
                <li>
                  {t('setupHelpStep4')} <CodeBlock code={t('setupHelpCli')} />
                </li>
              </ol>
            </details>
          </div>
        </div>
      </section>
    </main>
  )
}
```

This combines the new layout, the new copy, the E1 client-side URL validation, the E2 error banner polish (animation + `role="alert"`), and the "Get a token" link — all in one focused task. The reason for bundling: they're all in the same file and would conflict in separate edits.

- [ ] **Step 2: Run the full login e2e suite to verify everything passes**

Run: `pnpm --filter @forge-git/web exec playwright test --project=chromium e2e/auth.spec.ts`
Expected: all tests pass (the 3 updated from Task 4, the 5 new from Task 3, plus the existing protected-redirect and OAuth-error tests).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/login/page.tsx
git commit -m "feat(login): rewrite as two-column layout with brand panel"
```

---

## Task 9: Update `loading.tsx` skeleton

**Files:**
- Modify: `apps/web/src/app/login/loading.tsx` (rewrite to match the new two-column layout)

- [ ] **Step 1: Replace the file contents**

Write the following to `apps/web/src/app/login/loading.tsx`:

```tsx
export default function LoginLoading() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-2/5 bg-gradient-to-br from-primary/20 via-purple-500/15 to-pink-500/20">
        <div className="flex flex-col justify-center px-12 py-16 max-w-md w-full">
          <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-6" />
          <div className="h-12 w-full bg-secondary rounded animate-pulse mb-3" />
          <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
        </div>
      </aside>
      <section className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] glass-card p-10 animate-pulse">
          <div className="h-6 w-32 bg-secondary rounded mx-auto mb-2" />
          <div className="h-4 w-48 bg-secondary rounded mx-auto mb-6" />
          <div className="h-11 bg-secondary rounded mb-2" />
          <div className="h-3 w-32 bg-secondary rounded mx-auto mb-5" />
          <div className="h-px bg-border mb-5" />
          <div className="h-10 bg-secondary rounded" />
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @forge-git/web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify visually**

Open `http://localhost:3008/login` in a browser. If the page is already loaded, hard-reload (Cmd+Shift+R) to see the new layout. Throttle the network (DevTools → Network → Slow 3G) and reload to see the skeleton.

Confirm: brand panel on the left on desktop, full-width card on mobile, glass card with the gradient border, OAuth button with glow, PAT section behind a details toggle, setup help behind a details toggle.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/login/loading.tsx
git commit -m "feat(login): update loading skeleton to match new layout"
```

---

## Task 10: Final verification

**Files:** none modified — this is a verification gate.

- [ ] **Step 1: Run the full e2e suite for the web app**

Run: `pnpm --filter @forge-git/web test:e2e -- --project=chromium`
Expected: all tests pass.

- [ ] **Step 2: Run type check**

Run: `pnpm --filter @forge-git/web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `pnpm --filter @forge-git/web lint`
Expected: no errors. (If any are flagged, fix them — they are almost certainly unused imports left from the rewrite.)

- [ ] **Step 4: Run unit tests**

Run: `pnpm --filter @forge-git/web test`
Expected: all pass.

- [ ] **Step 5: Verify build**

Run: `pnpm --filter @forge-git/web build`
Expected: builds without errors. The login page route should appear in the build output.

- [ ] **Step 6: Manual visual review**

Open `http://localhost:3008/login`. Walk through:
- Brand panel visible on desktop, hidden on mobile (resize the window)
- OAuth button has glow, hover nudges the right arrow
- PAT section toggle works
- "Get a token" link points to the right URL (giteaUrl-aware)
- URL health pill shows correct status for valid/invalid URLs
- "Last used" hint shows when URL is pre-filled
- Setup help is collapsed by default
- Copy buttons in setup help flip to "Copied" on click
- OAuth callback errors render in the destructive banner
- Form action errors (invalid token, network failure) render in the destructive banner with the slide-in animation

- [ ] **Step 7: Final commit if any fixups were needed**

```bash
git add -A
git commit -m "chore(login): fixups from final verification"
```

Only run this step if Step 1–6 surfaced issues that needed fixing.

---

## Out of scope (per spec)

- Signup, forgot-token, recovery routes
- Middleware changes
- Auth flow changes (callback, session refresh)
- Brand panel reuse on other pages
- Mobile-specific layout beyond the column collapse
- Visual regression infrastructure
- Unit tests for the two client hooks

## Notes for the implementer

- The `cn` utility is exported from `@forge-git/ui`. If it's not working in the new code, fall back to a local `cn` helper or template-string class composition.
- The dev server is already running on port 3008. Playwright uses port 3344 with its own dev server. Don't try to point Playwright at the running 3008 server.
- The `useActionState` action signature is unchanged. Don't touch `apps/web/src/app/login/actions.ts`.
- If the new copy reads awkwardly in context, adjust the i18n strings in `en.json` first, then mirror to `es.json` and `zh.json`. Don't diverge the locales mid-implementation.
