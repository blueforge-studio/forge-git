import type { ReactNode } from 'react'
import './globals.css'
import Header from '@/components/header'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}