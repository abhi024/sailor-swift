import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, AuthContext } from '../contexts/AuthContext'
import { vi } from 'vitest'

// Mock user for testing
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  isVerified: true,
  isActive: true,
  walletAddress: null,
  googleId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// Mock auth context value
export const mockAuthContext = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  googleAuth: vi.fn(),
  walletAuth: vi.fn(),
  refetchUser: vi.fn(),
}

// Mock authenticated context
export const mockAuthenticatedContext = {
  ...mockAuthContext,
  user: mockUser,
  isAuthenticated: true,
}

// Custom render function with providers
const AllTheProviders = ({
  children,
  authValue = mockAuthContext
}: {
  children: React.ReactNode
  authValue?: typeof mockAuthContext
}) => {
  return (
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    authValue?: typeof mockAuthContext
  }
) => {
  const { authValue, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: (props) => <AllTheProviders {...props} authValue={authValue} />,
    ...renderOptions,
  })
}

// Mock API responses
export const mockApiResponse = {
  signup: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
  },
  login: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
  },
  me: mockUser,
}

// Mock fetch for API calls
export const mockFetch = (response: any, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  })
}

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Export everything
export * from '@testing-library/react'
export { customRender as render }