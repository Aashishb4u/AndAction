'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface NavigationHistoryOptions {
  fallbackPath?: string;
  minHistoryLength?: number;
}

const NAVIGATION_RETURN_KEY = 'artistProfile:returnTo';
const NAVIGATION_RETURN_TARGET_KEY = 'artistProfile:returnTarget';

export const useNavigationHistory = (options: NavigationHistoryOptions = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { fallbackPath = '/', minHistoryLength = 2 } = options;

  const disableSmoothScrollTemporarily = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlBehavior = html.style.scrollBehavior;
    const previousBodyBehavior = body.style.scrollBehavior;

    html.style.scrollBehavior = 'auto';
    body.style.scrollBehavior = 'auto';

    window.setTimeout(() => {
      html.style.scrollBehavior = previousHtmlBehavior;
      body.style.scrollBehavior = previousBodyBehavior;
    }, 250);
  }, []);

  const navigateWithoutSmoothScroll = useCallback((navigate: () => void) => {
    disableSmoothScrollTemporarily();
    navigate();
  }, [disableSmoothScrollTemporarily]);

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

  const setReturnTarget = useCallback((target: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(NAVIGATION_RETURN_TARGET_KEY, target);
    }
  }, []);

  const getReturnTarget = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(NAVIGATION_RETURN_TARGET_KEY);
  }, []);

  const clearReturnTarget = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(NAVIGATION_RETURN_TARGET_KEY);
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

  const goBackInstant = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push(fallbackPath);
      return;
    }

    if (window.history.length > minHistoryLength) {
      navigateWithoutSmoothScroll(() => router.back());
      return;
    }

    const storedPath = getReturnPath();
    if (storedPath && storedPath !== pathname && storedPath.startsWith('/')) {
      clearReturnPath();
      navigateWithoutSmoothScroll(() => router.replace(storedPath));
      return;
    }

    clearReturnPath();
    navigateWithoutSmoothScroll(() => router.push(fallbackPath));
  }, [
    router,
    fallbackPath,
    pathname,
    getReturnPath,
    clearReturnPath,
    minHistoryLength,
    navigateWithoutSmoothScroll,
  ]);

  const goBackToArtists = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push('/artists');
      return;
    }

    const storedPath = getReturnPath();
    if (storedPath && (storedPath.startsWith('/artists') || storedPath.startsWith('/search'))) {
      clearReturnPath();
      navigateWithoutSmoothScroll(() => router.replace(storedPath));
      return;
    }

    // If we're on an artist profile page, always go back to /artists even if history is long
    if (pathname.startsWith('/artists/')) {
      navigateWithoutSmoothScroll(() => router.push('/artists'));
      return;
    }

    if (window.history.length > minHistoryLength) {
      navigateWithoutSmoothScroll(() => router.back());
      return;
    }

    navigateWithoutSmoothScroll(() => router.push('/artists'));
  }, [router, pathname, getReturnPath, clearReturnPath, minHistoryLength, navigateWithoutSmoothScroll]);

  return {
    setReturnPath,
    setReturnTarget,
    getReturnPath,
    getReturnTarget,
    clearReturnPath,
    clearReturnTarget,
    goBack,
    disableSmoothScrollTemporarily,
    goBackInstant,
    goBackToArtists,
  };
};
