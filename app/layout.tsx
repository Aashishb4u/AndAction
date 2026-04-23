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

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_NEXTAUTH_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'ANDACTION - Discover and Book Perfect Artists for your Events',
  description: 'Connecting talent with unforgettable experiences, all in one place! Find and book the perfect artists for your events with ANDACTION.',
  keywords: 'artists, events, booking, entertainment, performers, talent, shows',
  authors: [{ name: 'ANDACTION Team' }],
  icons: {
    icon: [
      { url: '/icons/app-mark.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'ANDACTION - Discover and Book Perfect Artists for your Events',
    description: 'Connecting talent with unforgettable experiences, all in one place! Find and book the perfect artists for your events with ANDACTION.',
    type: 'website',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'ANDACTION' }],
  },
  twitter: {
    card: 'summary',
    title: 'ANDACTION',
    description: 'Discover and book perfect artists for your events.',
    images: ['/icons/icon-512.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F0F0F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'ANDACTION',
              url: siteUrl,
              logo: `${siteUrl.replace(/\/$/, '')}/icons/icon-512.png`,
            }),
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="ANDACTION" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/app-mark.svg" />
      </head>
      <body
        className={`${raleway.variable} ${poppins.variable} antialiased bg-background min-h-screen`}
      >
        <ServiceWorkerRegistration />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
