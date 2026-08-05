import React from 'react';
import { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import FAQAccordion from '@/components/ui/FAQAccordion';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  HelpCircle,
  CreditCard,
  Handshake,
  UserCog,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQs - ANDACTION | Frequently Asked Questions for Artists',
  description:
    'Answers to common questions from artists about AndAction: free listing, profile control, how event organizers contact you, updating your profile, location and privacy, and how search results work.',
  keywords:
    'ANDACTION FAQ, artist FAQ, free artist listing, artist discovery platform India, update artist profile, remove artist profile, artist privacy',
  openGraph: {
    title: 'FAQs - ANDACTION',
    description:
      'Everything artists need to know about being listed on AndAction — free listing, full profile control, and direct contact with event organizers.',
    type: 'website',
  },
};

const faqCategories = [
  {
    id: 'about-andaction',
    title: 'About AndAction',
    icon: <HelpCircle className="w-6 h-6" />,
    faqs: [
      {
        id: 'what-is-andaction',
        question: 'What is AndAction?',
        answer:
          'AndAction is an artist discovery platform that connects talented artists with genuine event organizers across India. Our mission is to help artists gain visibility and create more performance opportunities.',
      },
      {
        id: 'why-profile-created',
        question: 'Why have you created my profile?',
        answer:
          'We discovered your work through publicly available professional sources and created your artist profile to help event organizers discover and connect with you more easily.',
      },
      {
        id: 'artist-management-company',
        question: 'Are you an artist management company?',
        answer:
          'No. AndAction is not an artist management or talent agency. We simply provide a platform where artists and event organizers can connect directly.',
      },
      {
        id: 'exclusive-rights',
        question: 'Do you have exclusive rights over my profile or performances?',
        answer:
          'No. Your profile belongs to you. You are free to accept bookings from anyone and work independently or with any agency. Creating a profile on AndAction does not give us any exclusive rights over your work.',
      },
    ],
  },
  {
    id: 'listing-pricing',
    title: 'Listing & Pricing',
    icon: <CreditCard className="w-6 h-6" />,
    faqs: [
      {
        id: 'pay-to-be-listed',
        question: 'Do I have to pay to be listed?',
        answer:
          'No. Listing your profile on AndAction is completely free. We do not charge any registration fee, subscription fee, or commission from artists as of now.',
      },
      {
        id: 'starting-price',
        question: 'Why do you ask for my starting price?',
        answer:
          'Your starting price helps event organizers shortlist artists within their budget. The final booking price is always decided between you and the client based on the event requirements.',
      },
    ],
  },
  {
    id: 'bookings-enquiries',
    title: 'Bookings & Enquiries',
    icon: <Handshake className="w-6 h-6" />,
    faqs: [
      {
        id: 'how-organizers-contact',
        question: 'How do event organizers contact me?',
        answer:
          'Your profile already includes your WhatsApp and Contact buttons. If an event organizer likes your profile, they can contact you directly through WhatsApp or a phone call using your booking number. AndAction is only a discovery platform, so there is no intermediary involved.',
      },
    ],
  },
  {
    id: 'managing-profile',
    title: 'Managing Your Profile',
    icon: <UserCog className="w-6 h-6" />,
    faqs: [
      {
        id: 'update-profile',
        question: 'How can I update my profile?',
        answer:
          'Simply log in to your account using your phone number from the Login section on our website. From your dashboard, go to Edit Profile to update your information anytime.',
      },
      {
        id: 'upload-media',
        question: 'How do I upload my photos and videos?',
        answer:
          'You do not need to upload them manually. Simply connect your Instagram and YouTube accounts, and your media will be automatically synced to your AndAction profile.',
      },
      {
        id: 'remove-profile',
        question: 'Can I remove my profile?',
        answer:
          'Yes. If you no longer wish to be listed on AndAction, simply contact our support team, and we will remove your profile.',
      },
    ],
  },
  {
    id: 'privacy-visibility',
    title: 'Privacy & Visibility',
    icon: <ShieldCheck className="w-6 h-6" />,
    faqs: [
      {
        id: 'why-location',
        question: 'Why do you ask for my location?',
        answer:
          'Your location helps us show your profile to event organizers looking for artists in or near your city. This increases your chances of receiving relevant booking enquiries.',
      },
      {
        id: 'address-privacy',
        question: 'Will my exact address be shown publicly?',
        answer:
          'No. We only display your city or service area to users. Your exact address and personal details remain private.',
      },
      {
        id: 'search-results',
        question: 'How does my profile appear in search results?',
        answer:
          'Artists are matched based on factors like location, performance category, availability, profile completeness, and the search preferences of the user.',
      },
    ],
  },
  {
    id: 'why-andaction',
    title: 'Why AndAction',
    icon: <Sparkles className="w-6 h-6" />,
    faqs: [
      {
        id: 'why-stay',
        question: 'Why should I stay on AndAction?',
        answer:
          'Our goal is to build India’s largest network of artists and help talented performers connect with genuine event organizers. By being a part of AndAction, you increase your visibility and improve your chances of receiving genuine performance opportunities.',
      },
    ],
  },
];

const promises = [
  '100% Free Listing',
  'No Registration Fees',
  'No Subscription Charges (as of now)',
  'No Commissions ',
  'No Exclusive Contracts',
  'Direct Contact with Event Organizers',
  'Full Control Over Your Profile',
  'Update or Remove Your Profile Anytime',
  'Dedicated Support Whenever You Need Assistance',
];

const FAQPage = async () => {
  // Gated on the server so the content never reaches a non-artist's browser.
  // A client-side guard would still ship the full text in the HTML payload.
  const session = await auth();

  if (!session?.user) {
    redirect(`/auth/signin?redirect=${encodeURIComponent('/faqs')}`);
  }

  if (session.user.role !== 'artist') {
    redirect('/');
  }

  return (
    <PageLayout
      title="How AndAction Works"
      description="Answers to the questions artists ask us most about being listed on AndAction."
    >
      <div className="space-y-8">
        {/* Intro */}
        <div className="text-center py-6 bg-gradient-to-r from-primary-orange/10 to-primary-pink/10 rounded-xl border border-primary-pink/20">
          <p className="text-text-light-gray">
            Can&apos;t find what you&apos;re looking for?{' '}
            <a href="#contact" className="text-primary-pink hover:underline">
              Contact our support team
            </a>{' '}
            and we&apos;ll be happy to help.
          </p>
        </div>

        {/* FAQ Categories */}
        <FAQAccordion categories={faqCategories} />

        {/* Our Promise to Artists */}
        <section id="our-promise">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-primary-orange">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Our Promise to Artists
            </h2>
          </div>

          <div className="bg-gradient-to-r from-primary-orange/10 to-primary-pink/10 rounded-xl p-6 md:p-8 border border-primary-pink/20">
            <p className="text-text-light-gray leading-relaxed mb-6">
              At AndAction, we believe artists deserve a transparent and trustworthy platform.
              Here&apos;s our commitment to you:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {promises.map((promise) => (
                <li key={promise} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-pink flex-shrink-0 mt-0.5" />
                  <span className="text-text-light-gray leading-relaxed">{promise}</span>
                </li>
              ))}
            </ul>

            <p className="text-text-light-gray leading-relaxed mt-6 pt-6 border-t border-primary-pink/20">
              Our mission is simple: to build India&apos;s most trusted artist discovery platform,
              helping talented artists get discovered and connect directly with genuine event
              organizers.
            </p>
          </div>
        </section>

        {/* Still have questions? */}
        <section
          id="contact"
          className="text-center py-8 px-6 bg-card/30 rounded-xl border border-background-light"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Still Have Questions?
          </h2>
          <p className="text-text-gray text-sm mb-6 max-w-xl mx-auto leading-relaxed">
            If you have any questions or need any assistance, simply contact our support team.
            We&apos;re always happy to help.
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

export default FAQPage;
