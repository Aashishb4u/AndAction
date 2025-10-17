'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut } from 'lucide-react';
import Download from '../icons/download';
import Support from '../icons/support';

interface ArtistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for artists - this would come from your auth/user context
const mockArtists = [
  {
    id: 1,
    name: 'MJ Singer',
    role: 'Singer',
    image: '/artist.png',
  }
];

const ArtistSidebar: React.FC<ArtistSidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const navigationItems = [
    { label: 'About us', href: '/about' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ];

  const handleItemClick = () => {
    onClose();
  };

  const handleInstallApp = () => {
    // PWA install logic would go here
    console.log('Install app clicked');
    onClose();
  };

  const handleSignOut = () => {
    // Sign out logic would go here
    console.log('Sign out clicked');
    router.push('/');
    onClose();
  };

  const handleArtistSelect = (artistId: number) => {
    // Switch artist logic would go here
    console.log('Switch to artist:', artistId);
    onClose();
    router.push('/artist/profile');
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

          {/* Artist Profiles Section */}
          <div className="px-6 pt-2 pb-5">
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
                  onClick={handleItemClick}
                  className="block h3 text-white hover:text-primary-pink transition-colors duration-200"
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

          {/* Bottom Section */}
          <div className="p-6 border-t border-background-light space-y-4">
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 text-white hover:text-red-400 transition-colors duration-200 h3"
            >
              <LogOut className="w-5 h-5 rotate-180" />
              <span>Signout</span>
            </button>

            {/* Install App Button */}
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center space-x-2 py-3 px-3 border-2 border-border-color bg-card rounded-full hover:border-primary-pink/30 transition-all duration-300 group btn1"
            >
              <Download className="size-5 text-primary-orange group-hover:scale-110 transition-transform duration-300" />
              <span className="gradient-text">Install our web application</span>
            </button>
          </div>
        </div>
      </div >
    </>
  );
};

export default ArtistSidebar;
