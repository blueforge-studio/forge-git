import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="border border-border rounded-lg p-4 flex items-center gap-4">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

interface DashboardStats {
  repoCount: number
  prCount: number
  issueCount: number
  buildCount: number
}

interface Props {
  stats: DashboardStats
  icons: {
    repo: ReactNode
    pr: ReactNode
    issue: ReactNode
    build: ReactNode
  }
}

export default function DashboardStats({ stats, icons }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="Repositories" value={stats.repoCount} icon={icons.repo} />
      <StatCard label="Pull Requests" value={stats.prCount} icon={icons.pr} />
      <StatCard label="Issues" value={stats.issueCount} icon={icons.issue} />
      <StatCard label="Active Builds" value={stats.buildCount} icon={icons.build} />
    </div>
  )
}
