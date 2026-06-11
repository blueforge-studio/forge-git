import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import Header from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import ErrorTrackerProvider from '@/components/error-tracker-provider'

export const metadata: Metadata = {
  title: 'Forge git — Self-hosted Git Platform',
  description:
    'Host repositories, manage pull requests and issues, publish releases, and run CI/CD pipelines — powered by Gitea.',
  icons: {
    icon: '/images/favicon.webp',
    apple: '/images/apple-touch-icon.webp',
  },
  openGraph: {
    title: 'Forge git — Self-hosted Git Platform',
    description:
      'A modern UI and powerful CI/CD on top of your own Gitea instance.',
    images: [{ url: '/images/og-image.webp', width: 1200, height: 630 }],
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <ErrorTrackerProvider>
          <ThemeProvider>
            <NextIntlClientProvider messages={messages}>
              <Header />
              {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </ErrorTrackerProvider>
      </body>
    </html>
  )
}
