import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import CodeBlock from '@/components/code-block'

vi.mock('highlight.js/lib/core', () => {
  const hljs = {
    registerLanguage: vi.fn(),
    highlightElement: vi.fn((el: HTMLElement) => {
      el.setAttribute('data-highlighted', 'yes')
    }),
  }
  return { default: hljs }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('CodeBlock', () => {
  it('renders line numbers for each line', () => {
    const content = ['a', 'b', 'c'].join('\n')
    render(<CodeBlock content={content} filename="test.ts" />)

    const line1 = screen.getByText('1')
    const line2 = screen.getByText('2')
    const line3 = screen.getByText('3')

    expect(line1).toBeInTheDocument()
    expect(line2).toBeInTheDocument()
    expect(line3).toBeInTheDocument()
    expect(line1).not.toBe(line2)
  })

  it('renders the code content', () => {
    render(<CodeBlock content="const x = 1" filename="script.js" />)

    expect(screen.getByText('const x = 1')).toBeInTheDocument()
  })

  it('sets language class from TypeScript extension', () => {
    render(<CodeBlock content="type T = string" filename="types.ts" />)
    expect(document.querySelector('code.language-typescript')).toBeTruthy()
  })

  it('sets language class from Python extension', () => {
    render(<CodeBlock content="print('hi')" filename="script.py" />)
    expect(document.querySelector('code.language-python')).toBeTruthy()
  })

  it('sets language class from Go extension', () => {
    render(<CodeBlock content="package main" filename="main.go" />)
    expect(document.querySelector('code.language-go')).toBeTruthy()
  })

  it('sets language class from Rust extension', () => {
    render(<CodeBlock content="fn main()" filename="main.rs" />)
    expect(document.querySelector('code.language-rust')).toBeTruthy()
  })

  it('sets language class from JSON extension', () => {
    render(<CodeBlock content='{"ok":true}' filename="config.json" />)
    expect(document.querySelector('code.language-json')).toBeTruthy()
  })

  it('sets language class from CSS extension', () => {
    render(<CodeBlock content="body {}" filename="style.css" />)
    expect(document.querySelector('code.language-css')).toBeTruthy()
  })

  it('sets language class from Markdown extension', () => {
    render(<CodeBlock content="# Title" filename="readme.md" />)
    expect(document.querySelector('code.language-markdown')).toBeTruthy()
  })

  it('does not set language class for unknown extensions', () => {
    render(<CodeBlock content="some data" filename="file.xyz" />)

    const code = document.querySelector('code')
    expect(code?.className).toBe('')
  })

  it('works without a filename', () => {
    render(<CodeBlock content="plain text" />)

    expect(screen.getByText('plain text')).toBeInTheDocument()
    expect(document.querySelector('code')?.className).toBe('')
  })

  it('renders one line number for single line', () => {
    render(<CodeBlock content="hello" filename="hello.txt" />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })

  it('renders correct number of lines for multiline content', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`)
    render(<CodeBlock content={lines.join('\n')} filename="large.ts" />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })
})
