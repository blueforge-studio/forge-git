import type { ReactElement, JSX } from 'react'
import { render } from '@testing-library/react'

export async function renderAsync(element: ReactElement) {
  const Component = element.type as (...args: any[]) => Promise<JSX.Element>
  const jsx = await Component(element.props)
  return render(jsx)
}
