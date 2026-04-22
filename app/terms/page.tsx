import React from 'react';
import { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { FileText, Users, CreditCard, Shield, AlertTriangle, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions - ANDACTION | User Agreement & Service Terms',
  description: 'Read ANDACTION\'s terms of service covering user agreements, platform usage, booking policies, payment terms, and legal obligations for artists and event organizers.',
  keywords: 'terms of service, user agreement, ANDACTION terms, booking terms, payment policy, platform rules, legal terms',
  openGraph: {
    title: 'Terms & Conditions - ANDACTION',
    description: 'Important terms and conditions governing the use of ANDACTION platform and services.',
    type: 'website',
  },
};

const TermsPage = () => {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: <FileText className="w-6 h-6" />,
      content: [
        {
          subtitle: 'Agreement to Terms',
          text: 'By accessing and using ANDACTION, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
        },
        {
          subtitle: 'Eligibility',
          text: 'You must be at least 18 years old to use our services. By using ANDACTION, you represent and warrant that you have the legal capacity to enter into this agreement.'
        },
        {
          subtitle: 'Modifications',
          text: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.'
        }
      ]
    },
    {
      id: 'user-accounts',
      title: 'User Accounts & Responsibilities',
      icon: <Users className="w-6 h-6" />,
      content: [
        {
          subtitle: 'Account Creation',
          text: 'You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.'
        },
        {
          subtitle: 'Account Security',
          text: 'You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account or any other breach of security.'
        },
        {
          subtitle: 'Prohibited Activities',
          text: 'Users may not engage in fraudulent activities, harassment, spam, copyright infringement, or any illegal activities on our platform.'
        }
      ]
    },
    {
      id: 'booking-terms',
      title: 'Booking & Service Terms',
      icon: <Shield className="w-6 h-6" />,
      content: [
        {
          subtitle: 'Booking Process',
          text: 'All bookings are subject to artist availability and confirmation. ANDACTION facilitates connections but does not guarantee the availability or performance quality of any artist.'
        },
        {
          subtitle: 'Cancellation Policy',
          text: 'Cancellation terms vary by artist and booking type. Cancellation fees may apply. Both parties must adhere to the agreed-upon cancellation policy for each booking.'
        },
        {
          subtitle: 'Performance Standards',
          text: 'Artists are expected to provide professional services as described in their profiles. Event organizers must provide accurate event details and suitable performance conditions.'
        }
      ]
    },
    {
      id: 'payment-terms',
      title: 'Payment Terms',
      icon: <CreditCard className="w-6 h-6" />,
      content: [
        {
          subtitle: 'Payment Processing',
          text: 'All payments are processed through secure third-party payment processors. ANDACTION may charge service fees for facilitating bookings and transactions.'
        },
        {
          subtitle: 'Refund Policy',
          text: 'Refunds are subject to the specific terms agreed upon between the artist and event organizer. ANDACTION service fees are generally non-refundable except in cases of platform error.'
        },
        {
          subtitle: 'Disputes',
          text: 'Payment disputes should be reported within 30 days of the event date. We will mediate disputes fairly but cannot guarantee resolution in favor of any party.'
        }
      ]
    }
  ];

  const prohibitedUses = [
    'Violating any local, state, national, or international law',
    'Transmitting or procuring the sending of advertising or promotional material without prior written consent',
    'Impersonating or attempting to impersonate the company, employees, another user, or any other person',
    'Using the service in any way that could disable, overburden, damage, or impair the site',
    'Attempting to interfere with the proper working of the service',
    'Using any robot, spider, or other automatic device to access the service'
  ];

  return (
    <PageLayout
      title="Terms & Conditions"
      description="Please read these terms carefully before using our platform and services."
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
            These Terms and Conditions (&quot;Terms&quot;) govern your use of the ANDACTION platform and services.
            By accessing or using our service, you agree to be bound by these Terms. If you disagree with 
            any part of these terms, then you may not access the service.
          </p>
          <p className="text-text-light-gray leading-relaxed">
            ANDACTION operates as a platform connecting artists with event organizers. We facilitate these 
            connections but are not party to the actual service agreements between users.
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

        {/* Prohibited Uses */}
        <section id="prohibited-uses">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-red-400"><AlertTriangle className="w-6 h-6" /></div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Prohibited Uses</h2>
          </div>
          <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
            <p className="text-text-light-gray mb-4">You may not use our service:</p>
            <ul className="space-y-2">
              {prohibitedUses.map((use, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-text-light-gray">{use}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Liability & Disclaimers */}
        <section id="liability">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-primary-orange"><Scale className="w-6 h-6" /></div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Liability & Disclaimers</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-card/20 rounded-lg p-6 border border-background-light">
              <h3 className="text-lg font-semibold text-white mb-3">Platform Disclaimer</h3>
              <p className="text-text-light-gray leading-relaxed">
                ANDACTION provides a platform for connecting artists and event organizers. We do not guarantee 
                the quality, safety, or legality of any services provided by users. All interactions and 
                transactions are between users at their own risk.
              </p>
            </div>
            <div className="bg-card/20 rounded-lg p-6 border border-background-light">
              <h3 className="text-lg font-semibold text-white mb-3">Limitation of Liability</h3>
              <p className="text-text-light-gray leading-relaxed">
                ANDACTION shall not be liable for any indirect, incidental, special, consequential, or punitive 
                damages resulting from your use of the service. Our total liability shall not exceed the amount 
                paid by you to ANDACTION in the 12 months preceding the claim.
              </p>
            </div>
            <div className="bg-card/20 rounded-lg p-6 border border-background-light">
              <h3 className="text-lg font-semibold text-white mb-3">Indemnification</h3>
              <p className="text-text-light-gray leading-relaxed">
                You agree to indemnify and hold ANDACTION harmless from any claims, damages, or expenses 
                arising from your use of the service or violation of these terms.
              </p>
            </div>
          </div>
        </section>

        {/* Governing Law */}
        <section id="governing-law" className="bg-card/30 rounded-xl p-8 border border-background-light">
          <h2 className="text-2xl font-bold text-white mb-4">Governing Law</h2>
          <p className="text-text-light-gray leading-relaxed mb-4">
            These Terms shall be interpreted and governed by the laws of India. Any disputes arising from 
            these terms or your use of the service shall be subject to the exclusive jurisdiction of the 
            courts in New Delhi, India.
          </p>
          <p className="text-text-light-gray leading-relaxed">
            If any provision of these Terms is found to be unenforceable, the remaining provisions will 
            remain in full force and effect.
          </p>
        </section>

        {/* Contact Information */}
        <section className="text-center py-6 bg-gradient-to-r from-primary-orange/10 to-primary-pink/10 rounded-xl border border-primary-pink/20">
          <h3 className="text-lg font-semibold text-white mb-3">Questions About These Terms?</h3>
          <p className="text-text-gray text-sm mb-4">
            If you have any questions about these Terms and Conditions, please contact us:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:legal@andaction.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-pink text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary-pink/25 transition-all duration-300"
            >
              <span>legal@andaction.com</span>
            </a>
            <a
              href="tel:+918860014889"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-pink text-primary-pink font-semibold rounded-full hover:bg-primary-pink hover:text-white transition-all duration-300"
            >
              <span>+91 8860014889</span>
            </a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default TermsPage;
