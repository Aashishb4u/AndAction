import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Artists | ANDACTION",
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
