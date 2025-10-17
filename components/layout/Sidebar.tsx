'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, LogOut } from 'lucide-react';

import { createAuthRedirectUrl } from '@/lib/auth';
import Download from '../icons/download';
import Support from '../icons/support';

interface SidebarWithoutAuthProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for artists - this would come from your auth/user context
const mockArtists = [
  {
    id: 1,
    name: 'MJ Singer',
    role: 'Singer',
    image: '/avatars/2.png',
  }
];



const Sidebar: React.FC<SidebarWithoutAuthProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  // Main navigation items (excluding Sign-In and Join as artist)
  const navigationItems = [
    { label: 'About us', href: '/about', isActive: pathname === '/about' },
    { label: 'FAQs', href: '/faqs', isActive: pathname === '/faqs' },
    { label: 'Terms & Conditions', href: '/terms', isActive: pathname === '/terms' },
    { label: 'Privacy Policy', href: '/privacy', isActive: pathname === '/privacy' },
  ];

  const handleItemClick = () => {
    onClose();
  };

  const handleInstallApp = () => {
    // PWA install logic would go here
    console.log('Install app clicked');
    onClose();
  };

  const handleSignInClick = () => {
    router.push(createAuthRedirectUrl('/auth/signin', pathname));
    onClose();
  };

  const handleSignUpClick = () => {
    router.push(createAuthRedirectUrl('/auth/artist', pathname));
    onClose();
  };

  const handleArtistSelect = (artistId: number) => {
    // Switch artist logic would go here
    console.log('Switch to artist:', artistId);
    onClose();
    router.push('/artist/dashboard');
  };

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
        className={`fixed top-0 right-0 h-full w-80 bg-background border-l border-background-light z-[99999] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
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

          {/* Auth Section */}
          <div className="px-6 pt-2 pb-3">
            {/* Artist Profiles Section */}
            <div className="space-y-3">
              {mockArtists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleArtistSelect(artist.id)}
                  className="w-full flex items-center gap-3 p-3 bg-card border border-border-color rounded-xl hover:border-primary-pink/30 transition-all duration-300 group"
                >
                  {/* Artist Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  {/* Artist Info */}
                  <div className="flex-1 text-left">
                    <h3 className="text-white h2">{artist.name}</h3>
                    <p className="text-text-gray secondary-text">{artist.role}</p>
                  </div>

                  {/* Arrow Icon */}
                  <ChevronRight className="w-5 h-5 text-white group-hover:text-primary-pink transition-colors duration-300" />
                </button>
              ))}
            </div>
            {/* Sign-In */}
            {/* <button
              onClick={handleSignInClick}
              className="block py-2 text-white hover:text-primary-pink transition-colors duration-200 h1"
            >
              Sign-In
            </button> */}

            {/* Join as artist with gradient text */}
            <button
              onClick={handleSignUpClick}
              className="block gradient-text hover:opacity-80 transition-opacity duration-200 mt-3 h1"
            >
              Join as a artist
            </button>


          </div>
          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />

          {/* Navigation Items */}
          <div className="flex-1 px-6 md:py-5 mt-3">
            <div className="space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleItemClick}
                  className={`block h3 hover:text-primary-pink transition-colors duration-200 ${item.isActive ? 'gradient-text' : 'text-white'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Contact Information - Simple box */}
            <div className="mt-5">
              <div className="flex items-center space-x-3 mb-2">
                <Support className="size-5 text-text-gray" />
                <span className="secondary-text text-text-gray">For any query</span>
              </div>
              <p className="text-white">Contact Us: <Link href="tel:+918860014889" className="hover:underline">+91 8860014889</Link></p>
            </div>
          </div>

          {/* Install App Button */}
          <div className="p-6 border-t border-background-light">
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center space-x-2 py-3 px-3 border-2 border-border-color bg-card rounded-full hover:border-primary-pink/30 transition-all duration-300 group btn1"
            >
              <Download className="size-5 text-primary-orange group-hover:scale-110 transition-transform duration-300" />
              <span className="gradient-text">Install our web application</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
