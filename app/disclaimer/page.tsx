import React from 'react';
import { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { Building2, BadgeCheck, Copyright, Handshake, FileEdit, Scale, Sparkles, Mail, Phone } from 'lucide-react';



export const metadata: Metadata = {
  title: 'Disclaimer - ANDACTION | Platform Information & Content Policy',
  description: 'Read ANDACTION\'s disclaimer covering platform independence, artist representation, intellectual property, platform role, content updates, and limitation of liability.',
  keywords: 'disclaimer, ANDACTION disclaimer, platform disclaimer, intellectual property, limitation of liability, content removal',
  openGraph: {
    title: 'Disclaimer - ANDACTION',
    description: 'Important disclaimer governing the use of the ANDACTION platform and its content.',
    type: 'website',
  },
};

const DisclaimerPage = () => {
  const sections = [
    {
      id: 'independent-platform',
      title: 'Independent Platform',
      icon: <Building2 className="w-6 h-6" />,
      text: 'AndAction is an independent artist discovery and booking platform. Artist profiles, photos, videos, pricing, availability, and other information displayed on the platform are provided by the artists themselves or collected from publicly available sources. While we make reasonable efforts to verify information, we do not guarantee that every detail is complete, accurate, or up to date.'
    },
    {
      id: 'no-official-representation',
      title: 'No Official Representation',
      icon: <BadgeCheck className="w-6 h-6" />,
      text: 'Unless specifically mentioned, AndAction does not represent, manage, or exclusively endorse any artist listed on the platform. The inclusion of an artist does not imply any formal partnership, agency relationship, or exclusive association with AndAction.'
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      icon: <Copyright className="w-6 h-6" />,
      text: 'All trademarks, logos, artist names, photographs, videos, and other content belong to their respective owners. Any content used on the platform is displayed solely for identification, promotional, or informational purposes. If you believe any content infringes your intellectual property rights, please contact us and we will review the matter promptly.'
    },
    {
      id: 'platform-role',
      title: 'Platform Role',
      icon: <Handshake className="w-6 h-6" />,
      text: 'AndAction acts as a facilitator between event organizers and artists. We help users discover talent and initiate bookings but are not a party to the final agreement between the artist and the client, unless expressly stated. Any commercial terms, performance commitments, payments, or event-related arrangements are the responsibility of the respective parties.'
    },
    {
      id: 'content-updates-removal',
      title: 'Content Updates & Removal Requests',
      icon: <FileEdit className="w-6 h-6" />,
      text: 'If you are an artist or an authorized representative and wish to update, correct, claim ownership of, or remove your profile or any content from our platform, you may contact us with the necessary details. Genuine requests will be reviewed and processed within a reasonable timeframe.'
    },
    {
      id: 'limitation-of-liability',
      title: 'Limitation of Liability',
      icon: <Scale className="w-6 h-6" />,
      text: 'While we strive to maintain accurate information and a seamless experience, AndAction shall not be held liable for any loss, dispute, cancellation, delay, damages, or dissatisfaction arising from interactions, bookings, or services provided by artists or clients through the platform.'
    }
  ];

  return (
    <PageLayout
      title="Disclaimer"
      description="Please read the following information carefully before using our platform."
    >
      <div className="space-y-12">
        {/* Last Updated */}
        <div className="text-center py-4 bg-card/30 rounded-lg border border-background-light">
          <p className="text-text-gray text-sm">
            <strong>Last Updated:</strong> April 20, 2026
          </p>
        </div>

        {/* Introduction */}
        <section>
          <p className="text-text-light-gray leading-relaxed">
            At AndAction, we aim to provide a reliable platform that helps users discover and connect with
            artists for events. Please read the following information carefully before using our platform.
          </p>
        </section>

        {/* Main Sections */}
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <div className="flex items-center gap-3 mb-6">
              <div className="text-primary-pink">{section.icon}</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{section.title}</h2>
            </div>
            <div className="bg-card/20 rounded-lg p-6 border border-background-light">
              <p className="text-text-light-gray leading-relaxed">{section.text}</p>
            </div>
          </section>
        ))}

        {/* Our Commitment */}
        <section id="our-commitment">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-primary-orange"><Sparkles className="w-6 h-6" /></div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Our Commitment</h2>
          </div>
          <div className="bg-gradient-to-r from-primary-orange/10 to-primary-pink/10 rounded-xl p-6 border border-primary-pink/20">
            <p className="text-text-light-gray leading-relaxed">
              We are committed to maintaining a trustworthy, transparent, and professional platform for
              artists and event organizers. We continuously work to improve the accuracy of our listings and
              respond promptly to genuine concerns, feedback, and content-related requests.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="text-center py-6 bg-gradient-to-r from-primary-orange/10 to-primary-pink/10 rounded-xl border border-primary-pink/20">
          <h3 className="text-lg font-semibold text-white mb-3">Questions or Content Requests?</h3>
          <p className="text-text-gray text-sm mb-4">
            If you have any questions about this Disclaimer or wish to raise a content-related request, please contact us:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:official@andaction.in"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-pink text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary-pink/25 transition-all duration-300"
            >
              <Mail className="w-4 h-4" />
              <span>official@andaction.in</span>
            </a>
            <a
              href="tel:+918595114889"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-pink text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary-pink/25 transition-all duration-300"
            >
              <Phone className="w-4 h-4" />
              <span>+91 8595114889</span>
            </a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default DisclaimerPage;
