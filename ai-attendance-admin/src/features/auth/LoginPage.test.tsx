import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../../stores/authStore';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockNavigate.mockReset();
  useAuthStore.getState().logout();
});
afterAll(() => server.close());

describe('LoginPage', () => {
  const renderLogin = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByText('AttendAI')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'invalid');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('validates minimum password length', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
    await userEvent.type(screen.getByLabelText('Password'), '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('logs in successfully with valid credentials', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('admin@test.com');
  });

  it('shows error on invalid credentials', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'wrong@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows error on server failure', async () => {
    server.use(
      http.post('http://localhost:8000/api/v1/auth/login', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      })
    );

    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});
