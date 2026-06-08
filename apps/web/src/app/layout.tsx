import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'forge-git — Self-hosted Git Platform',
  description: 'Host repositories, manage pull requests and issues, publish releases, and run CI/CD pipelines — powered by Gitea.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
