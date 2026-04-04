import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Pantheon landing page', () => {
  render(<App />);
  expect(screen.getByText(/Where 100% is just the beginning/i)).toBeInTheDocument();
});
