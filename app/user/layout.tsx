import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Account | ANDACTION",
  robots: { index: false, follow: true },
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return children;
}
