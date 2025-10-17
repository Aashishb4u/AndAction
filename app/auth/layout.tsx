'use client';

import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 md:block hidden">
        <Image
          src="/hero-bg.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay with reduced opacity and blur effect */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content */}
        <main className="flex-1 flex md:items-center justify-center md:p-8">
          <div className="w-full md:max-w-lg">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
