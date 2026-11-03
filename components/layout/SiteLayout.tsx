'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomBar from '@/components/layout/MobileBottomBar';
import LogoPreloader from '@/components/ui/LogoPreloader';
import SiteFooter from '@/components/layout/SiteFooter';

interface SiteLayoutProps {
  children: React.ReactNode;
  showPreloader?: boolean;
  className?: string;
  hideNavbar?: boolean;
  hideBottomBar?: boolean;
  hideNavbarOnMobile?: boolean;
}

const SiteLayout: React.FC<SiteLayoutProps> = ({
  children,
  showPreloader = false,
  className = '',
  hideNavbar = false,
  hideBottomBar = false,
  hideNavbarOnMobile = false,
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
        <div className={`min-h-screen bg-background flex flex-col ${className}`}>
          {/* Navigation */}
          {!hideNavbar && (
            <div className={hideNavbarOnMobile ? "hidden md:block" : ""}>
              <Navbar onToggleSidebar={toggleSidebar} />
            </div>
          )}

          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

          {/* Main Content */}
          <main className="flex-1 md:pb-0">
            {children}
          </main>

          <SiteFooter padForBottomBar={!hideBottomBar} />

          {/* Mobile Bottom Bar */}
          {!hideBottomBar && <MobileBottomBar />}
        </div>
      )}
    </>
  );
};

export default SiteLayout;
