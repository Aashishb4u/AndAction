'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomBar from '@/components/layout/MobileBottomBar';
import LogoPreloader from '@/components/ui/LogoPreloader';

interface SiteLayoutProps {
  children: React.ReactNode;
  showPreloader?: boolean;
  className?: string;
  hideNavbar?: boolean;
  hideBottomBar?: boolean;
}

const SiteLayout: React.FC<SiteLayoutProps> = ({
  children,
  showPreloader = true,
  className = '',
  hideNavbar = false,
  hideBottomBar = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(showPreloader);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {/* Logo Preloader */}
      {isLoading && showPreloader && (
        <LogoPreloader onLoadingComplete={handleLoadingComplete} />
      )}

      {/* Main Site Content - Only show when not loading */}
      {(!isLoading || !showPreloader) && (
        <div className={`min-h-screen bg-background ${className}`}>
          {/* Navigation */}
          {!hideNavbar && <Navbar onToggleSidebar={toggleSidebar} />}

          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

          {/* Main Content */}
          <main className="pb-20 md:pb-0">
            {children}
          </main>

          {/* Mobile Bottom Bar */}
          {!hideBottomBar && <MobileBottomBar />}
        </div>
      )}
    </>
  );
};

export default SiteLayout;
