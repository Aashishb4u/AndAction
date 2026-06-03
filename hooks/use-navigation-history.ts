'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface NavigationHistoryOptions {
  fallbackPath?: string;
  minHistoryLength?: number;
}

export const useNavigationHistory = (options: NavigationHistoryOptions = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { fallbackPath = '/', minHistoryLength = 2 } = options;

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
  const goBack = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push(fallbackPath);
      return;
    }

    // Check if there's a stored return path
    const storedPath = getReturnPath();
    if (storedPath && storedPath !== pathname && storedPath.startsWith('/')) {
      clearReturnPath();
      // Use replace() instead of push() to not add duplicate history entries
      router.replace(storedPath);
      return;
    }

    // Check if there's actual browser history to go back to
    // history.length includes the current page, so we need at least 2
    if (window.history.length > minHistoryLength) {
      router.back();
      return;
    }

    // Fallback to the specified path
    clearReturnPath();
    router.push(fallbackPath);
  }, [router, fallbackPath, pathname, getReturnPath, clearReturnPath, minHistoryLength]);

  /**
   * Navigate back to artists list specifically
   * Useful for artist profile pages
   */
  const goBackToArtists = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push('/artists');
      return;
    }

    const storedPath = getReturnPath();
    
    // If stored path is artists page or search, use it
    if (storedPath && (storedPath.startsWith('/artists') || storedPath.startsWith('/search'))) {
      clearReturnPath();
      // Use replace() instead of push() to not add duplicate history entries
      router.replace(storedPath);
      return;
    }

    // Check browser history
    if (window.history.length > minHistoryLength) {
      router.back();
      return;
    }

    // Fallback
    router.push('/artists');
  }, [router, getReturnPath, clearReturnPath, minHistoryLength]);

  return {
    goBack,
    goBackToArtists,
    setReturnPath,
    getReturnPath,
    clearReturnPath,
  };
};
