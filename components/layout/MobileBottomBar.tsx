'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Home from '../icons/home';
import Video from '../icons/video';
import Search from '../icons/search';
import Shorts from '../icons/shorts';
import Bookmark from '../icons/bookmark';

interface BottomBarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const MobileBottomBar = () => {
  const pathname = usePathname();
  // const [activeItem, setActiveItem] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);


  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };


  const bottomBarItems: BottomBarItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: (
        <Home className="w-6 h-6" active={isActive('/')} />
      ),
    },
    {
      id: 'videos',
      label: 'Videos',
      href: '/videos',
      icon: (
        <Video className="w-6 h-6" active={isActive('/videos')} />
      ),
    },
    {
      id: 'search',
      label: 'Search',
      href: '/search',
      icon: (
        <Search className="w-6 h-6" active={isActive('/search')} />
      ),
    },
    {
      id: 'shorts',
      label: 'Shorts',
      href: '/shorts',
      icon: (
        <Shorts className="w-6 h-6" active={isActive('/shorts')} />
      ),
    },
    {
      id: 'bookmarks',
      label: 'Favourites',
      href: '/bookmarks',
      icon: (
        <Bookmark className="w-6 h-6" active={isActive('/bookmarks')} />
      ),
    },
  ];

  // Handle scroll to hide/show bottom bar with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down & past threshold
          setIsVisible(false);
        } else {
          // Scrolling up or at top
          setIsVisible(true);
        }

        setLastScrollY(currentScrollY);
      }, 10); // Small debounce for smoother performance
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  // Set active item based on pathname
  // useEffect(() => {
  //   const currentItem = bottomBarItems.find(item => isActive(item.href));
  //   if (currentItem) {
  //     // setActiveItem(currentItem.id);
  //   }
  // }, [pathname]);

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-out
      ${isVisible ? 'translate-y-0' : 'translate-y-full'}
    `}>
      {/* Blurred glass background with custom semi-transparent color (#0F0F0F CC = 80% opacity) */}
      <div
        className="backdrop-blur-xl border-t border-white/10"
        style={{ backgroundColor: '#0F0F0FCC', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
      >
        {/* Navigation items */}
        <nav className="flex items-center justify-around px-3 py-2">
          {bottomBarItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-3 px-1 transition-all duration-200 ease-out"
              >
                {/* Icon */}
                <div className="mb-1.5">
                  <div className={`transition-colors duration-200 ${active ? 'text-white' : 'text-[#7F7F7F]'}`}>
                    {item.icon}
                  </div>
                </div>

                {/* Label */}
                <span className={`text-sm leading-none transition-colors duration-200 ${active ? 'text-white' : 'text-[#7F7F7F]'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default MobileBottomBar;
