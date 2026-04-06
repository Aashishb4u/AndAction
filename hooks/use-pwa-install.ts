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

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstallable(false);
          return { success: true, message: 'App installed successfully' };
        } else {
          return { success: false, message: 'Installation cancelled' };
        }
      } catch (error) {
        console.error('Error installing app:', error);
        return { success: false, message: 'Installation failed' };
      }
    }

    // No deferred prompt available — only show iOS share sheet hint since
    // iOS Safari doesn't support the beforeinstallprompt event at all.
    if (isIOSSafari()) {
      alert('To install this app:\n\n1. Tap the Share button (square with arrow)\n2. Tap "Add to Home Screen"');
      return { success: false, message: 'iOS instructions shown' };
    }
    
    return { success: false, message: 'Install prompt not available' };
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