import { describe, it, expect, vi, afterEach } from 'vitest'

const mockWorker = {
  on: vi.fn().mockReturnThis(),
  close: vi.fn().mockResolvedValue(undefined),
}

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(function () { return mockWorker }),
  Job: vi.fn(),
}))

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      ping: vi.fn().mockResolvedValue('PONG'),
      quit: vi.fn().mockResolvedValue(undefined),
    }
  }),
}))

import { start, stop, health, buildDefaultWorkflow } from '../index.js'

describe('deploy-runner', () => {
  afterEach(async () => {
    await stop()
    vi.clearAllMocks()
  })

  it('start() creates a worker with the right queue name', async () => {
    const { Worker } = await import('bullmq')
    start()

    expect(Worker).toHaveBeenCalledTimes(1)
    expect(Worker).toHaveBeenCalledWith(
      'deployments',
      expect.any(Function),
      expect.objectContaining({
        concurrency: expect.any(Number),
      }),
    )
  })

  it('stop() closes worker and redis', async () => {
    start()
    await stop()

    expect(mockWorker.close).toHaveBeenCalledTimes(1)
  })

  it('health() returns error status when not started', async () => {
    expect(await health()).toEqual({
      status: 'error',
      redis: false,
      workerRunning: false,
    })
  })

  it('health() returns ok status after start()', async () => {
    start()

    const h = await health()
    expect(h.status).toBe('ok')
    expect(h.redis).toBe(true)
    expect(h.workerRunning).toBe(true)
  })

  it('health() returns error status after stop()', async () => {
    start()
    await stop()

    expect(await health()).toEqual({
      status: 'error',
      redis: false,
      workerRunning: false,
    })
  })

  it('buildDefaultWorkflow() returns the expected structure', () => {
    expect(buildDefaultWorkflow()).toEqual({
      name: 'CI',
      jobs: {
        test: {
          runs_on: 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v4' },
            { run: 'npm ci && npm test' },
          ],
        },
      },
    })
  })
})
