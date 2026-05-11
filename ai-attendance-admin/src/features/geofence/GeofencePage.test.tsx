import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GeofencePage } from './GeofencePage';
import { server } from '../../test/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GeofencePage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <GeofencePage />
      </MemoryRouter>
    );

  it('shows loading state initially', () => {
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders geofence zones', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Main Office')).toBeInTheDocument();
    });
  });

  it('shows zone details', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('123 Business Park')).toBeInTheDocument();
      expect(screen.getByText('Radius: 200m')).toBeInTheDocument();
    });
  });

  it('renders map container', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  it('has add zone button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Zone' })).toBeInTheDocument();
    });
  });
});
