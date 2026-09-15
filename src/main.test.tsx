import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './main';
import { cleanup } from '@testing-library/react';

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('scorecard workflow', () => {
  it('starts a game, records a score, and resumes after remount', () => {
    const first = render(<App />);
    fireEvent.change(screen.getByLabelText('Player name'), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: /start new game/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Score 5' }));
    expect(screen.getByText('Current score').parentElement).toHaveTextContent('5');
    first.unmount();

    render(<App />);
    expect(screen.getByText(/setup 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('shows completed scorecards as read-only history', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Player name'), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: /start new game/i }));
    for (let shot = 0; shot < 20; shot += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Score 5' }));
    }
    fireEvent.click(screen.getByRole('button', { name: /finish scorecard/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Scorecards$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Ada/ }));
    expect(screen.getByText('Final score')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Score 5' })).not.toBeInTheDocument();
  });
});
