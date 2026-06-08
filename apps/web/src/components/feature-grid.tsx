import { Server, Play, Users } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Server,
    title: 'Git Hosting',
    description: 'Host repositories with full Git support, branch protection, deploy keys, and webhooks — powered by Gitea.',
  },
  {
    icon: Play,
    title: 'CI/CD Pipeline',
    description: 'Trigger builds, track deployments, and manage your CI/CD workflow with our integrated build system.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Create organizations, manage teams, and control access with fine-grained permissions.',
  },
]

export default function FeatureGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-3 mb-10">
      {features.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="border border-border rounded-lg p-6 hover:bg-secondary/20 transition-colors"
        >
          <Icon className="w-8 h-8 mb-3 text-primary" />
          <h3 className="font-semibold text-sm mb-2">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      ))}
    </div>
  )
}
