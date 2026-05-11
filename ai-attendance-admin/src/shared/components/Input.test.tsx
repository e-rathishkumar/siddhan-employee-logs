import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../shared/components/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('shows helper text when no error', () => {
    render(<Input label="Email" helperText="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('hides helper text when error present', () => {
    render(<Input label="Email" helperText="Enter your email" error="Required" />);
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    render(<Input label="Name" />);
    const input = screen.getByLabelText('Name');
    await userEvent.type(input, 'John');
    expect(input).toHaveValue('John');
  });

  it('applies error styles on error', () => {
    render(<Input label="Email" error="Bad" />);
    expect(screen.getByLabelText('Email')).toHaveClass('border-red-300');
  });
});
