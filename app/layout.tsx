import type { Metadata } from 'next';
import { Raleway, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-raleway',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ANDACTION - Discover and Book Perfect Artists for your Events',
  description: 'Connecting talent with unforgettable experiences, all in one place! Find and book the perfect artists for your events with ANDACTION.',
  keywords: 'artists, events, booking, entertainment, performers, talent, shows',
  authors: [{ name: 'ANDACTION Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E8047E',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ANDACTION" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        className={`${raleway.variable} ${poppins.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
