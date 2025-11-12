'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArtistSidebar from './ArtistSidebar';
import { Menu } from 'lucide-react';

interface ArtistDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const ArtistDashboardLayout: React.FC<ArtistDashboardLayoutProps> = ({
  children,
  className = '',
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={`min-h-screen bg-black ${className}`}>
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-4 container mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="ANDACTION Logo" width={180} height={180} />
        </Link>

        {/* Right Side - Profile and Menu */}
        <div className="flex items-center gap-4">
          {/* Profile Icon */}
          <div onClick={toggleSidebar} className="hidden md:block w-10 h-10 rounded-full overflow-hidden border-2 border-border-color cursor-pointer">
            <Image
              src="/icons/images.jpeg"
              alt="Profile"
              width={40}
              height={40}
              className="object-cover object-center"
            />
          </div>

          {/* Menu Button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-white hover:text-primary-pink transition-colors duration-200"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <ArtistSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main className="flex-1 container mx-auto">
        {children}
      </main>
    </div>
  );
};

export default ArtistDashboardLayout;
