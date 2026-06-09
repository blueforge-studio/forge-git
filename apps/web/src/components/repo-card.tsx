'use client'

import { GitFork, Star, Lock, Globe, Copy, Check } from 'lucide-react'
import type { GiteaRepo } from '@forge-git/gitea-bridge'
import Link from 'next/link'
import { useState } from 'react'

export default function RepoCard({ repo }: { repo: GiteaRepo }) {
  const [copied, setCopied] = useState(false)

  const copyCloneUrl = async () => {
    await navigator.clipboard.writeText(repo.clone_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:border-ring transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          {repo.owner ? (
            <div className="flex items-center gap-1 text-sm">
              <Link
                href={`/users/${repo.owner.login}`}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {repo.owner.login}
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link
                href={`/repositories/${repo.full_name}`}
                className="font-medium text-primary hover:underline"
              >
                {repo.name}
              </Link>
            </div>
          ) : (
            <Link
              href={`/repositories/${repo.full_name}`}
              className="font-medium text-primary hover:underline"
            >
              {repo.full_name}
            </Link>
          )}
        </div>
        {repo.private ? (
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </div>

      {repo.description && (
        <p className="text-sm text-muted-foreground mb-3">{repo.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" /> {repo.stars_count}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-3 h-3" /> {repo.forks_count}
        </span>
      </div>

      <button
        onClick={copyCloneUrl}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-green-500" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" /> {repo.clone_url}
          </>
        )}
      </button>
    </div>
  )
}
