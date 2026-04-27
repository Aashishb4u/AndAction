'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArtistSidebar from './ArtistSidebar';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { buildArtishProfileUrl } from '@/lib/utils';

interface ArtistDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  hideNavbar?: boolean;
  useMainSidebar?: boolean;
}

const ArtistDashboardLayout: React.FC<ArtistDashboardLayoutProps> = ({
  children,
  className = '',
  hideNavbar = false,
  useMainSidebar = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const { data: session } = useSession();
  const [latestAvatar, setLatestAvatar] = useState<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setLatestAvatar(null);
      return;
    }

    let cancelled = false;

    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/users/profile', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const avatar = json?.data?.avatar;
        if (!cancelled && typeof avatar === 'string') {
          setLatestAvatar(avatar);
        }
      } catch {}
    };

    fetchLatest();
    window.addEventListener('focus', fetchLatest);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', fetchLatest);
    };
  }, [session?.user?.id]);

  return (
    <div className={`min-h-screen bg-black ${className}`}>
      {/* Navigation Bar */}
      {!hideNavbar && (
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
              src={buildArtishProfileUrl(latestAvatar ?? session?.user?.avatar ?? '')}
              alt="Profile"
              width={40}
              height={40}
              unoptimized
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
      )}

      {/* Sidebar */}
      {useMainSidebar ? (
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      ) : (
        <ArtistSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto">
        {children}
      </main>
    </div>
  );
};

export default ArtistDashboardLayout;
