import '@testing-library/jest-dom';
// import { server } from './src/lib/mocks/server'; // Temporariamente comentado até MSW ser instalado

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;

  rootMargin: string = '';

  thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  
  disconnect() {}

  observe() {}

  unobserve() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}

  disconnect() {}

  observe() {}

  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// MSW Setup - Temporariamente comentado até MSW ser instalado
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
