'use client'

import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'
import ruby from 'highlight.js/lib/languages/ruby'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import shell from 'highlight.js/lib/languages/shell'
import dockerfile from 'highlight.js/lib/languages/dockerfile'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('go', go)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('sh', bash)

function extToLang(ext: string): string | undefined {
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rs: 'rust', go: 'go', rb: 'ruby',
    json: 'json', yaml: 'yaml', yml: 'yaml', css: 'css',
    html: 'xml', xml: 'xml', sql: 'sql', sh: 'bash', bash: 'bash',
    md: 'markdown', dockerfile: 'dockerfile',
  }
  return map[ext]
}

interface Props {
  content: string
  filename?: string
}

export default function CodeBlock({ content, filename }: Props) {
  const codeRef = useRef<HTMLElement>(null)

  const ext = filename?.split('.').pop()?.toLowerCase() ?? ''
  const lang = extToLang(ext)

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }
  }, [content, lang])

  const lines = content.split('\n')

  return (
    <div className="flex bg-zinc-950 text-zinc-100 overflow-auto">
      <div className="shrink-0 select-none bg-zinc-900 text-zinc-500 text-xs font-mono leading-relaxed py-4 pl-4 pr-3 text-right border-r border-zinc-800">
        {lines.map((_, i) => (
          <div key={i} className="h-[1.625rem]">
            {i + 1}
          </div>
        ))}
      </div>
      <pre className="text-sm font-mono leading-relaxed p-4 overflow-auto whitespace-pre">
        <code ref={codeRef} className={lang ? `language-${lang}` : undefined}>
          {content}
        </code>
      </pre>
    </div>
  )
}
