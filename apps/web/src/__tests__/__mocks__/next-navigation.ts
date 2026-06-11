import { vi } from 'vitest'

export const useRouter = vi.fn().mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
  refresh: vi.fn(),
})

export const usePathname = vi.fn().mockReturnValue('/')
export const useSearchParams = vi.fn().mockReturnValue(new URLSearchParams())
export const useParams = vi.fn().mockReturnValue({})

export const redirect = vi.fn()
export const notFound = vi.fn()
export const permanentRedirect = vi.fn()

export const ReadonlyURLSearchParams = URLSearchParams
