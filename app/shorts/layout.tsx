import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist Shorts | ANDACTION",
  description:
    "Quick performance clips from artists on ANDACTION. Find the right voice for your wedding, jagran or event.",
};

export default function ShortsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
