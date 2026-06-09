import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import CreateOrgForm from '@/components/create-org-form'

vi.mock('@/app/organizations/actions', () => ({
  createOrgAction: vi.fn(),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('CreateOrgForm', () => {
  it('renders organization name input', () => {
    render(<CreateOrgForm />)

    expect(screen.getByLabelText('Organization name *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('my-org')).toBeInTheDocument()
  })

  it('renders display name input', () => {
    render(<CreateOrgForm />)

    expect(screen.getByLabelText('Display name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('My Organization')).toBeInTheDocument()
  })

  it('renders description input', () => {
    render(<CreateOrgForm />)

    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Optional description')).toBeInTheDocument()
  })

  it('renders three visibility radio buttons with Public default', () => {
    render(<CreateOrgForm />)

    const publicRadio = screen.getByLabelText('Public') as HTMLInputElement
    const limitedRadio = screen.getByLabelText('Limited') as HTMLInputElement
    const privateRadio = screen.getByLabelText('Private') as HTMLInputElement

    expect(publicRadio.checked).toBe(true)
    expect(limitedRadio.checked).toBe(false)
    expect(privateRadio.checked).toBe(false)
    expect(publicRadio.value).toBe('public')
    expect(limitedRadio.value).toBe('limited')
    expect(privateRadio.value).toBe('private')
  })

  it('renders submit and cancel buttons', () => {
    render(<CreateOrgForm />)

    expect(screen.getByRole('button', { name: 'Create Organization' })).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('cancel link points to organizations page', () => {
    render(<CreateOrgForm />)

    expect(screen.getByText('Cancel').closest('a')).toHaveAttribute('href', '/organizations')
  })

  it('has autoFocus on name input', () => {
    render(<CreateOrgForm />)

    const nameInput = screen.getByPlaceholderText('my-org')
    expect(nameInput).toHaveFocus()
  })
})
