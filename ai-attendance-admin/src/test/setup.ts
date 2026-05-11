import '@testing-library/jest-dom';

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
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:8000/api/v1',
    VITE_WS_URL: 'ws://localhost:8000/ws',
    VITE_MAP_TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    VITE_DEFAULT_CENTER_LAT: '28.6139',
    VITE_DEFAULT_CENTER_LNG: '77.2090',
  },
});
