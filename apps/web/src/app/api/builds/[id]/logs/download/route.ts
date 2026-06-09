import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getBuildLog } from '@/lib/minio'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const logContent = await getBuildLog(id)
    if (!logContent) {
      return NextResponse.json({ error: 'Build logs not found' }, { status: 404 })
    }

    return new NextResponse(logContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="build-${id}.log"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed to fetch build logs: ${msg}` }, { status: 500 })
  }
}
