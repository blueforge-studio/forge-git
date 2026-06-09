import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import SearchBar from '@/components/search-bar'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('SearchBar', () => {
  it('renders the search input with placeholder', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('Search... (press "/")')).toBeInTheDocument()
  })

  it('does not show dropdown when query is empty', () => {
    render(<SearchBar />)
    expect(screen.queryByText('Repositories')).not.toBeInTheDocument()
  })

  it('shows loading spinner while fetching results', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves
    render(<SearchBar />)

    const input = screen.getByPlaceholderText('Search... (press "/")')
    fireEvent.change(input, { target: { value: 'te' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/search?q=te')
    })
  })

  it('shows dropdown with repo results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        repos: [{ id: 1, full_name: 'test/repo', description: 'A test repo' }],
        issues: [],
        pulls: [],
      }),
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search... (press "/")')
    fireEvent.change(input, { target: { value: 'test' } })

    await waitFor(() => {
      expect(screen.getByText('Repositories')).toBeInTheDocument()
      expect(screen.getByText('test/repo')).toBeInTheDocument()
      expect(screen.getByText('A test repo')).toBeInTheDocument()
    })
  })

  it('shows dropdown with issue and PR results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        repos: [],
        issues: [{ id: 10, number: 42, title: 'Fix login bug', html_url: 'https://gitea.example.com/owner/repo/issues/42' }],
        pulls: [{ id: 20, number: 7, title: 'Add feature X', state: 'open', merged: false, html_url: 'https://gitea.example.com/owner/repo/pulls/7' }],
      }),
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search... (press "/")')
    fireEvent.change(input, { target: { value: 'fix' } })

    await waitFor(() => {
      expect(screen.getByText('Issues')).toBeInTheDocument()
      expect(screen.getByText('Fix login bug')).toBeInTheDocument()
      expect(screen.getByText('Pull Requests')).toBeInTheDocument()
      expect(screen.getByText('Add feature X')).toBeInTheDocument()
      expect(screen.getByText('See all results →')).toBeInTheDocument()
    })
  })

  it('closes dropdown on Escape key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        repos: [{ id: 1, full_name: 'test/repo', description: '' }],
        issues: [],
        pulls: [],
      }),
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search... (press "/")')
    fireEvent.change(input, { target: { value: 'test' } })

    await waitFor(() => {
      expect(screen.getByText('Repositories')).toBeInTheDocument()
    })

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByText('Repositories')).not.toBeInTheDocument()
    })
  })

  it('does not fetch when query is shorter than 2 chars', async () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search... (press "/")')
    fireEvent.change(input, { target: { value: 't' } })

    // Wait briefly to let debounce fire
    await new Promise((r) => setTimeout(r, 300))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('ignores fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search... (press "/")')
    fireEvent.change(input, { target: { value: 'te' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
    // Should not throw — component stays rendered
    expect(screen.getByPlaceholderText('Search... (press "/")')).toBeInTheDocument()
  })

  it('closes dropdown on click outside', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        repos: [{ id: 1, full_name: 'test/repo', description: '' }],
        issues: [],
        pulls: [],
      }),
    })

    render(
      <div>
        <SearchBar />
        <button>Outside</button>
      </div>
    )
    const input = screen.getByPlaceholderText('Search... (press "/")')
    fireEvent.change(input, { target: { value: 'test' } })

    await waitFor(() => {
      expect(screen.getByText('Repositories')).toBeInTheDocument()
    })

    fireEvent.mouseDown(screen.getByText('Outside'))

    await waitFor(() => {
      expect(screen.queryByText('Repositories')).not.toBeInTheDocument()
    })
  })
})
