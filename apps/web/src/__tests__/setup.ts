import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// i18n mocks for next-intl (server and client)
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(async (_namespace?: string) => {
    return (key: string, _params?: Record<string, unknown>) => key
  }),
  getLocale: vi.fn().mockResolvedValue('en'),
  getMessages: vi.fn().mockResolvedValue({}),
}))

vi.mock('next-intl', () => ({
  useTranslations: vi.fn().mockImplementation((_namespace?: string) => {
    return (key: string) => key
  }),
  useLocale: vi.fn().mockReturnValue('en'),
}))

vi.mock('next-intl/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ replace: vi.fn(), push: vi.fn() }),
  usePathname: vi.fn().mockReturnValue('/'),
  createNavigation: vi.fn(() => ({
    Link: vi.fn(),
    useRouter: vi.fn().mockReturnValue({ replace: vi.fn(), push: vi.fn() }),
    usePathname: vi.fn().mockReturnValue('/'),
  })),
}))

// Needed by locale-selector which imports from @/i18n/navigation (re-exports from next-intl/navigation)
vi.mock('@/i18n/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ replace: vi.fn(), push: vi.fn() }),
  usePathname: vi.fn().mockReturnValue('/'),
  Link: vi.fn(),
}))
