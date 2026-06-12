import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import OrgsFirstRun from '@/components/orgs-first-run'

const fakeLabels = {
  headline: 'No organizations yet',
  subhead: 'Create an organization',
  primaryCta: 'Create your first organization',
  secondaryLearnTitle: 'Learn about organizations',
  secondaryLearnDesc: 'Read the Gitea organizations guide',
}

vi.mock('@/components/create-org-form', () => ({
  default: () => <form data-testid="create-org-form">CreateOrgForm mock</form>,
}))

afterEach(() => cleanup())

describe('OrgsFirstRun', () => {
  it('renders the first-run headline initially', () => {
    render(<OrgsFirstRun labels={fakeLabels} />)
    expect(screen.getByRole('heading', { name: 'No organizations yet' })).toBeInTheDocument()
  })

  it('renders the primary CTA as a button (not a link)', () => {
    render(<OrgsFirstRun labels={fakeLabels} />)
    const cta = screen.getByTestId('orgs-first-run-primary-cta')
    expect(cta.tagName).toBe('BUTTON')
  })

  it('does not show the create form initially', () => {
    render(<OrgsFirstRun labels={fakeLabels} />)
    expect(screen.queryByTestId('create-org-form')).not.toBeInTheDocument()
  })

  it('reveals the inline create form when primary CTA is clicked', () => {
    render(<OrgsFirstRun labels={fakeLabels} />)
    fireEvent.click(screen.getByTestId('orgs-first-run-primary-cta'))
    expect(screen.getByTestId('create-org-form')).toBeInTheDocument()
  })

  it('hides the first-run headline after the form is revealed', () => {
    render(<OrgsFirstRun labels={fakeLabels} />)
    fireEvent.click(screen.getByTestId('orgs-first-run-primary-cta'))
    expect(screen.queryByRole('heading', { name: 'No organizations yet' })).not.toBeInTheDocument()
  })
})
