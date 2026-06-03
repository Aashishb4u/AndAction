'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import SiteLayout from './SiteLayout';
import { useNavigationHistory } from '@/hooks/use-navigation-history';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
  showBackButton = true,
  className = '',
}) => {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { goBack } = useNavigationHistory({ fallbackPath: '/' });

  const handleBack = () => {
    goBack();
  };

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...segments.map((seg, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = decodeURIComponent(seg)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { label, href };
    }),
  ];

  return (
    <SiteLayout>
      <div className={`min-h-screen bg-background ${className}`}>
        {/* Header Section */}
        <div className="pt-20 lg:pt-24 pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-text-light-gray hover:text-white transition-colors duration-200 mb-6 group"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}

            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-text-light-gray">
                {breadcrumbs.map((bc, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <li key={bc.href} className="flex items-center gap-2">
                      {isLast ? (
                        <span className="text-white">{bc.label}</span>
                      ) : (
                        <Link
                          href={bc.href}
                          className="hover:text-white transition-colors duration-200"
                        >
                          {bc.label}
                        </Link>
                      )}
                      {!isLast && <span className="text-text-light-gray">/</span>}
                    </li>
                  );
                })}
              </ol>
            </nav>

            {/* Page Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {title}
              </h1>
              {description && (
                <p className="text-lg text-text-light-gray max-w-2xl mx-auto leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-card/50 backdrop-blur-sm border border-background-light rounded-2xl p-6 md:p-8 lg:p-12">
            {children}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
};

export default PageLayout;
