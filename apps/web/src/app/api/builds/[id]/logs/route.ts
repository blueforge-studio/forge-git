import { NextRequest } from 'next/server'
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const channel = `build:${id}:logs`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new Redis(REDIS_URL)

      subscriber.on('message', (_ch, message) => {
        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`))
        } catch {
          // Stream closed — unsubscribe
          subscriber.disconnect()
        }
      })

      subscriber.on('error', (err) => {
        try {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
          )
        } catch {
          // Stream already closed
        }
      })

      try {
        await subscriber.subscribe(channel)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        try {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`)
          )
        } catch {
          // Stream already closed
        }
        subscriber.disconnect()
        controller.close()
        return
      }

      // Send initial connected event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ channel })}\n\n`)
      )

      // Keep-alive every 30s to prevent proxy timeouts
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepAlive)
          subscriber.disconnect()
        }
      }, 30_000)

      // Cleanup on abort (client disconnect)
      _req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        subscriber.unsubscribe(channel).finally(() => subscriber.quit())
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
