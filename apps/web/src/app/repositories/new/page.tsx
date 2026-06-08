import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import CreateRepoForm from '@/components/create-repo-form'

export default async function NewRepoPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-1">Create Repository</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Host a new repository on {session.baseUrl}
      </p>
      <CreateRepoForm />
    </main>
  )
}
