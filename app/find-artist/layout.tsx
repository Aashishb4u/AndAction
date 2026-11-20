import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Artist with AI | ANDACTION",
  description:
    "Tell Andy the service, budget and city you need. Get matching singers, bhajan mandalis, bands and DJs on ANDACTION.",
  alternates: { canonical: "/find-artist" },
};

export default function FindArtistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
