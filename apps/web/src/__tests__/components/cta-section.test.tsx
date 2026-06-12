import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import CtaSection from '@/components/landing/cta-section'

afterEach(() => cleanup())

async function renderAsync(element: React.ReactElement) {
  const Component = element.type as (...args: any[]) => Promise<React.ReactElement>
  const jsx = await Component(element.props)
  return render(jsx)
}

describe('CtaSection', () => {
  it('renders the CTA section', async () => {
    await renderAsync(<CtaSection />)
    expect(screen.getByTestId('cta-section')).toBeInTheDocument()
  })

  it('renders the heading', async () => {
    await renderAsync(<CtaSection />)
    expect(screen.getByText('heading')).toBeInTheDocument()
  })

  it('renders the get started CTA with correct href', async () => {
    await renderAsync(<CtaSection />)
    const cta = screen.getByTestId('cta-get-started')
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/login')
    expect(cta).toHaveTextContent('button')
  })
})
