import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile Setup - AndAction Artist',
  description: 'Complete your artist profile setup on AndAction',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
