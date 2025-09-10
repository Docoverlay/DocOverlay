import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../../App';

describe('App', () => {
  it('renders root container', () => {
    render(<App />);
    // Basic smoke test: look for any element
    expect(screen.getByText(/Doc/i)).toBeInTheDocument();
  });
});
