'use client';

import Link from 'next/link';
import Image from 'next/image';

interface SiteFooterProps {
  padForBottomBar?: boolean;
}

const explore = [
  { label: 'Artists', href: '/artists' },
  { label: 'Videos', href: '/videos' },
  { label: 'Shorts', href: '/shorts' },
  { label: 'Search', href: '/search' },
];

const company = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQs', href: '/faqs' },
];

const legal = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
];

const SiteFooter = ({ padForBottomBar = true }: SiteFooterProps) => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`mt-auto border-t border-white/10 bg-[#121212] ${
        padForBottomBar ? 'pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0' : ''
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5 sm:gap-3">
              <Image
                src="/icons/logo.png"
                alt=""
                width={48}
                height={48}
                className="h-11 w-11 object-contain sm:h-14 sm:w-14"
              />
              <span className="gradient-text text-lg font-extrabold tracking-wide sm:text-2xl">
                ANDACTION
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#9A9A9A]">
              Book verified artists for weddings, events, and devotional programmes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-10">
            <nav aria-label="Explore">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white sm:text-xs">Explore</h2>
              <ul className="mt-2.5 space-y-2">
                {explore.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[13px] text-[#9A9A9A] hover:text-white sm:text-sm">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Company">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white sm:text-xs">Company</h2>
              <ul className="mt-2.5 space-y-2">
                {company.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[13px] text-[#9A9A9A] hover:text-white sm:text-sm">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white sm:text-xs">Legal</h2>
              <ul className="mt-2.5 space-y-2">
                {legal.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[13px] leading-snug text-[#9A9A9A] hover:text-white sm:text-sm">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2.5 border-t border-white/10 pt-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <p className="text-[11px] text-[#7F7F7F] sm:text-xs">© {year} ANDACTION. All rights reserved.</p>
          <p className="flex items-center gap-2 whitespace-nowrap text-[11px] text-[#9A9A9A] sm:text-xs">
            <a href="mailto:support@andaction.com" className="hover:text-white">
              support@andaction.com
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
