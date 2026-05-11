import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EmployeeListPage } from './EmployeeListPage';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('EmployeeListPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <EmployeeListPage />
      </MemoryRouter>
    );

  it('shows loading state initially', () => {
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders employee list after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows total count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('2 total employees')).toBeInTheDocument();
    });
  });

  it('shows add employee button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Employee' })).toBeInTheDocument();
    });
  });

  it('opens form modal on add employee click', async () => {
    renderPage();
    await waitFor(() => screen.getByText('John Doe'));
    await userEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/employees', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      })
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('has search input', async () => {
    renderPage();
    await waitFor(() => screen.getByText('John Doe'));
    expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
  });
});
