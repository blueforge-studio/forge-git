import Link from 'next/link'
import { Button } from '@forge-git/ui'

export default function NotFound() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground/30 mb-4">404</h1>
      <p className="text-lg font-medium mb-2">Page not found</p>
      <p className="text-sm text-muted-foreground mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </main>
  )
}
