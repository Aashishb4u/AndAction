import type { Metadata } from "next";
import Image from 'next/image';
import AuthLayoutClient from "./AuthLayoutClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <AuthLayoutClient>
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0 md:block hidden">
          <Image
            src="/hero-bg.jpg"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          <main className="flex-1 flex md:items-center justify-center md:p-8">
            <div className="w-full md:max-w-2xl">{children}</div>
          </main>
        </div>
      </div>
    </AuthLayoutClient>
  );
};

export default AuthLayout;
