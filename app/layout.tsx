import type { Metadata } from 'next';
import { Raleway, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { GoogleAnalytics } from "@next/third-parties/google";

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

function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://andaction.in';
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return 'https://andaction.in';
  }
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'ANDACTION - Discover and Book Perfect Artists for your Events',
  description: 'Connecting talent with unforgettable experiences, all in one place! Find and book the perfect artists for your events with ANDACTION.',
  keywords: 'artists, events, booking, entertainment, performers, talent, shows',
  authors: [{ name: 'ANDACTION Team' }],
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'ANDACTION - Discover and Book Perfect Artists for your Events',
    description: 'Connecting talent with unforgettable experiences, all in one place! Find and book the perfect artists for your events with ANDACTION.',
    url: siteUrl,
    siteName: 'ANDACTION',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        alt: 'ANDACTION',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANDACTION - Discover and Book Perfect Artists for your Events',
    description: 'Connecting talent with unforgettable experiences, all in one place! Find and book the perfect artists for your events with ANDACTION.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
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
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ANDACTION',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ANDACTION',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/artists?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="ANDACTION" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="icon" href="/icon-96.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <GoogleAnalytics gaId="G-XKZCT58CB4" />
      <body className={`${raleway.variable} ${poppins.variable} antialiased bg-background min-h-screen`} >
        <ServiceWorkerRegistration />
        <Providers>
          <BreadcrumbJsonLd siteUrl={siteUrl} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
