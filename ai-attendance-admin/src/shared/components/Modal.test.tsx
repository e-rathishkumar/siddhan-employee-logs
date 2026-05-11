import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../../shared/components/Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal isOpen={false} onClose={jest.fn()} title="Test">Content</Modal>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Test Modal">Modal Content</Modal>);
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>);
    const closeBtn = screen.getByRole('button');
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = jest.fn();
    const { container } = render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>);
    const backdrop = container.querySelector('.bg-black\\/50');
    if (backdrop) await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
