'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-500" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" /> Copy
        </>
      )}
    </button>
  )
}
