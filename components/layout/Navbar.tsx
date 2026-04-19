"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { NavbarProps, NavItem } from "@/types";
import { createAuthRedirectUrl } from "@/lib/auth";
import Search from "../icons/search";
import { useSession, signOut } from "next-auth/react";
import { buildArtishProfileUrl } from "@/lib/utils";

interface NavbarWithSidebarProps extends NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarWithSidebarProps> = ({
  className = "",
  onToggleSidebar,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isConvertingArtist, setIsConvertingArtist] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  useEffect(() => {
    setMounted(true);
  }, []);

useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentScrollY = window.scrollY;
        setIsScrolled(currentScrollY > 10);
        setIsVisible(!(currentScrollY > lastScrollY && currentScrollY > 100));
        setLastScrollY(currentScrollY);
      }, 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);


  const navItems: NavItem[] = [
    { label: "Home", href: "/", isActive: pathname === "/" },
    { label: "Videos", href: "/videos", isActive: pathname === "/videos" },
    { label: "Shorts", href: "/shorts", isActive: pathname === "/shorts" },
    {
      label: "Favourites",
      href: "/bookmarks",
      isActive: pathname === "/bookmarks",
    },
  ];

  const handleToggleSidebar = () => {
    if (onToggleSidebar) onToggleSidebar();
  };

  const handleArtistAction = () => {
    if (isConvertingArtist) {
      return;
    }

    if (!user) {
      router.push(createAuthRedirectUrl("/auth/artist", pathname));
      return;
    }

    if (user.role === "artist") {
      router.push("/artist/dashboard");
      return;
    }

    setIsConvertingArtist(true);
    router.push("/artist/profile-setup?convert=true");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[9999] ${
        mounted ? 'transition-all duration-300 ease-in-out' : ''
      } ${
        // glass blur only when the page is scrolled AND the navbar is visible
        isScrolled && isVisible ? "backdrop-blur-xl" : ""
      } ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"} ${className}`}
      style={
        isScrolled && isVisible
          ? { backgroundColor: '#0F0F0F1A', WebkitBackdropFilter: 'blur(2px)', backdropFilter: 'blur(2px)' }
          : undefined
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="ANDACTION Logo"
                width={180}
                height={20}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="ml-16 flex items-center space-x-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-3 btn1 transition-colors duration-200 relative ${
                    item.isActive
                      ? "gradient-text nav-active-underline text-center"
                      : "text-text-light-gray hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Search Icon */}
            <button
              onClick={() => router.push("/artists")}
              className="p-2 text-text-light-gray hover:text-white transition-colors duration-200"
            >
              <Search className="size-6" />
            </button>

            {/* Only render session-dependent buttons after mount + session resolved */}
            {mounted && status !== "loading" && (
              <>
                {/* Sign In (only show when logged out) */}
                {!user && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      router.push(createAuthRedirectUrl("/auth/signin", pathname))
                    }
                    className="signup"
                  >
                    Sign In
                  </Button>
                )}

                {/* Join as an artist - Only show for non-artist users */}
                {user?.role !== "artist" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleArtistAction}
                  >
                    <span className="gradient-text signup">
                      {isConvertingArtist ? "Joining..." : "Join as an Artist"}
                    </span>
                  </Button>
                )}
              </>
            )}

            {user ? (
              <button
                onClick={handleToggleSidebar}
                className="flex items-center justify-center rounded-full border border-transparent hover:border-primary-pink transition overflow-hidden"
                style={{ width: '40px', height: '40px' }}
              >
                <Image
                  src={ buildArtishProfileUrl(user.avatar!) }
                  alt={user.firstName || "User"}
                  width={40}
                  height={40}
                  unoptimized
                  className="rounded-full object-cover w-full h-full"
                />
              </button>
            ) : (
              <button
                onClick={handleToggleSidebar}
                className="p-2 text-text-light-gray hover:text-white transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6 md:w-8 md:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <button
              onClick={handleToggleSidebar}
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
