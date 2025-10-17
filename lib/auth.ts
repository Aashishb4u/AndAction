'use client';

// Authentication utilities and helpers

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'artist';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Get redirect URL from query params or default to home
export const getRedirectUrl = (searchParams?: URLSearchParams): string => {
  const redirectTo = searchParams?.get('redirect');
  
  // Validate redirect URL to prevent open redirects
  if (redirectTo) {
    try {
      const url = new URL(redirectTo, window.location.origin);
      // Only allow same-origin redirects
      if (url.origin === window.location.origin) {
        return redirectTo;
      }
    } catch {
      // Invalid URL, fall back to home
    }
  }
  
  return '/';
};

// Create redirect URL with current path as redirect parameter
export const createAuthRedirectUrl = (authPath: string, currentPath?: string): string => {
  if (!currentPath || currentPath === '/' || currentPath.startsWith('/auth')) {
    return authPath;
  }
  
  const url = new URL(authPath, window.location.origin);
  url.searchParams.set('redirect', currentPath);
  return url.pathname + url.search;
};

// Simulate authentication (replace with real API calls)
export const signIn = async (email: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful sign in
  const user: User = {
    id: '1',
    email,
    name: email.split('@')[0],
    role: 'user'
  };
  
  // Store in localStorage (replace with proper token management)
  localStorage.setItem('auth_user', JSON.stringify(user));
  
  return user;
};

export const signUp = async (email: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful sign up
  const user: User = {
    id: '1',
    email,
    name: email.split('@')[0],
    role: 'user'
  };
  
  // Store in localStorage (replace with proper token management)
  localStorage.setItem('auth_user', JSON.stringify(user));
  
  return user;
};

export const signOut = async (): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Remove from localStorage
  localStorage.removeItem('auth_user');
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// Social authentication helpers
export const signInWithGoogle = async (): Promise<User> => {
  // Implement Google OAuth flow
  console.log('Sign in with Google');
  throw new Error('Google sign-in not implemented yet');
};

export const signInWithApple = async (): Promise<User> => {
  // Implement Apple OAuth flow
  console.log('Sign in with Apple');
  throw new Error('Apple sign-in not implemented yet');
};
