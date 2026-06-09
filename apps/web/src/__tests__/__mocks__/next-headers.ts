const mockCookieStore = {
  get: () => undefined,
  set: () => {},
  delete: () => {},
}

export function cookies() {
  return Promise.resolve(mockCookieStore)
}
