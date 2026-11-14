import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist Performance Videos | ANDACTION",
  description:
    "Watch live performance videos from singers, bands and devotional artists before you book them for your event on ANDACTION.",
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
