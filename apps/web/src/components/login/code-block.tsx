'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clipboard, Check } from 'lucide-react'

export default function CodeBlock({ code }: { code: string }) {
  const t = useTranslations('login')
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
