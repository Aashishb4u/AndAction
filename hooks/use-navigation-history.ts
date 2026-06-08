'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface NavigationHistoryOptions {
  fallbackPath?: string;
  minHistoryLength?: number;
}

const NAVIGATION_RETURN_KEY = 'artistProfile:returnTo';

export const useNavigationHistory = (options: NavigationHistoryOptions = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { fallbackPath = '/', minHistoryLength = 2 } = options;

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

  const goBack = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push(fallbackPath);
      return;
    }

    const storedPath = getReturnPath();
    if (storedPath && storedPath !== pathname && storedPath.startsWith('/')) {
      clearReturnPath();
      router.replace(storedPath);
      return;
    }

    if (window.history.length > minHistoryLength) {
      router.back();
      return;
    }

    clearReturnPath();
    router.push(fallbackPath);
  }, [router, fallbackPath, pathname, getReturnPath, clearReturnPath, minHistoryLength]);

  const goBackToArtists = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push('/artists');
      return;
    }

    const storedPath = getReturnPath();
    if (storedPath && (storedPath.startsWith('/artists') || storedPath.startsWith('/search'))) {
      clearReturnPath();
      router.replace(storedPath);
      return;
    }

    // If we're on an artist profile page, always go back to /artists even if history is long
    if (pathname.startsWith('/artists/')) {
      router.push('/artists');
      return;
    }

    if (window.history.length > minHistoryLength) {
      router.back();
      return;
    }

    router.push('/artists');
  }, [router, pathname, getReturnPath, clearReturnPath, minHistoryLength]);

  return {
    setReturnPath,
    getReturnPath,
    clearReturnPath,
    goBack,
    goBackToArtists,
  };
};
