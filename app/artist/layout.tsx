import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artist Dashboard - AndAction',
  description: 'Manage your content and connect with your audience on AndAction',
};

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  );
}
