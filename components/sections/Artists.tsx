'use client';

import React from 'react';
import ArtistSection from './ArtistSection';

// Sample data - replace with your actual data
const sampleArtists = {
  singers: [
    {
      id: '1',
      name: 'MJ Singer',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      id: '2',
      name: 'Brandon Kenter',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      id: '3',
      name: 'Kalenna Godit',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1595971294624-80bcf0d7eb24?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    {
      id: '4',
      name: 'Kierra Levin',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    },
    {
      id: '5',
      name: 'Hanna Westervelt',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    },
    {
      id: '6',
      name: 'Ashlynn Dorsaint',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    },
    {
      id: '7',
      name: 'Melia',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    },
    {
      id: '110',
      name: 'Asish',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1415886541506-6efc5e4b1786?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bXVzaWNpYW58ZW58MHx8MHx8fDA%3D',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    },
  ],
  devotional: [
    {
      id: '8',
      name: 'Hanna Korsigaard',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
    {
      id: '9',
      name: 'Brandon Kenter',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    },
    {
      id: '10',
      name: 'Kalenna Godit',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1595971294624-80bcf0d7eb24?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    },
    {
      id: '11',
      name: 'Kierra Levin',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    },
    {
      id: '12',
      name: 'Hanna Westervelt',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    },
    {
      id: '13',
      name: 'Ashlynn Dorsaint',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    },
    {
      id: '111',
      name: 'Asish',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1415886541506-6efc5e4b1786?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bXVzaWNpYW58ZW58MHx8MHx8fDA%3D',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',

    },
    {
      id: '112',
      name: 'Shakti',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',

    },
  ],
  liveBand: [
    {
      id: '14',
      name: 'Hanna Korsigaard',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      id: '15',
      name: 'Brandon Kenter',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      id: '16',
      name: 'Kalenna Godit',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1595971294624-80bcf0d7eb24?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    {
      id: '17',
      name: 'Kierra Levin',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    },
    {
      id: '18',
      name: 'Hanna Westervelt',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    },
    {
      id: '19',
      name: 'Ashlynn Dorsaint',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    },
    {
      id: '113',
      name: 'Asish',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1415886541506-6efc5e4b1786?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bXVzaWNpYW58ZW58MHx8MHx8fDA%3D',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    },
    {
      id: '114',
      name: 'Shakti',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    },
  ],
  djVj: [
    {
      id: '20',
      name: 'Hanna Korsigaard',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
    {
      id: '21',
      name: 'Brandon Kenter',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    },
    {
      id: '22',
      name: 'Kalenna Godit',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1595971294624-80bcf0d7eb24?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    },
    {
      id: '23',
      name: 'Kierra Levin',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    },
    {
      id: '24',
      name: 'Hanna Westervelt',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    },
    {
      id: '25',
      name: 'Ashlynn Dorsaint',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    },
    {
      id: '115',
      name: 'Asish',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1415886541506-6efc5e4b1786?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bXVzaWNpYW58ZW58MHx8MHx8fDA%3D',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    },
    {
      id: '116',
      name: 'Shakti',
      location: 'Location',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=500&fit=crop&crop=face',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    },
  ],
};

const Artists: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen pb-20 md:pt-0">
      {/* Background Image */}
      <div className="absolute inset-0 -translate-y-32 z-0">
        <div
          className="w-full h-auto bg-cover bg-top bg-no-repeat md:block hidden"
          style={{
            backgroundImage: 'url(/home-bg.webp)',
            minHeight: '120vh',
          }}
        />
        <div
          className="w-full h-auto bg-cover bg-top bg-no-repeat md:hidden"
          style={{
            backgroundImage: 'url(/home-bg-mobile.webp)',
            minHeight: '100vh',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Singer Section */}
        <ArtistSection
          title="Singer"
          artists={sampleArtists.singers}
        />

        {/* Anchor/emcee Section */}
        <ArtistSection
          title="Anchor/emcee"
          artists={sampleArtists.devotional}
        />

        {/* Live Band Section */}
        <ArtistSection
          title="Live Band"
          artists={sampleArtists.liveBand}
        />

        {/* DJ / VJ Section */}
        <ArtistSection
          title="DJ / VJ"
          artists={sampleArtists.djVj}
        />
      </div>
    </section>
  );
};

export default Artists;
