'use client'

import { signOutAction } from './actions'
import { Button } from '@forge-git/ui'

export default function SignOutForm() {
  return (
    <form action={signOutAction}>
      <Button variant="destructive" type="submit">
        Sign Out
      </Button>
    </form>
  )
}
