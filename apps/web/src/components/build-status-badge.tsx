import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Props {
  status: 'none' | 'passing' | 'failing' | 'running'
  latestBuildId?: string
}

export default function BuildStatusBadge({ status, latestBuildId: _latestBuildId }: Props) {
  if (status === 'none') return null

  const config = {
    passing: {
      classes: 'border-green-500/30 text-green-600 bg-green-500/10',
      Icon: CheckCircle2,
      label: 'Build passing',
    },
    failing: {
      classes: 'border-red-500/30 text-red-600 bg-red-500/10',
      Icon: XCircle,
      label: 'Build failing',
    },
    running: {
      classes: 'border-blue-500/30 text-blue-600 bg-blue-500/10',
      Icon: Loader2,
      label: 'Build running',
    },
  }[status]

  const { classes, Icon, label } = config

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${classes}`}>
      <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  )
}
