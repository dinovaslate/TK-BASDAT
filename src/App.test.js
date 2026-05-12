import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AeroMiles landing page', () => {
  render(<App />);
  expect(screen.getByText(/AeroMiles unifies members/i)).toBeInTheDocument();
});
