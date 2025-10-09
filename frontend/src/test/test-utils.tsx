import { vi } from 'vitest'

// Mock user for testing
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  fullName: 'Test User',
  isEmailVerified: true,
  createdAt: '2024-01-01T00:00:00Z'
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

// Mock API responses
export const mockApiResponse = {
  signup: {
    user: mockUser,
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }
  },
  login: {
    user: mockUser,
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }
  },
  me: mockUser,
}
