import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import HowItWorksSection from '@/components/landing/how-it-works-section'

afterEach(() => cleanup())

async function renderAsync(element: React.ReactElement) {
  const Component = element.type as (...args: any[]) => Promise<React.ReactElement>
  const jsx = await Component(element.props)
  return render(jsx)
}

describe('HowItWorksSection', () => {
  it('renders the section', async () => {
    await renderAsync(<HowItWorksSection />)
    expect(screen.getByTestId('how-it-works-section')).toBeInTheDocument()
  })

  it('renders all three steps', async () => {
    await renderAsync(<HowItWorksSection />)
    expect(screen.getByTestId('how-it-works-step-1')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works-step-2')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works-step-3')).toBeInTheDocument()
  })

  it('renders step titles', async () => {
    await renderAsync(<HowItWorksSection />)
    expect(screen.getByText('step1.title')).toBeInTheDocument()
    expect(screen.getByText('step2.title')).toBeInTheDocument()
    expect(screen.getByText('step3.title')).toBeInTheDocument()
  })
})
