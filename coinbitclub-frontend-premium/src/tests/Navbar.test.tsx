import React from 'react';
import { render, screen } from '@testing-library/react'
import Navbar from '../components/Navbar'
import ThemeProvider from '../components/ThemeProvider'

test('renders navbar links', () => {
  render(
    <ThemeProvider>
      <Navbar />
    </ThemeProvider>,
  )
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})
