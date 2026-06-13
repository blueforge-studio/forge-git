import type { StorageAdapter, ErrorGroup, ErrorEvent, ErrorStatus } from '@blueforge-studio/error-tracker'
import { getPool } from '@forge-git/db'

export class PgStorageAdapter implements StorageAdapter {
  async getErrorGroup(fingerprint: string): Promise<ErrorGroup | null> {
    const { rows } = await getPool().query(
      'SELECT * FROM error_groups WHERE fingerprint = $1',
      [fingerprint],
    )
    if (rows.length === 0) return null
    return rowToErrorGroup(rows[0])
  }

  async createErrorGroup(group: ErrorGroup): Promise<void> {
    await getPool().query(
      `INSERT INTO error_groups (fingerprint, message, stack, app_name, environment, first_seen, last_seen, last_url, count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [group.fingerprint, group.message, group.stack, group.appName, group.environment,
       group.firstSeen, group.lastSeen, group.lastUrl, group.count, group.status],
    )
  }

  async updateErrorGroup(fingerprint: string, updates: Partial<ErrorGroup>): Promise<void> {
    const set: string[] = []
    const vals: unknown[] = []
    let i = 1
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) continue
      set.push(`${camelToSnake(k)} = $${i++}`)
      vals.push(v)
    }
    if (set.length === 0) return
    vals.push(fingerprint)
    await getPool().query(
      `UPDATE error_groups SET ${set.join(', ')} WHERE fingerprint = $${i}`,
      vals,
    )
  }

  async createErrorEvent(event: ErrorEvent): Promise<void> {
    await getPool().query(
      `INSERT INTO error_events (fingerprint, message, stack, component_stack, url, user_agent, user_id, app_name, environment, timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [event.fingerprint, event.message, event.stack, event.componentStack, event.url,
       event.userAgent, event.userId, event.appName, event.environment, event.timestamp,
       JSON.stringify(event.metadata ?? {})],
    )
  }

  async createErrorEventsBatch(events: ErrorEvent[]): Promise<void> {
    if (events.length === 0) return
    const cols = ['fingerprint', 'message', 'stack', 'component_stack', 'url', 'user_agent', 'user_id', 'app_name', 'environment', 'timestamp', 'metadata']
    const rows: string[] = []
    const vals: unknown[] = []
    let i = 1
    for (const e of events) {
      const placeholders = cols.map(() => `$${i++}`)
      rows.push(`(${placeholders.join(', ')})`)
      vals.push(e.fingerprint, e.message, e.stack, e.componentStack, e.url, e.userAgent, e.userId, e.appName, e.environment, e.timestamp, JSON.stringify(e.metadata ?? {}))
    }
    await getPool().query(
      `INSERT INTO error_events (${cols.join(', ')}) VALUES ${rows.join(', ')}`,
      vals,
    )
  }

  async queryErrorGroups(options: { status?: ErrorStatus; limit?: number; orderBy?: 'lastSeen' | 'count'; order?: 'asc' | 'desc' }): Promise<ErrorGroup[]> {
    let q = 'SELECT * FROM error_groups WHERE 1=1'
    const vals: unknown[] = []
    let i = 1
    if (options.status) {
      q += ` AND status = $${i++}`
      vals.push(options.status)
    }
    const orderBy = options.orderBy === 'count' ? 'count' : 'last_seen'
    q += ` ORDER BY ${orderBy} ${options.order === 'asc' ? 'ASC' : 'DESC'}`
    q += ` LIMIT $${i++}`
    vals.push(options.limit ?? 50)
    const { rows } = await getPool().query(q, vals)
    return rows.map(rowToErrorGroup)
  }

  async queryErrorEvents(options: { fingerprint: string; limit?: number }): Promise<ErrorEvent[]> {
    const { rows } = await getPool().query(
      'SELECT * FROM error_events WHERE fingerprint = $1 ORDER BY timestamp DESC LIMIT $2',
      [options.fingerprint, options.limit ?? 50],
    )
    return rows.map(rowToErrorEvent)
  }

  async getErrorTrends(options: { appName?: string; fingerprint?: string; from: string; to: string; bucketMinutes?: number }): Promise<Array<{ bucket: string; count: number }>> {
    const bucketMin = options.bucketMinutes ?? 60
    const { rows } = await getPool().query(
      `SELECT date_trunc('hour', timestamp) + INTERVAL '${bucketMin} min' * FLOOR(EXTRACT(MINUTE FROM timestamp) / $3) AS bucket,
              COUNT(*)::int AS count
       FROM error_events
       WHERE timestamp >= $1 AND timestamp <= $2
       GROUP BY bucket ORDER BY bucket`,
      [options.from, options.to, bucketMin],
    )
    return rows
  }
}

function rowToErrorGroup(r: any): ErrorGroup {
  return {
    fingerprint: r.fingerprint,
    message: r.message,
    stack: r.stack,
    appName: r.app_name ?? r.appName,
    environment: r.environment,
    firstSeen: r.first_seen ?? r.firstSeen,
    lastSeen: r.last_seen ?? r.lastSeen,
    lastUrl: r.last_url ?? r.lastUrl,
    count: r.count,
    status: r.status,
  }
}

function rowToErrorEvent(r: any): ErrorEvent {
  return {
    fingerprint: r.fingerprint,
    message: r.message,
    stack: r.stack,
    componentStack: r.component_stack ?? r.componentStack,
    url: r.url,
    userAgent: r.user_agent ?? r.userAgent,
    userId: r.user_id ?? r.userId,
    appName: r.app_name ?? r.appName,
    environment: r.environment,
    timestamp: r.timestamp,
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata ?? null),
  }
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())
}
