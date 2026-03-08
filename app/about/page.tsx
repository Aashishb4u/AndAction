import React from 'react';
import { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { Users, Target, Heart, Zap, Music, Calendar, Shield, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us - ANDACTION | Connecting Talent with Unforgettable Experiences',
  description: 'Learn about ANDACTION\'s mission to revolutionize event entertainment by connecting talented artists with event organizers. Discover our story, values, and commitment to creating unforgettable experiences.',
  keywords: 'about ANDACTION, artist booking platform, event entertainment, talent discovery, artist management, event planning',
  openGraph: {
    title: 'About Us - ANDACTION',
    description: 'Connecting talent with unforgettable experiences, all in one place!',
    type: 'website',
  },
};

const AboutPage = () => {
  const features = [
    {
      icon: <Music className="w-8 h-8" />,
      title: 'Diverse Talent Pool',
      description: 'Access thousands of verified artists across all genres and performance types.',
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Easy Booking',
      description: 'Streamlined booking process with transparent pricing and instant confirmations.',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Payments',
      description: 'Protected transactions with escrow services and money-back guarantees.',
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Quality Assurance',
      description: 'All artists are verified and rated by previous clients for your peace of mind.',
    },
  ];

  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Excellence',
      description: 'We strive for perfection in every performance and interaction.',
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Passion',
      description: 'We believe in the power of music and art to transform experiences.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community',
      description: 'Building strong relationships between artists and event organizers.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Innovation',
      description: 'Continuously improving our platform with cutting-edge technology.',
    },
  ];

  return (
    <PageLayout
      title="About ANDACTION"
      description="Connecting talent with unforgettable experiences, all in one place!"
    >
      <div className="space-y-12">
        <section>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">About Us</h1>

          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">Connecting Talent with Opportunity</h2>

          <div className="prose prose-lg max-w-none">
            <p className="text-text-light-gray leading-relaxed mb-4">
              At And-Action, we make discovering and booking artists effortless. Whether you&apos;re looking for a magician to amaze kids at a birthday party, a live band to set the mood at your wedding, or a Sufi group to elevate your cocktail night, we connect you directly with top-tier performers—no middlemen, no hefty commissions.
            </p>

            <p className="text-text-light-gray leading-relaxed mb-4">
              But that’s not all—And-Action is also a streaming and entertainment platform. If you love watching talented artists perform, you can simply scroll, explore, and enjoy performances from amazing entertainers across various categories, just like a streaming app.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">Smart Matching for the Perfect Artist</h3>
          <p className="text-text-light-gray mb-4">We use advanced filters and smart algorithms to match you with the ideal artist based on:</p>

          <ul className="list-none space-y-2">
            <li className="text-text-light-gray">✔ Location – Find artists available in your city or region.</li>
            <li className="text-text-light-gray">✔ Budget – Get options that fit your price range.</li>
            <li className="text-text-light-gray">✔ Availability – Book artists who are free on your event date.</li>
            <li className="text-text-light-gray">✔ Performance Type &amp; Style – Choose from various categories and vibes.</li>
            <li className="text-text-light-gray">✔ And much more!</li>
          </ul>
        </section>

        <section>
          <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">A Win-Win for Everyone</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card/20 rounded-xl border border-background-light p-6">
              <h4 className="text-lg font-semibold text-white mb-3">For Event Organizers &amp; Users</h4>
              <ul className="space-y-2">
                <li className="text-text-light-gray">✅ Discover and book verified, high-quality artists effortlessly.</li>
                <li className="text-text-light-gray">✅ Browse performance videos to see artists in action before you book.</li>
                <li className="text-text-light-gray">✅ Save money! No expensive event management fees—you pay artists directly.</li>
                <li className="text-text-light-gray">✅ Scroll and watch talented performers, even if you’re not booking.</li>
              </ul>
            </div>

            <div className="bg-card/20 rounded-xl border border-background-light p-6">
              <h4 className="text-lg font-semibold text-white mb-3">For Artists</h4>
              <ul className="space-y-2">
                <li className="text-text-light-gray">✅ Get featured on a platform designed for visibility and bookings.</li>
                <li className="text-text-light-gray">✅ Reach a wider audience and land more gigs without paying hefty commissions.</li>
                <li className="text-text-light-gray">✅ Showcase your work with an immersive YouTube-like video experience.</li>
                <li className="text-text-light-gray">✅ Earn more by dealing directly with clients—no middlemen taking a cut.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <div className="prose prose-lg max-w-none">
            <p className="text-text-light-gray leading-relaxed mb-4">
              At And-Action, we bridge the gap between talent and opportunity, ensuring that every event gets the perfect artist, and every artist gets the stage they deserve. Whether you&apos;re here to book, perform, or just enjoy great entertainment, we’ve got something for you.
            </p>

            <p className="text-text-light-gray leading-relaxed font-medium">
              Let’s make magic happen—directly, affordably, and effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="tel:+918860014889"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-pink text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary-pink/25 transition-all duration-300"
              >
                <span>Call Us: +91 8860014889</span>
              </a>
              <a
                href="mailto:official@andaction.in"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-pink text-primary-pink font-semibold rounded-full hover:bg-primary-pink hover:text-white transition-all duration-300"
              >
                <span>Email Support</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default AboutPage;
