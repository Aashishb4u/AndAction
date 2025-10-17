import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join as Artist - AndAction',
  description: 'Join AndAction as an artist and share your talent with the world',
};

export default function ArtistAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
