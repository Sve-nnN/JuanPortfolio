import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '../../../src/components/Pagination';

// Mock the useRouter hook
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('Pagination component', () => {
  it('renders correctly on the first page', () => {
    render(<Pagination page={1} totalPages={10} />);
    expect(screen.getByText('1')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('renders correctly on a middle page', () => {
    render(<Pagination page={5} totalPages={10} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Previous')).not.toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('renders correctly on the last page', () => {
    render(<Pagination page={10} totalPages={10} />);
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Previous')).not.toBeDisabled();
  });

  it('calls router.push with the correct page number on click', () => {
    render(<Pagination page={5} totalPages={10} />);
    fireEvent.click(screen.getByText('6'));
    expect(mockPush).toHaveBeenCalledWith('/blog/page/6');
    fireEvent.click(screen.getByText('4'));
    expect(mockPush).toHaveBeenCalledWith('/blog/page/4');
    fireEvent.click(screen.getByText('Next'));
    expect(mockPush).toHaveBeenCalledWith('/blog/page/6');
    fireEvent.click(screen.getByText('Previous'));
    expect(mockPush).toHaveBeenCalledWith('/blog/page/4');
  });
});
