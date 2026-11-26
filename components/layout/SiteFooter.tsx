'use client';

import Link from 'next/link';
import Image from 'next/image';
import { DEVOTIONAL_SERVICES } from '@/lib/devotional-services';

interface SiteFooterProps {
  padForBottomBar?: boolean;
}

const company = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQs', href: '/faqs' },
];

const services = DEVOTIONAL_SERVICES.map((service) => ({
  label: service.name,
  href: `/services/${service.slug}`,
}));

const legal = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
];

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  className: 'h-[18px] w-[18px]',
  'aria-hidden': true,
} as const;

// TODO: replace with the real ANDACTION profile URLs.
const socials = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    icon: (
      <svg {...iconProps}>
        <path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7h1.6V3.9c-.3 0-1.3-.1-2.4-.1-2.5 0-4.1 1.5-4.1 4.2v2.5H7.6v3.3h2.8V22h3.1z" />
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/',
    icon: (
      <svg {...iconProps}>
        <path d="M18.2 2.5h3.1l-6.8 7.8 8 11.2h-6.3l-4.9-6.8-5.6 6.8H2.6l7.3-8.3L2.2 2.5h6.4l4.4 6.2 5.2-6.2zm-1.1 17.1h1.7L7.4 4.3H5.5l11.6 15.3z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    icon: (
      <svg {...iconProps}>
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.8h4V21H3V9.8zm6.5 0h3.8v1.5h.1c.5-1 1.8-1.8 3.7-1.8 4 0 4.7 2.6 4.7 6V21h-4v-4.9c0-1.2 0-2.7-1.7-2.7s-1.9 1.3-1.9 2.6V21h-4V9.8z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    icon: (
      <svg {...iconProps}>
        <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.2-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/',
    icon: (
      <svg {...iconProps}>
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" />
      </svg>
    ),
  },
];

const linkClass = 'text-[13px] leading-snug text-[#9A9A9A] transition-colors hover:text-white sm:text-sm';
const headingClass = 'text-[11px] font-semibold uppercase tracking-wider text-white sm:text-xs';

const SiteFooter = ({ padForBottomBar = true }: SiteFooterProps) => {
  const year = new Date().getFullYear();

  const columns = [
    { title: 'Company', items: company },
    { title: 'Services', items: services },
    { title: 'Legal', items: legal },
  ];

  return (
    <footer
      className={`relative mt-auto overflow-hidden bg-gradient-to-b from-transparent via-[#0F0F0F] to-[#1A0A12] ${
        padForBottomBar ? 'pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0' : ''
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_bottom,rgba(232,4,126,0.14),rgba(237,75,34,0.05)_45%,transparent_70%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo.png"
                alt="ANDACTION Logo"
                width={215}
                height={24}
                className="h-auto w-[173px] lg:w-[215px]"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#9A9A9A]">
              Book verified artists for weddings, events, and devotional programmes.
            </p>
            <ul className="mt-4 flex items-center gap-2.5">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#9A9A9A] transition-colors hover:border-primary-pink hover:text-white"
                  >
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 sm:gap-10">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className={headingClass}>{col.title}</h2>
                <ul className="mt-2.5 space-y-2">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2.5 border-t border-white/[0.06] pt-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <p className="text-[11px] text-[#7F7F7F] sm:text-xs">© {year} ANDACTION. All rights reserved.</p>
          <p className="flex items-center gap-2 whitespace-nowrap text-[11px] text-[#9A9A9A] sm:text-xs">
            <a href="mailto:official@andaction.in" className="hover:text-white">
              official@andaction.in
            </a>
            <span aria-hidden="true" className="text-[#7F7F7F]">·</span>
            <a href="tel:+918595114889" className="hover:text-white">
              +91 85951 14889
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
