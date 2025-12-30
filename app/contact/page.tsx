import React from 'react';
import { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us - ANDACTION | Get in Touch with Our Team',
  description: 'Have questions about booking artists or need support? Contact ANDACTION team through email, phone, or our contact form. We\'re here to help make your event memorable.',
  keywords: 'contact ANDACTION, customer support, booking help, artist platform contact, event planning assistance',
  openGraph: {
    title: 'Contact Us - ANDACTION',
    description: 'Get in touch with ANDACTION team for any questions or support needs.',
    type: 'website',
  },
};

const ContactPage = () => {
  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Phone',
      details: '+91 8860014889',
      link: 'tel:+918860014889',
      description: 'Available Mon-Sat, 9AM-6PM IST',
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email',
      details: 'support@andaction.com',
      link: 'mailto:support@andaction.com',
      description: 'We\'ll respond within 24 hours',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Location',
      details: 'India',
      link: null,
      description: 'Serving clients nationwide',
    },
  ];

  const quickLinks = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: 'FAQs',
      description: 'Find quick answers to common questions',
      link: '/faqs',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Support Hours',
      description: 'Monday to Saturday: 9:00 AM - 6:00 PM IST',
      link: null,
    },
  ];

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            <span className="gradient-text">Get in Touch</span>
          </h1>
          <p className="text-text-gray text-base sm:text-lg max-w-2xl mx-auto">
            Have a question or need assistance? We&apos;re here to help! Reach out to us
            through any of the following channels.
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 lg:mb-16">
          {contactInfo.map((info, index) => (
            <div
              key={index}
              className="bg-card border border-border-color rounded-2xl p-6 hover:border-primary-pink/30 transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-pink/20 to-primary-orange/20 flex items-center justify-center mb-4">
                  <div className="text-primary-pink">{info.icon}</div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {info.title}
                </h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-primary-pink hover:text-primary-orange transition-colors duration-200 font-medium mb-2"
                  >
                    {info.details}
                  </a>
                ) : (
                  <p className="text-white font-medium mb-2">{info.details}</p>
                )}
                <p className="text-text-gray text-sm">{info.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quickLinks.map((link, index) => (
            <div
              key={index}
              className="bg-card border border-border-color rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-pink/20 to-primary-orange/20 flex items-center justify-center flex-shrink-0">
                  <div className="text-primary-pink">{link.icon}</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{link.title}</h3>
                  {link.link ? (
                    <a
                      href={link.link}
                      className="text-text-gray hover:text-primary-pink transition-colors duration-200"
                    >
                      {link.description}
                    </a>
                  ) : (
                    <p className="text-text-gray">{link.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 lg:mt-16 text-center">
          <p className="text-text-gray">
            For urgent matters, please call us directly at{' '}
            <a
              href="tel:+918860014889"
              className="text-primary-pink hover:text-primary-orange transition-colors duration-200 font-medium"
            >
              +91 8860014889
            </a>
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactPage;
