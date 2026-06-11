import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import FeatureGrid from '@/components/feature-grid'

afterEach(() => cleanup())

async function renderAsync(element: React.ReactElement) {
  const Component = element.type as (...args: any[]) => Promise<JSX.Element>
  const jsx = await Component(element.props)
  return render(jsx)
}

describe('FeatureGrid', () => {
  it('renders the feature grid', async () => {
    await renderAsync(<FeatureGrid />)
    expect(screen.getByTestId('feature-grid')).toBeInTheDocument()
  })

  it('renders all six features', async () => {
    await renderAsync(<FeatureGrid />)
    expect(screen.getByTestId('feature-card-gitHosting')).toBeInTheDocument()
    expect(screen.getByTestId('feature-card-pullRequests')).toBeInTheDocument()
    expect(screen.getByTestId('feature-card-issueTracking')).toBeInTheDocument()
    expect(screen.getByTestId('feature-card-releaseManagement')).toBeInTheDocument()
    expect(screen.getByTestId('feature-card-cicdPipeline')).toBeInTheDocument()
    expect(screen.getByTestId('feature-card-teamManagement')).toBeInTheDocument()
  })

  it('renders correct titles', async () => {
    await renderAsync(<FeatureGrid />)
    expect(screen.getByText('gitHosting.title')).toBeInTheDocument()
    expect(screen.getByText('pullRequests.title')).toBeInTheDocument()
    expect(screen.getByText('issueTracking.title')).toBeInTheDocument()
  })
})
