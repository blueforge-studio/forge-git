import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { ErrorDashboard } from '@blueforge-studio/error-tracker'
import { PgStorageAdapter } from '@/lib/error-storage'

export default async function ErrorsDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const adapter = new PgStorageAdapter()

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Error Dashboard</h1>
      <ErrorDashboard adapter={adapter} />
    </main>
  )
}
