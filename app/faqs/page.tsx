import React from 'react';
import { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import FAQAccordion from '@/components/ui/FAQAccordion';
import { HelpCircle, Users, CreditCard, Music, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQs - ANDACTION | Frequently Asked Questions & Support',
  description: 'Find answers to common questions about ANDACTION platform, booking process, payments, artist registration, and support. Get help with using our artist booking service.',
  keywords: 'ANDACTION FAQ, frequently asked questions, booking help, artist platform support, payment questions, how to book artists',
  openGraph: {
    title: 'FAQs - ANDACTION',
    description: 'Get answers to your questions about booking artists and using ANDACTION platform.',
    type: 'website',
  },
};

const FAQPage = () => {

  const faqCategories = [
    {
      id: 'general',
      title: 'General Questions',
      icon: <HelpCircle className="w-6 h-6" />,
      faqs: [
        {
          id: 'what-is-andaction',
          question: 'What is ANDACTION?',
          answer: 'ANDACTION is a comprehensive platform that connects talented artists with event organizers. Whether you\'re planning a wedding, corporate event, festival, or private party, we help you find and book the perfect entertainment for your occasion.'
        },
        {
          id: 'how-it-works',
          question: 'How does ANDACTION work?',
          answer: 'Simply browse our extensive catalog of verified artists, view their profiles, watch performance videos, and book directly through our platform. We handle the entire process from discovery to payment, making event planning effortless.'
        },
        {
          id: 'who-can-use',
          question: 'Who can use ANDACTION?',
          answer: 'ANDACTION is designed for both event organizers looking to book entertainment and artists wanting to showcase their talents. Anyone over 18 can create an account and start using our services.'
        },
        {
          id: 'cost-to-use',
          question: 'Is it free to use ANDACTION?',
          answer: 'Creating an account and browsing artists is completely free. We charge a small service fee only when you successfully book an artist through our platform. Artists can create profiles and receive bookings at no upfront cost.'
        }
      ]
    },
    {
      id: 'booking',
      title: 'Booking Process',
      icon: <Music className="w-6 h-6" />,
      faqs: [
        {
          id: 'how-to-book',
          question: 'How do I book an artist?',
          answer: 'Browse artists by category, location, or search for specific talents. Once you find the perfect artist, click "Request Booking," fill in your event details, and submit your request. The artist will respond with availability and final pricing.'
        },
        {
          id: 'booking-confirmation',
          question: 'How do I know my booking is confirmed?',
          answer: 'You\'ll receive email and in-app notifications when an artist accepts your booking request. A confirmed booking includes event details, payment information, and contact details for direct communication with the artist.'
        },
        {
          id: 'cancellation-policy',
          question: 'What is the cancellation policy?',
          answer: 'Cancellation policies vary by artist and are clearly stated in each booking. Generally, cancellations made 7+ days before the event receive full refunds, while last-minute cancellations may incur fees. Check the specific policy before booking.'
        },
        {
          id: 'modify-booking',
          question: 'Can I modify my booking after confirmation?',
          answer: 'Yes, you can request modifications through our platform. Changes to date, time, or event details are subject to artist availability and may affect pricing. Both parties must agree to any modifications.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Pricing',
      icon: <CreditCard className="w-6 h-6" />,
      faqs: [
        {
          id: 'payment-methods',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. All payments are processed securely through encrypted, PCI-compliant payment gateways.'
        },
        {
          id: 'when-charged',
          question: 'When am I charged for a booking?',
          answer: 'Payment is processed when the artist confirms your booking. We use a secure escrow system - funds are held safely and released to the artist after the successful completion of your event.'
        },
        {
          id: 'service-fees',
          question: 'What are the service fees?',
          answer: 'ANDACTION charges a small service fee (typically 3-5%) to cover platform maintenance, payment processing, and customer support. This fee is clearly displayed before you complete your booking.'
        },
        {
          id: 'refund-process',
          question: 'How do refunds work?',
          answer: 'Refunds are processed according to the cancellation policy agreed upon at booking. Approved refunds are typically processed within 5-7 business days to your original payment method.'
        }
      ]
    },
    {
      id: 'artists',
      title: 'For Artists',
      icon: <Users className="w-6 h-6" />,
      faqs: [
        {
          id: 'join-as-artist',
          question: 'How do I join as an artist?',
          answer: 'Click "Join as an Artist" and complete our registration process. You\'ll need to provide basic information, upload performance videos/photos, set your pricing, and verify your identity. Our team reviews all applications to maintain quality standards.'
        },
        {
          id: 'artist-verification',
          question: 'What is the artist verification process?',
          answer: 'We verify all artists through identity checks, performance sample reviews, and background verification. This process typically takes 2-3 business days and ensures all artists on our platform meet our quality and safety standards.'
        },
        {
          id: 'artist-earnings',
          question: 'How do artists get paid?',
          answer: 'Artists receive payment within 24-48 hours after event completion. Payments are transferred directly to your registered bank account. We provide detailed earning reports and tax documentation as needed.'
        },
        {
          id: 'artist-support',
          question: 'What support do you provide to artists?',
          answer: 'We offer profile optimization tips, marketing support, booking management tools, and dedicated artist support. Our team helps you maximize your visibility and booking potential on the platform.'
        }
      ]
    }
  ];

  return (
    <PageLayout
      title="Frequently Asked Questions"
      description="Find answers to common questions about using ANDACTION platform and services."
    >
      <div className="space-y-8">
        {/* Search Hint */}
        <div className="text-center py-6 bg-gradient-to-r from-primary-orange/10 to-primary-pink/10 rounded-xl border border-primary-pink/20">
          <p className="text-text-light-gray">
            Can&apos;t find what you&apos;re looking for? <a href="#contact" className="text-primary-pink hover:underline">Contact our support team</a> for personalized assistance.
          </p>
        </div>

        {/* FAQ Categories */}
        <FAQAccordion categories={faqCategories} />

        {/* Contact Support Section */}
        <section id="contact" className="bg-card/30 rounded-xl p-8 border border-background-light">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">Still Have Questions?</h2>
          <p className="text-text-light-gray text-center mb-8 leading-relaxed">
            Our support team is here to help! Reach out to us through any of the following channels, 
            and we&apos;ll get back to you as soon as possible.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a
              href="mailto:support@andaction.com"
              className="flex items-center gap-4 p-6 bg-card/50 rounded-xl border border-background-light hover:border-primary-pink/30 transition-all duration-300 group"
            >
              <div className="text-primary-pink group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Email Support</h3>
                <p className="text-text-gray text-sm">support@andaction.com</p>
                <p className="text-text-gray text-xs">Response within 24 hours</p>
              </div>
            </a>

            <a
              href="tel:+918860014889"
              className="flex items-center gap-4 p-6 bg-card/50 rounded-xl border border-background-light hover:border-primary-orange/30 transition-all duration-300 group"
            >
              <div className="text-primary-orange group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Phone Support</h3>
                <p className="text-text-gray text-sm">+91 8860014889</p>
                <p className="text-text-gray text-xs">Mon-Fri, 9 AM - 6 PM IST</p>
              </div>
            </a>
          </div>

          <div className="text-center mt-8">
            <p className="text-text-gray text-sm">
              For urgent booking issues or technical problems, please call us directly. 
              For general inquiries, email is the fastest way to get detailed assistance.
            </p>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default FAQPage;
