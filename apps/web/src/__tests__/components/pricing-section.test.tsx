import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import PricingSection from '@/components/landing/pricing-section'

afterEach(() => cleanup())

async function renderAsync(element: React.ReactElement) {
  const Component = element.type as (...args: any[]) => Promise<JSX.Element>
  const jsx = await Component(element.props)
  return render(jsx)
}

describe('PricingSection', () => {
  it('renders the pricing section', async () => {
    await renderAsync(<PricingSection />)
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument()
  })

  it('renders all three tiers', async () => {
    await renderAsync(<PricingSection />)
    expect(screen.getByTestId('pricing-tier-free.name')).toBeInTheDocument()
    expect(screen.getByTestId('pricing-tier-pro.name')).toBeInTheDocument()
    expect(screen.getByTestId('pricing-tier-enterprise.name')).toBeInTheDocument()
  })

  it('highlights Pro as most popular', async () => {
    await renderAsync(<PricingSection />)
    expect(screen.getByText('mostPopular')).toBeInTheDocument()
  })

  it('renders tier names and prices', async () => {
    await renderAsync(<PricingSection />)
    expect(screen.getByText('free.name')).toBeInTheDocument()
    expect(screen.getByText('pro.name')).toBeInTheDocument()
    expect(screen.getByText('enterprise.name')).toBeInTheDocument()
    expect(screen.getByText('free.price')).toBeInTheDocument()
    expect(screen.getByText('pro.price')).toBeInTheDocument()
    expect(screen.getByText('enterprise.price')).toBeInTheDocument()
  })
})
