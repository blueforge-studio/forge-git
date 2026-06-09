import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'
import BuildLogStreamer from '@/components/build-log-streamer'

let eventSourceMocks: Array<{
  addEventListener: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  readyState: number
}> = []

beforeEach(() => {
  eventSourceMocks = []
  const mockEventSource = vi.fn(function (this: any, url: string) {
    const mock = {
      addEventListener: vi.fn(),
      close: vi.fn(),
      readyState: 1, // OPEN
    }
    eventSourceMocks.push(mock)
    return mock
  }) as any
  mockEventSource.CLOSED = 2
  mockEventSource.OPEN = 1
  vi.stubGlobal('EventSource', mockEventSource)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BuildLogStreamer', () => {
  it('renders initial connecting state', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    expect(screen.getByText('Build Logs')).toBeInTheDocument()
    expect(screen.getByText('connecting')).toBeInTheDocument()
    expect(screen.getByText('0 entries')).toBeInTheDocument()
    expect(screen.getByText('Connecting to log stream...')).toBeInTheDocument()
  })

  it('creates EventSource with correct URL', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    expect(EventSource).toHaveBeenCalledWith('/api/builds/abc123/logs')
  })

  it('shows connected status after connected event', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    // Get the "connected" handler and call it
    const connectedHandler = eventSourceMocks[0].addEventListener.mock.calls.find(
      (call: string[]) => call[0] === 'connected'
    )?.[1]
    act(() => { connectedHandler() })

    expect(screen.getByText('connected')).toBeInTheDocument()
    expect(screen.getByText('Waiting for logs...')).toBeInTheDocument()
  })

  it('appends log entries from message events', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    const messageHandler = eventSourceMocks[0].addEventListener.mock.calls.find(
      (call: string[]) => call[0] === 'message'
    )?.[1]

    act(() => {
      messageHandler({
        data: JSON.stringify({
          timestamp: '2024-01-15T10:00:00Z',
          level: 'info',
          message: 'Starting build...',
        }),
      })
    })

    expect(screen.getByText('Starting build...')).toBeInTheDocument()
    expect(screen.getByText('1 entries')).toBeInTheDocument()
  })

  it('shows error entries in red', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    const messageHandler = eventSourceMocks[0].addEventListener.mock.calls.find(
      (call: string[]) => call[0] === 'message'
    )?.[1]

    act(() => {
      messageHandler({
        data: JSON.stringify({
          timestamp: '2024-01-15T10:01:00Z',
          level: 'error',
          message: 'Build failed',
        }),
      })
    })

    const errorEntry = screen.getByText('Build failed')
    expect(errorEntry.closest('div')?.className).toContain('text-red-400')
  })

  it('shows error status when event source closes', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    const errorHandler = eventSourceMocks[0].addEventListener.mock.calls.find(
      (call: string[]) => call[0] === 'error'
    )?.[1]

    // Simulate CLOSED state
    eventSourceMocks[0].readyState = 2
    act(() => { errorHandler() })

    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('closes EventSource on unmount', () => {
    const { unmount } = render(<BuildLogStreamer jobId="abc123" />)

    unmount()

    expect(eventSourceMocks[0].close).toHaveBeenCalled()
  })

  it('skips unparseable messages gracefully', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    const messageHandler = eventSourceMocks[0].addEventListener.mock.calls.find(
      (call: string[]) => call[0] === 'message'
    )?.[1]

    act(() => {
      messageHandler({ data: 'not json' })
    })

    // Should still be at 0 entries — no error thrown
    expect(screen.getByText('0 entries')).toBeInTheDocument()
  })

  it('shows warn entries in yellow', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    const messageHandler = eventSourceMocks[0].addEventListener.mock.calls.find(
      (call: string[]) => call[0] === 'message'
    )?.[1]

    act(() => {
      messageHandler({
        data: JSON.stringify({
          timestamp: '2024-01-15T10:02:00Z',
          level: 'warn',
          message: 'Deprecated flag used',
        }),
      })
    })

    const warnEntry = screen.getByText('Deprecated flag used')
    expect(warnEntry.closest('div')?.className).toContain('text-yellow-400')
  })

  it('renders multiple entries in order', () => {
    render(<BuildLogStreamer jobId="abc123" />)

    const messageHandler = eventSourceMocks[0].addEventListener.mock.calls.find(
      (call: string[]) => call[0] === 'message'
    )?.[1]

    act(() => {
      messageHandler({ data: JSON.stringify({ timestamp: '', level: 'info', message: 'First' }) })
      messageHandler({ data: JSON.stringify({ timestamp: '', level: 'info', message: 'Second' }) })
      messageHandler({ data: JSON.stringify({ timestamp: '', level: 'info', message: 'Third' }) })
    })

    expect(screen.getByText('3 entries')).toBeInTheDocument()
    const messages = screen.getAllByText(/First|Second|Third/)
    expect(messages).toHaveLength(3)
  })
})
