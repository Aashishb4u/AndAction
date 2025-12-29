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
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession(); 
  const user = session?.user;

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
      label: "Bookmarks",
      href: "/bookmarks",
      isActive: pathname === "/bookmarks",
    },
  ];

  const handleToggleSidebar = () => {
    if (onToggleSidebar) onToggleSidebar();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-background-light"
          : "bg-transparent border-b border-transparent"
      } ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
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
            <div className="ml-16 flex items-baseline space-x-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 relative ${
                    item.isActive
                      ? "gradient-text nav-active-underline"
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
              <Search className="size-5" />
            </button>

            {/* Sign In (only show when logged out) */}
            {!user && status !== "loading" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  router.push(createAuthRedirectUrl("/auth/signin", pathname))
                }
                className="btn2"
              >
                Sign In
              </Button>
            )}

            {/* Join as an artist - Only show for non-artist users */}
            {user?.role !== "artist" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.push(createAuthRedirectUrl("/auth/artist", pathname))
                }
              >
                <span className="gradient-text btn2">Join as an Artist</span>
              </Button>
            )}

            {user ? (
              <button
                onClick={handleToggleSidebar}
                className="flex items-center justify-center rounded-full border border-transparent hover:border-primary-pink transition"
              >
                <Image
                  src={
                      user.avatar && /^\d+$/.test(String(user.avatar))
                        ? `/avatars/${user.avatar}.png`
                        : user.avatar || "/default-avatar.png"
                    }
                  alt={user.firstName || "User"}
                  width={40}
                  height={40}
                  unoptimized
                  className="rounded-full"
                />
              </button>
            ) : (
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
