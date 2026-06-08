'use client'

import { signOutAction } from './actions'

export default function SignOutForm() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex items-center h-9 px-4 rounded-md border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
      >
        Sign Out
      </button>
    </form>
  )
}
