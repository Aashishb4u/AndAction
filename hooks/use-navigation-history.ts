'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface NavigationHistoryOptions {
  fallbackPath?: string;
  minHistoryLength?: number;
}

<<<<<<< HEAD
const NAVIGATION_RETURN_KEY = 'artistProfile:returnTo';

=======
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
export const useNavigationHistory = (options: NavigationHistoryOptions = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { fallbackPath = '/', minHistoryLength = 2 } = options;

<<<<<<< HEAD
  const setReturnPath = useCallback((path: string = pathname || '/') => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(NAVIGATION_RETURN_KEY, path);
    }
  }, [pathname]);

  const getReturnPath = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(NAVIGATION_RETURN_KEY);
  }, []);

  const clearReturnPath = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(NAVIGATION_RETURN_KEY);
    }
  }, []);

=======
  /**
   * Set the return path before navigating to a detail page
   * This ensures back navigation works properly
   */
  const setReturnPath = useCallback((path: string = pathname) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('navigation:previousPath', path);
    }
  }, [pathname]);

  /**
   * Get the stored return path
   */
  const getReturnPath = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('navigation:previousPath');
  }, []);

  /**
   * Clear the stored return path
   */
  const clearReturnPath = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('navigation:previousPath');
    }
  }, []);

  /**
   * Navigate back intelligently:
   * 1. If there's a stored previous path, use it (best for detail pages)
   * 2. If there's valid browser history, use router.back()
   * 3. Otherwise, fall back to the specified path
   */
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
  const goBack = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push(fallbackPath);
      return;
    }

<<<<<<< HEAD
    const storedPath = getReturnPath();
    if (storedPath && storedPath !== pathname && storedPath.startsWith('/')) {
      clearReturnPath();
=======
    // Check if there's a stored return path
    const storedPath = getReturnPath();
    if (storedPath && storedPath !== pathname && storedPath.startsWith('/')) {
      clearReturnPath();
      // Use replace() instead of push() to not add duplicate history entries
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
      router.replace(storedPath);
      return;
    }

<<<<<<< HEAD
=======
    // Check if there's actual browser history to go back to
    // history.length includes the current page, so we need at least 2
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
    if (window.history.length > minHistoryLength) {
      router.back();
      return;
    }

<<<<<<< HEAD
=======
    // Fallback to the specified path
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
    clearReturnPath();
    router.push(fallbackPath);
  }, [router, fallbackPath, pathname, getReturnPath, clearReturnPath, minHistoryLength]);

<<<<<<< HEAD
=======
  /**
   * Navigate back to artists list specifically
   * Useful for artist profile pages
   */
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
  const goBackToArtists = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push('/artists');
      return;
    }

    const storedPath = getReturnPath();
<<<<<<< HEAD
    if (storedPath && (storedPath.startsWith('/artists') || storedPath.startsWith('/search'))) {
      clearReturnPath();
=======
    
    // If stored path is artists page or search, use it
    if (storedPath && (storedPath.startsWith('/artists') || storedPath.startsWith('/search'))) {
      clearReturnPath();
      // Use replace() instead of push() to not add duplicate history entries
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
      router.replace(storedPath);
      return;
    }

<<<<<<< HEAD
=======
    // Check browser history
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
    if (window.history.length > minHistoryLength) {
      router.back();
      return;
    }

<<<<<<< HEAD
=======
    // Fallback
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
    router.push('/artists');
  }, [router, getReturnPath, clearReturnPath, minHistoryLength]);

  return {
<<<<<<< HEAD
    setReturnPath,
    getReturnPath,
    clearReturnPath,
    goBack,
    goBackToArtists,
=======
    goBack,
    goBackToArtists,
    setReturnPath,
    getReturnPath,
    clearReturnPath,
>>>>>>> 5b946b90555d6bd5f91bab195941f4c812dda396
  };
};
