import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import FirstRunEmptyState from '@/components/first-run-empty-state'
import { GitBranch, Users } from 'lucide-react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (namespace: string) => {
    const map: Record<string, Record<string, string>> = {
      'builds.firstRun': {
        headline: 'No builds yet',
        subhead: 'Trigger your first build',
      },
    }
    return (key: string) => map[namespace]?.[key] ?? `${namespace}.${key}`
  }),
}))

afterEach(() => cleanup())

describe('FirstRunEmptyState (generalized)', () => {
  it('renders the headline and subhead from the namespace', async () => {
    const jsx = await FirstRunEmptyState({
      icon: GitBranch,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories">Go to repositories</a>,
    })
    render(jsx)
    expect(screen.getByRole('heading', { name: 'No builds yet' })).toBeInTheDocument()
    expect(screen.getByText('Trigger your first build')).toBeInTheDocument()
  })

  it('renders the primary CTA passed via props', async () => {
    const jsx = await FirstRunEmptyState({
      icon: GitBranch,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories" data-testid="primary-cta">Go to repositories</a>,
    })
    render(jsx)
    const cta = screen.getByTestId('primary-cta')
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/repositories')
  })

  it('renders secondary cards grid when provided', async () => {
    const jsx = await FirstRunEmptyState({
      icon: GitBranch,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories">Go to repositories</a>,
      secondaryCards: (
        <>
          <a href="/a" data-testid="secondary-1">A</a>
          <a href="/b" data-testid="secondary-2">B</a>
        </>
      ),
    })
    render(jsx)
    expect(screen.getByTestId('secondary-1')).toBeInTheDocument()
    expect(screen.getByTestId('secondary-2')).toBeInTheDocument()
  })

  it('omits secondary grid when secondaryCards is undefined', async () => {
    const jsx = await FirstRunEmptyState({
      icon: Users,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories">Go to repositories</a>,
    })
    const { container } = render(jsx)
    expect(container.querySelector('.sm\\:grid-cols-2')).toBeNull()
  })
})
