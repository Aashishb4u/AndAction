'use client';

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, getSession } from 'next-auth/react'; 

export interface User {
  id: string;
  email: string | null; 
  name?: string;
  role: 'user' | 'artist';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SignUpData {
    email?: string;
    countryCode?: string;
    phone?: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar: number; 
    state: string;
    city: string;
    noMarketing: boolean;
    shareData: boolean;
}

export const getRedirectUrl = (searchParams?: URLSearchParams): string => {
  const redirectTo = searchParams?.get('redirect');   
  if (redirectTo) {
    try {
      const url = new URL(redirectTo, window.location.origin);
      if (url.origin === window.location.origin) {
        return redirectTo;
      }
    } catch {
      // Invalid URL, fall back to home
      // TODO
    }
  }
  return '/';
};

export const createAuthRedirectUrl = (authPath: string, currentPath?: string): string => {
  if (!currentPath || currentPath === '/' || currentPath.startsWith('/auth')) {
    return authPath;
  }
    
  const url = new URL(authPath, window.location.origin);
  url.searchParams.set('redirect', currentPath);
  return url.pathname + url.search;
};

export const signIn = async (email: string): Promise<User> => {
    throw new Error("Sign in implementation is missing. Use nextAuthSignIn with credentials.");
};

/**
 * Sends the final consolidated user data to the production backend sign-up API.
 * The backend API handles the session creation (setting the secure cookie).
 * @param userData The full data payload from the multi-step form.
 * @returns The newly created User object from the backend.
 */
export const signUp = async (userData: SignUpData): Promise<{ user: User; contactIdentifier: string }> => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || 'Registration failed due to a server error.');
  }

  const responseData = await response.json();
  const newUserFromApi = responseData.data?.user;
  const contactIdentifier = responseData.data?.contactIdentifier;

  if (!newUserFromApi) {
    throw new Error('Registration succeeded but user data was missing from the response.');
  }

  const userForReturn: User = {
    id: newUserFromApi.id,
    email: newUserFromApi.email,
    name: newUserFromApi.firstName,
    role: newUserFromApi.role,
  };

  return { user: userForReturn, contactIdentifier };
};


export const signOut = async (): Promise<void> => {
    await nextAuthSignOut({ 
        redirect: false, // Prevents automatic redirect to the sign-in page
    });
};

export const getCurrentUser = async (): Promise<User | null> => {
    if (typeof window === 'undefined') return null;

    try {
        const session = await getSession();

        if (session?.user) {
            return {
                id: session.user.id,
                email: session.user.email || null,
                name: session.user.name || session.user.firstName,
            } as User;
        }
        return null;
    } catch (e) {
        console.error("Error retrieving session:", e);
        return null;
    }
};

export const signInWithGoogle = async (): Promise<void> => {
    await nextAuthSignIn('google', { callbackUrl: getRedirectUrl() });
};

export const signInWithApple = async (): Promise<void> => {
    await nextAuthSignIn('apple', { callbackUrl: getRedirectUrl() });
};