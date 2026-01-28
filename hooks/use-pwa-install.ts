"use client";

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') return;
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      return { success: false, message: 'Not in browser environment' };
    }
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return { success: false, message: 'Already installed' };
    }

    // For iOS Safari, we can't programmatically install - just return false
    if (isIOSSafari()) {
      return { success: false, message: 'iOS requires manual installation' };
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstallable(false);
          alert('🎉 App installed successfully! You can now access ANDACTION from your home screen.');
          return { success: true, message: 'App installed successfully' };
        } else {
          return { success: false, message: 'Installation cancelled' };
        }
      } catch (error) {
        console.error('Error installing app:', error);
        return { success: false, message: 'Installation failed' };
      }
    }

    // No deferred prompt available - browser doesn't support PWA install or prompt wasn't captured
    return { success: false, message: 'Installation not available' };
  };

  const isIOSSafari = () => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    return iOS && webkit && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
    isIOSSafari: isIOSSafari(),
  };
}
