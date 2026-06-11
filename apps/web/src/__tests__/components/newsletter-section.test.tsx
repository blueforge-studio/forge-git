import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import NewsletterSection from '@/components/landing/newsletter-section'

afterEach(() => cleanup())

describe('NewsletterSection', () => {
  it('renders the newsletter section', () => {
    render(<NewsletterSection />)
    expect(screen.getByTestId('newsletter-section')).toBeInTheDocument()
  })

  it('renders the email form', () => {
    render(<NewsletterSection />)
    expect(screen.getByTestId('newsletter-form')).toBeInTheDocument()
    expect(screen.getByTestId('newsletter-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('newsletter-submit-btn')).toBeInTheDocument()
  })

  it('renders the heading', () => {
    render(<NewsletterSection />)
    expect(screen.getByText('heading')).toBeInTheDocument()
  })

  it('has an email input with correct attributes', () => {
    render(<NewsletterSection />)
    const input = screen.getByTestId('newsletter-email-input')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('placeholder', 'placeholder')
  })
})
