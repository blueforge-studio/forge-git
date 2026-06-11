'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, Loader2, Check } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function NewsletterSection() {
  const t = useTranslations('newsletter')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? t('errorFailed'))
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : t('errorGeneric'))
    }
  }

  return (
    <section className="py-16" aria-labelledby="newsletter-heading" data-testid="newsletter-section">
      <div className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <h2
            id="newsletter-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            {t('heading')}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t('description')}
        </p>

        {status === 'success' ? (
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <Check className="w-4 h-4" />
            {t('success')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2" data-testid="newsletter-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              required
              disabled={status === 'loading'}
              data-testid="newsletter-email-input"
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              data-testid="newsletter-submit-btn"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 h-9 text-sm font-medium shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              {t('submit')}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </div>
    </section>
  )
}
