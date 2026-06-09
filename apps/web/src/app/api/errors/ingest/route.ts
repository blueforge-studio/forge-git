import { NextRequest, NextResponse } from 'next/server'
import { ingestErrors } from '@blueforge-studio/error-tracker'
import { PgStorageAdapter } from '@/lib/error-storage'

let adapter: PgStorageAdapter | null = null

function getAdapter(): PgStorageAdapter {
  if (!adapter) adapter = new PgStorageAdapter()
  return adapter
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    const result = await ingestErrors(getAdapter(), body, clientIp)

    return NextResponse.json(
      { ingested: result.fingerprints.length, fingerprints: result.fingerprints },
      { status: result.status },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[error-tracker] Ingest failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
