import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import BuildStatusBadge from '@/components/build-status-badge'

afterEach(() => cleanup())

describe('BuildStatusBadge', () => {
  it('returns null for status "none"', () => {
    const { container } = render(<BuildStatusBadge status="none" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders "Build passing" for passing status', () => {
    render(<BuildStatusBadge status="passing" />)
    expect(screen.getByText('Build passing')).toBeInTheDocument()
  })

  it('renders "Build failing" for failing status', () => {
    render(<BuildStatusBadge status="failing" />)
    expect(screen.getByText('Build failing')).toBeInTheDocument()
  })

  it('renders "Build running" for running status', () => {
    render(<BuildStatusBadge status="running" />)
    expect(screen.getByText('Build running')).toBeInTheDocument()
  })
})
