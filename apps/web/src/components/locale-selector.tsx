'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Check } from 'lucide-react'

const locales = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
] as const

export default function LocaleSelector() {
  const current = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const selected = locales.find((l) => l.code === current) ?? locales[0]

  return (
    <div className="relative" data-testid="locale-selector">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-sm transition-colors hover:text-primary px-2 py-1 rounded-md hover:bg-muted"
        aria-label={`Select language: ${selected.label}`}
        data-testid="locale-selector-btn"
      >
        <span className="text-base">{selected.flag}</span>
        <span className="hidden sm:inline text-xs font-medium uppercase">{selected.code}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border border-border bg-white dark:bg-[hsl(217,25%,10%)] text-gray-900 dark:text-gray-100 shadow-lg p-1"
            data-testid="locale-dropdown"
          >
            {locales.map(({ code, flag, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  router.replace(pathname, { locale: code })
                  setOpen(false)
                }}
                className={`flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors ${
                  code === current
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                data-testid={`locale-option-${code}`}
              >
                <span className="text-base">{flag}</span>
                <span className="flex-1 text-left">{label}</span>
                {code === current && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
