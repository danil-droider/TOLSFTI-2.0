

const createLocalStorageMock = (): Storage => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string): string | null => {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem: (key: string, value: string): void => {
      store[key] = String(value)
    },
    removeItem: (key: string): void => {
      delete store[key]
    },
    clear: (): void => {
      store = {}
    },
  } as unknown as Storage
}

Object.defineProperty(globalThis, "localStorage", {
  value: createLocalStorageMock(),
  writable: true,
  configurable: true,
})
