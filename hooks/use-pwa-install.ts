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
    if (window.matchMedia('(display-mode: standalone)').matches) {
      alert('App is already installed!');
      return { success: false, message: 'Already installed' };
    }

    if (isIOSSafari()) {
      alert('To install this app on iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right corner');
      return { success: false, message: 'iOS installation instructions shown' };
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

    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isChrome || isEdge) {
      alert('To install ANDACTION:\n\n1. Click the install icon (⊕) in your browser\'s address bar\n2. Or open browser menu (⋮) → "Install ANDACTION"\n3. Follow the prompts to add to your home screen');
    } else if (isSafari) {
      alert('To install ANDACTION:\n\n1. Tap the Share button in Safari\n2. Scroll and select "Add to Home Screen"\n3. Tap "Add" to install');
    } else {
      alert('To install ANDACTION:\n\nLook for the install or "Add to Home Screen" option in your browser menu.\n\nFor best experience, use Chrome, Edge, or Safari.');
    }
    
    return { success: false, message: 'Installation instructions shown' };
  };

  const isIOSSafari = () => {
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
