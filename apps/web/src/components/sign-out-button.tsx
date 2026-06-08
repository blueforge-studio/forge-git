'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/signout', { method: 'POST' })
        router.push('/')
        router.refresh()
      }}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )
}
