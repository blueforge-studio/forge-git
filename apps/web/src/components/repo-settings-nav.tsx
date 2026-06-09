'use client'

import Link from 'next/link'

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Files', href: '/tree' },
  { label: 'Pull Requests', href: '/pulls' },
  { label: 'Issues', href: '/issues' },
  { label: 'Releases', href: '/releases' },
  { label: 'Webhooks', href: '/webhooks' },
  { label: 'Deploy Keys', href: '/deploy-keys' },
  { label: 'Branch Protection', href: '/branch-protection' },
  { label: 'Branches', href: '/branches' },
  { label: 'Commits', href: '/commits' },
]

export default function RepoSettingsNav({
  owner,
  repo,
  activeTab,
}: {
  owner: string
  repo: string
  activeTab: string
}) {
  const base = `/repositories/${owner}/${repo}`

  return (
    <nav className="flex items-center gap-1 border-b border-border mb-6 -mx-6 px-6">
      {tabs.map((tab) => {
        const isActive = tab.label.toLowerCase().replace(' ', '-') === activeTab
          || (activeTab === 'overview' && tab.label === 'Overview')
        return (
          <Link
            key={tab.label}
            href={tab.href ? `${base}${tab.href}` : base}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              isActive
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
