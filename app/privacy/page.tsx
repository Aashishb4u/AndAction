import React from 'react';
import { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { Shield, Eye, Lock, Users, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - ANDACTION | Your Data Protection & Privacy Rights',
  description: 'Learn how ANDACTION protects your personal information, data collection practices, cookie usage, and your privacy rights. Updated privacy policy for transparent data handling.',
  keywords: 'privacy policy, data protection, ANDACTION privacy, personal information, cookies, user rights, data security',
  openGraph: {
    title: 'Privacy Policy - ANDACTION',
    description: 'Your privacy matters to us. Learn how we protect and handle your personal information.',
    type: 'website',
  },
};

const PrivacyPage = () => {
  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: <Eye className="w-6 h-6" />,
      content: [
        {
          subtitle: 'Personal Information',
          text: 'We collect information you provide directly, including name, email address, phone number, payment information, and profile details when you create an account or book services.'
        },
        {
          subtitle: 'Usage Information',
          text: 'We automatically collect information about your interactions with our platform, including pages visited, features used, and time spent on our service.'
        },
        {
          subtitle: 'Device Information',
          text: 'We collect device-specific information such as IP address, browser type, operating system, and mobile device identifiers.'
        }
      ]
    },
    {
      id: 'information-usage',
      title: 'How We Use Your Information',
      icon: <Users className="w-6 h-6" />,
      content: [
        {
          subtitle: 'Service Provision',
          text: 'To provide, maintain, and improve our platform, process bookings, facilitate communications between users, and provide customer support.'
        },
        {
          subtitle: 'Communication',
          text: 'To send you service-related notifications, booking confirmations, promotional materials (with your consent), and respond to your inquiries.'
        },
        {
          subtitle: 'Safety & Security',
          text: 'To verify user identity, prevent fraud, ensure platform security, and comply with legal obligations.'
        }
      ]
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing',
      icon: <Shield className="w-6 h-6" />,
      content: [
        {
          subtitle: 'With Other Users',
          text: 'Profile information is shared with other users as necessary for booking and communication purposes. We never share payment information with other users.'
        },
        {
          subtitle: 'Service Providers',
          text: 'We share information with trusted third-party service providers who assist in operating our platform, processing payments, and providing customer support.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose information when required by law, to protect our rights, or to ensure user safety and platform security.'
        }
      ]
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: <Lock className="w-6 h-6" />,
      content: [
        {
          subtitle: 'Security Measures',
          text: 'We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information.'
        },
        {
          subtitle: 'Payment Security',
          text: 'All payment information is processed through secure, PCI-compliant payment processors. We do not store complete payment card information on our servers.'
        },
        {
          subtitle: 'Access Controls',
          text: 'Access to personal information is restricted to authorized personnel who need it to perform their job functions.'
        }
      ]
    }
  ];

  const userRights = [
    'Access and review your personal information',
    'Correct inaccurate or incomplete information',
    'Delete your account and associated data',
    'Opt-out of marketing communications',
    'Request data portability',
    'Withdraw consent for data processing'
  ];

  return (
    <PageLayout
      title="Privacy Policy"
      description="Your privacy is important to us. Learn how we collect, use, and protect your personal information."
    >
      <div className="space-y-12">
        {/* Last Updated */}
        <div className="text-center py-4 bg-card/30 rounded-lg border border-background-light">
          <p className="text-text-gray text-sm">
            <strong>Last Updated:</strong> September 12, 2025
          </p>
        </div>

        {/* Introduction */}
        <section>
          <p className="text-text-light-gray leading-relaxed mb-6">
            At ANDACTION, we are committed to protecting your privacy and ensuring the security of your personal 
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our platform and services.
          </p>
          <p className="text-text-light-gray leading-relaxed">
            By using ANDACTION, you agree to the collection and use of information in accordance with this policy. 
            We encourage you to read this policy carefully and contact us if you have any questions.
          </p>
        </section>

        {/* Main Sections */}
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <div className="flex items-center gap-3 mb-6">
              <div className="text-primary-pink">{section.icon}</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{section.title}</h2>
            </div>
            <div className="space-y-6">
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex} className="bg-card/20 rounded-lg p-6 border border-background-light">
                  <h3 className="text-lg font-semibold text-white mb-3">{item.subtitle}</h3>
                  <p className="text-text-light-gray leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Cookies Section */}
        <section id="cookies">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Cookies and Tracking</h2>
          <div className="bg-card/20 rounded-lg p-6 border border-background-light">
            <p className="text-text-light-gray leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience on our platform. 
              Cookies help us remember your preferences, analyze site traffic, and provide personalized content.
            </p>
            <p className="text-text-light-gray leading-relaxed">
              You can control cookie settings through your browser preferences. However, disabling certain 
              cookies may limit some functionality of our platform.
            </p>
          </div>
        </section>

        {/* User Rights */}
        <section id="user-rights">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Your Rights</h2>
          <div className="bg-gradient-to-r from-primary-orange/10 to-primary-pink/10 rounded-xl p-6 border border-primary-pink/20">
            <p className="text-text-light-gray mb-4">As a user of ANDACTION, you have the right to:</p>
            <ul className="space-y-2">
              {userRights.map((right, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-pink rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-text-light-gray">{right}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact Information */}
        <section id="contact" className="bg-card/30 rounded-xl p-8 border border-background-light">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">Privacy Questions?</h2>
          <p className="text-text-light-gray text-center mb-6">
            If you have questions about this Privacy Policy or how we handle your personal information, 
            please contact us:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:privacy@andaction.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-pink text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary-pink/25 transition-all duration-300"
            >
              <Mail className="w-4 h-4" />
              <span>privacy@andaction.com</span>
            </a>
            <a
              href="tel:+918860014889"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-pink text-primary-pink font-semibold rounded-full hover:bg-primary-pink hover:text-white transition-all duration-300"
            >
              <Phone className="w-4 h-4" />
              <span>+91 8860014889</span>
            </a>
          </div>
        </section>

        {/* Changes to Policy */}
        <section className="text-center py-6 bg-card/20 rounded-lg border border-background-light">
          <h3 className="text-lg font-semibold text-white mb-3">Changes to This Policy</h3>
          <p className="text-text-gray text-sm leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
            the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. We encourage you to 
            review this Privacy Policy periodically for any changes.
          </p>
        </section>
      </div>
    </PageLayout>
  );
};

export default PrivacyPage;
