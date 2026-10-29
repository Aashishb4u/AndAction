'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomBar from '@/components/layout/MobileBottomBar';
import ServicesPopup from '@/components/services/ServicesPopup';
import LogoPreloader from '@/components/ui/LogoPreloader';

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
  const [servicesOpen, setServicesOpen] = useState(false);
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

          <footer className="hidden md:block mt-auto border-t border-white/10 bg-[#121212]">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-[#9A9A9A]">Devotional programmes</p>
              <button
                type="button"
                onClick={() => setServicesOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:border-primary-pink hover:bg-white/10"
                aria-haspopup="dialog"
              >
                Services
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </footer>
          <ServicesPopup isOpen={servicesOpen} onClose={() => setServicesOpen(false)} />

          {/* Mobile Bottom Bar */}
          {!hideBottomBar && <MobileBottomBar />}
        </div>
      )}
    </>
  );
};

export default SiteLayout;
