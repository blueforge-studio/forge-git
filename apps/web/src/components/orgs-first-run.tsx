'use client'

import { useState, type ComponentType } from 'react'
import { Building2, BookOpen, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@forge-git/ui'
import Link from 'next/link'
import CreateOrgForm from '@/components/create-org-form'

export interface OrgsFirstRunLabels {
  headline: string
  subhead: string
  primaryCta: string
  secondaryLearnTitle: string
  secondaryLearnDesc: string
}

interface IconProps {
  className?: string
  'aria-hidden'?: boolean
}

export default function OrgsFirstRun({ labels }: { labels: OrgsFirstRunLabels }) {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div
        data-testid="orgs-create-form-wrapper"
        className="border border-dashed border-border rounded-lg p-12 text-center"
      >
        <CreateOrgForm />
      </div>
    )
  }

  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <Building2
        className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50"
        aria-hidden={true}
      />
      <h2 className="text-xl font-semibold mb-1">{labels.headline}</h2>
      <p className="text-sm text-muted-foreground mb-6">{labels.subhead}</p>
      <Button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full h-11 btn-glow group inline-flex items-center justify-center gap-2"
        data-testid="orgs-first-run-primary-cta"
      >
        <Plus className="w-4 h-4" />
        {labels.primaryCta}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <SecondaryCard
          href="https://docs.gitea.com/user/organizations/"
          icon={BookOpen}
          title={labels.secondaryLearnTitle}
          description={labels.secondaryLearnDesc}
          testId="orgs-first-run-secondary-learn"
          external
        />
      </div>
    </div>
  )
}

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  testId,
  external = false,
}: {
  href: string
  icon: ComponentType<IconProps>
  title: string
  description: string
  testId: string
  external?: boolean
}) {
  const className =
    'flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left'
  const content = (
    <>
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden={true} />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}
