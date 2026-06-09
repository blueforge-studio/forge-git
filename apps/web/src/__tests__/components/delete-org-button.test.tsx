import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import DeleteOrgButton from '@/components/delete-org-button'

vi.mock('@/app/organizations/actions', () => ({
  deleteOrgAction: vi.fn(),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('DeleteOrgButton', () => {
  it('shows delete button initially', () => {
    render(<DeleteOrgButton orgName="acme" />)
    expect(screen.getByRole('button', { name: 'Delete this organization' })).toBeInTheDocument()
  })

  it('shows confirmation form after clicking delete button', async () => {
    render(<DeleteOrgButton orgName="acme" />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this organization' }))

    expect(screen.getByText(/Type/)).toBeInTheDocument()
    expect(screen.getByText('acme', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('acme')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('disables confirm button when name does not match', async () => {
    render(<DeleteOrgButton orgName="acme" />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this organization' }))

    const confirmBtn = screen.getByRole('button', { name: 'Confirm delete' })
    expect(confirmBtn).toBeDisabled()
  })

  it('enables confirm button when name matches', async () => {
    render(<DeleteOrgButton orgName="acme" />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this organization' }))

    const input = screen.getByPlaceholderText('acme')
    fireEvent.change(input, { target: { value: 'acme' } })

    const confirmBtn = screen.getByRole('button', { name: 'Confirm delete' })
    expect(confirmBtn).not.toBeDisabled()
  })

  it('returns to initial state on cancel', async () => {
    render(<DeleteOrgButton orgName="acme" />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this organization' }))

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Delete this organization' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('acme')).not.toBeInTheDocument()
  })

  it('has hidden input with org name', async () => {
    render(<DeleteOrgButton orgName="acme" />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this organization' }))

    const hiddenInput = document.querySelector('input[name="orgName"]') as HTMLInputElement
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput.value).toBe('acme')
  })
})
