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
        {/* Mission Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Our Mission</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-text-light-gray leading-relaxed mb-4">
              At ANDACTION, we&apos;re revolutionizing the way people discover and book entertainment for their events. 
              Our mission is to create a seamless bridge between talented artists and event organizers, making it 
              easier than ever to bring exceptional performances to life.
            </p>
            <p className="text-text-light-gray leading-relaxed">
              Whether you&apos;re planning a wedding, corporate event, festival, or private party, we believe every 
              occasion deserves the perfect soundtrack. Our platform empowers artists to showcase their talents 
              while helping event organizers find exactly what they&apos;re looking for.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Why Choose ANDACTION?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card/30 border border-background-light rounded-xl p-6 hover:border-primary-pink/30 transition-all duration-300"
              >
                <div className="text-primary-pink mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-text-light-gray leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6 bg-card/20 rounded-xl border border-background-light hover:border-primary-orange/30 transition-all duration-300"
              >
                <div className="text-primary-orange mb-4 flex justify-center">{value.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-text-gray text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Our Story</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-text-light-gray leading-relaxed mb-4">
              ANDACTION was born from a simple observation: finding the right entertainment for events was 
              unnecessarily complicated. Event organizers struggled to discover talented artists, while 
              performers found it challenging to reach their ideal audience.
            </p>
            <p className="text-text-light-gray leading-relaxed mb-4">
              Founded by a team of music enthusiasts and technology experts, we set out to create a platform 
              that would solve these challenges. Today, ANDACTION serves thousands of artists and event 
              organizers across the country, facilitating countless memorable performances.
            </p>
            <p className="text-text-light-gray leading-relaxed">
              We&apos;re more than just a booking platform – we&apos;re a community dedicated to celebrating talent 
              and creating unforgettable moments through the power of live entertainment.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-primary-orange/10 to-primary-pink/10 rounded-xl p-8 border border-primary-pink/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">Get in Touch</h2>
          <div className="text-center">
            <p className="text-text-light-gray mb-6 leading-relaxed">
              Have questions about our platform or want to learn more about how ANDACTION can help 
              your next event? We&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="tel:+918860014889"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-orange to-primary-pink text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary-pink/25 transition-all duration-300"
              >
                <span>Call Us: +91 8860014889</span>
              </a>
              <a
                href="mailto:support@andaction.com"
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
