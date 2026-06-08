import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import EmptyState from '@/components/empty-state'
import { Server } from 'lucide-react'

afterEach(() => cleanup())

describe('EmptyState', () => {
  it('renders icon, title, and description', () => {
    render(
      <EmptyState
        icon={Server}
        title="No items"
        description="Nothing here yet"
      />
    )
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })

  it('renders action link when actionLabel and actionHref are provided', () => {
    render(
      <EmptyState
        icon={Server}
        title="No items"
        description="Nothing here yet"
        actionLabel="Create One"
        actionHref="/new"
      />
    )
    const link = screen.getByRole('link', { name: 'Create One' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/new')
  })

  it('does not render action link when actionLabel omitted', () => {
    render(
      <EmptyState
        icon={Server}
        title="Empty"
        description="Nothing to show"
      />
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
