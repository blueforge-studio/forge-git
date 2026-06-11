import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import HeroSection from '@/components/landing/hero-section'

afterEach(() => cleanup())

async function renderAsync(element: React.ReactElement) {
  const Component = element.type as (...args: any[]) => Promise<JSX.Element>
  const jsx = await Component(element.props)
  return render(jsx)
}

describe('HeroSection', () => {
  it('renders the hero section', async () => {
    await renderAsync(<HeroSection />)
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
  })

  it('renders the heading', async () => {
    await renderAsync(<HeroSection />)
    expect(screen.getByTestId('hero-heading')).toBeInTheDocument()
    expect(screen.getByText('heading2')).toBeInTheDocument()
  })

  it('renders the sign-in CTA button', async () => {
    await renderAsync(<HeroSection />)
    const cta = screen.getByTestId('hero-sign-in-cta')
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/login')
  })

  it('renders the how it works link', async () => {
    await renderAsync(<HeroSection />)
    expect(screen.getByText('howItWorksCta')).toBeInTheDocument()
    expect(screen.getByText('howItWorksCta').closest('a')).toHaveAttribute('href', '#how-it-works')
  })

  it('renders the stats row', async () => {
    await renderAsync(<HeroSection />)
    expect(screen.getByText('statSelfHosted')).toBeInTheDocument()
    expect(screen.getByText('statOpenSource')).toBeInTheDocument()
    expect(screen.getByText('statCicd')).toBeInTheDocument()
  })
})
