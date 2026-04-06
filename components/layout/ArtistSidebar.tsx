'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Download from '../icons/download';
import Support from '../icons/support';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { toast } from 'react-toastify';

interface ArtistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArtistSidebar: React.FC<ArtistSidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { isInstalled, installApp } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'About us', href: '/about' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ];

  const handleSignOut = async () => {
    console.log('being triggered');
    await signOut({ redirect: false });
    onClose();
    router.push('/');
  };

  const handleArtistProfile = () => {
    onClose();
    router.push('/artist/profile');
  };

  const handleInstallApp = async () => {
    if (isInstalling) return;

    setIsInstalling(true);
    try {
      const result = await installApp();

      if (result.success) {
        toast.success('Install prompt opened.');
        onClose();
        return;
      }

      if (result.message === 'Already installed') {
        toast.info('App is already installed.');
      } else if (result.message === 'iOS instructions shown') {
        toast.info('Follow iOS instructions to add app to Home Screen.');
      } else {
        toast.info('Install prompt is not available yet. Please try again in a moment.');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const artist = session?.user?.artistProfile;
  const user = session?.user;
  const displayName =
    artist?.stageName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const displayRole = artist?.artistType || user?.role || 'Artist';
  const avatar = user?.avatar && /^\d+$/.test(String(user.avatar))
    ? `/avatars/${user.avatar}.png`
    : user?.avatar || '/icons/images.jpeg';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-80 bg-background md:border-l border-background-light z-[99999] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-end px-6 pt-4">
            <button
              onClick={onClose}
              className="p-2 text-text-light-gray hover:text-white transition-colors duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Artist Profile Section */}
          <div className="px-6 pt-2 pb-5">
            <button
              onClick={handleArtistProfile}
              className="w-full flex items-center gap-3 p-3 bg-card border border-border-color rounded-xl hover:border-primary-pink/30 transition-all duration-300 group"
            >
              {/* Artist Image */}
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={avatar}
                  alt={displayName}
                  width={48}
                  height={48}
                  unoptimized
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Artist Info */}
              <div className="flex-1 text-left">
                <h3 className="text-white h2">{displayName}</h3>
                <p className="text-text-gray secondary-text">{displayRole}</p>
              </div>

              <ChevronRight className="w-6 h-6 text-white group-hover:text-primary-pink transition-colors duration-300" />
            </button>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />

          {/* Navigation Items */}
          <div className="flex-1 px-6 py-5">
            <div className="space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="block h3 text-white hover:text-primary-pink transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Contact Info */}
            <div className="mt-5">
              <div className="flex items-center space-x-3 mb-2">
                <Support className="size-5 text-text-gray" />
                <span className="secondary-text text-text-gray">For any query</span>
              </div>
              <p className="text-white">
                Contact Us:{' '}
                <Link href="tel:+918860014889" className="hover:underline">
                  +91 8860014889
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="p-6 border-t border-background-light space-y-4">
            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-start gap-3 text-white hover:text-red-400 transition-colors duration-200 h3"
            >
              <LogOut className="w-6 h-6 rotate-180" />
              <span>Sign out</span>
            </button>

            {/* Install App */}
            {!isInstalled && (
              <button
                onClick={handleInstallApp}
                disabled={isInstalling}
                className="w-full flex items-center justify-center space-x-2 py-3 px-3 border-2 border-border-color bg-card rounded-full hover:border-primary-pink/30 transition-all duration-300 group btn1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="size-5 text-primary-orange group-hover:scale-110 transition-transform duration-300" />
                <span className="gradient-text">{isInstalling ? 'Checking install...' : 'Install our web application'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ArtistSidebar;
