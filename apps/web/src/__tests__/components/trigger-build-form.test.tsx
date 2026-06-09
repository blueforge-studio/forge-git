import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import TriggerBuildForm from '@/components/trigger-build-form'

afterEach(() => {
  cleanup()
})

describe('TriggerBuildForm', () => {
  it('renders all required input fields and submit button', () => {
    render(<TriggerBuildForm />)

    expect(screen.getByPlaceholderText('repoId *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('orgId *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('commitSha *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('branch *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trigger Build' })).toBeInTheDocument()
  })

  it('prefills inputs from prefill prop', () => {
    render(<TriggerBuildForm prefill={{ repoId: 'owner/repo', branch: 'main' }} />)

    const repoInput = screen.getByPlaceholderText('repoId *') as HTMLInputElement
    const branchInput = screen.getByPlaceholderText('branch *') as HTMLInputElement

    expect(repoInput.value).toBe('owner/repo')
    expect(branchInput.value).toBe('main')
  })
})
