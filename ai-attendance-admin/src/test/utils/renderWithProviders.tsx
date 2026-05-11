import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

function AllProviders({ children, initialEntries = ['/'] }: { children: React.ReactNode; initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialEntries, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
