"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { createAuthRedirectUrl } from "@/lib/auth";
import Download from "../icons/download";
import Support from "../icons/support";
import { useSession, signOut } from "next-auth/react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const navigationItems = [
    { label: "About us", href: "/about", isActive: pathname === "/about" },
    { label: "FAQs", href: "/faqs", isActive: pathname === "/faqs" },
    {
      label: "Terms & Conditions",
      href: "/terms",
      isActive: pathname === "/terms",
    },
    {
      label: "Privacy Policy",
      href: "/privacy",
      isActive: pathname === "/privacy",
    },
  ];

  const handleItemClick = () => onClose();

  const handleJoinArtist = () => {
    router.push(createAuthRedirectUrl("/auth/artist", pathname));
    onClose();
  };

  const handleInstallApp = () => {
    console.log("Install app clicked");
    onClose();
  };

  const handleSignOut = async () => {
    console.log('idk being triggered')
    await signOut({ redirect: false });
    onClose();
    router.push("/");
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
        className={`fixed top-0 right-0 h-screen max-h-screen w-80 max-w-full sm:w-96 bg-background border-l border-background-light z-99999 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
          } sidebar-responsive`}
        style={{ width: 'min(90vw, 22rem)', maxWidth: 400, height: '100dvh', maxHeight: '100dvh', overflowY: 'auto' }}
      >
        <div className="flex flex-col h-full min-h-0 overflow-y-auto">
          {/* Header Close */}
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

          {/* Logged-in user section */}
          {user ? (
            <div className="px-6 pt-2 pb-3">
              <button
                onClick={() => {
                  onClose();
                  if (user.role === "artist") {
                    router.push("/artist/profile");
                  } else {
                    router.push("/user/profile");
                  }
                }}
                className="w-full flex items-center gap-3 p-3 bg-card border border-border-color rounded-xl hover:border-primary-pink/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <Image
                   src={
                      user.avatar && /^\d+$/.test(String(user.avatar))
                        ? `/avatars/${user.avatar}.png`
                        : user.avatar || "/default-avatar.png"
                    }
                    alt={user.firstName || "User"}
                    width={48}
                    height={48}
                    unoptimized
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-medium">
                    {user.firstName} {user.lastName}
                  </h3>
                  {user?.email ? (
                    <p className="text-text-gray text-sm truncate">
                      {user.email}
                    </p>
                  ) : (
                    <p className="text-text-gray text-sm truncate">
                      {user.countryCode}
                      {user.phoneNumber}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-white group-hover:text-primary-pink transition-colors duration-300" />
              </button>

              {/* Join as artist */}
              <button
                onClick={handleJoinArtist}
                className="block gradient-text hover:opacity-80 transition-opacity duration-200 mt-3 h1"
              >
                Join as a artist
              </button>
            </div>
          ) : (
            // Guest state
            <div className="px-6 pt-2 pb-3">
              <button
                onClick={() => {
                  router.push(createAuthRedirectUrl("/auth/signin", pathname));
                  onClose();
                }}
                className="block text-white hover:text-primary-pink transition-colors duration-200 h1"
              >
                Sign In
              </button>

              <button
                onClick={handleJoinArtist}
                className="block gradient-text hover:opacity-80 transition-opacity duration-200 mt-3 h1"
              >
                Join as a artist
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-linear-to-r from-transparent via-gray-800 to-transparent" />

          {/* Navigation Links */}
          <div className="flex-1 px-6 md:py-5 mt-3">
            <div className="space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleItemClick}
                  className={`block h3 hover:text-primary-pink transition-colors duration-200 ${item.isActive ? "gradient-text" : "text-white"
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Contact */}
            <div className="mt-5 border border-border-color rounded-xl p-3 bg-card">
              <div className="flex items-center space-x-3 mb-1">
                <Support className="size-5 text-text-gray" />
                <span className="text-text-gray text-sm">For any query</span>
              </div>
              <p className="text-white text-sm">
                Contact Us:{" "}
                <Link href="tel:+918860014889" className="hover:underline">
                  +91 8860014889
                </Link>
              </p>
            </div>
          </div>

          {/* Signout + Install App */}
          {user && (
            <div className="p-6 border-t border-background-light space-y-3">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-white hover:text-primary-pink transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Signout</span>
              </button>

              <button
                onClick={handleInstallApp}
                className="w-full flex items-center justify-center space-x-2 py-3 px-3 border-2 border-border-color bg-card rounded-full hover:border-primary-pink/30 transition-all duration-300 group"
              >
                <Download className="size-5 text-primary-orange group-hover:scale-110 transition-transform duration-300" />
                <span className="gradient-text">
                  Install our web application
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
