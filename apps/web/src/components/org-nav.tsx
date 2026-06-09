'use client'

import Link from 'next/link'
import { Users, Shield, Settings } from 'lucide-react'

const tabs = [
  { label: 'Overview', href: '', icon: null },
  { label: 'Teams', href: '/teams', icon: Shield },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function OrgNav({
  orgName,
  activeTab,
}: {
  orgName: string
  activeTab: string
}) {
  const base = `/organizations/${orgName}`

  return (
    <nav className="flex items-center gap-1 border-b border-border mb-8 -mx-6 px-6">
      {tabs.map((tab) => {
        const isActive =
          tab.label.toLowerCase() === activeTab ||
          (activeTab === 'overview' && tab.label === 'Overview')
        const Icon = tab.icon
        return (
          <Link
            key={tab.label}
            href={tab.href ? `${base}${tab.href}` : base}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
              isActive
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
