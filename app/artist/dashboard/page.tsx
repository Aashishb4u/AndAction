'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ArtistDashboardLayout from '@/components/layout/ArtistDashboardLayout';
import BookingCard from '@/components/ui/BookingCard';
import Button from '@/components/ui/Button';
import { Pencil } from 'lucide-react';

// Mock data for artists
const mockArtists = [
  {
    id: 1,
    name: 'MJ DJ',
    role: 'DJ',
    phone: '+919565556456',
    image: '/artist.png',
  },
  {
    id: 2,
    name: 'Sarah Singer',
    role: 'Singer',
    phone: '+919876543210',
    image: '/avatars/3.png',
  },
  {
    id: 3,
    name: 'Rock Band',
    role: 'Band',
    phone: '+918765432109',
    image: '/artist.png',
  },
];

// Mock data for bookings
const mockBookings = [
  {
    id: 1,
    clientName: 'Vivek Shah',
    location: 'Surat, Gujarat',
    date: '20, Sep, 2025',
    eventType: 'Party',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
  },
  {
    id: 2,
    clientName: 'Vivek Shah',
    location: 'Surat, Gujarat',
    date: '20, Sep, 2025',
    eventType: 'Party',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
  },
  {
    id: 3,
    clientName: 'Vivek Shah',
    location: 'Surat, Gujarat',
    date: '20, Sep, 2025',
    eventType: 'Party',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
  },
  {
    id: 4,
    clientName: 'Vivek Shah',
    location: 'Surat, Gujarat',
    date: '20, Sep, 2025',
    eventType: 'Party',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
  },
  {
    id: 5,
    clientName: 'Vivek Shah',
    location: 'Surat, Gujarat',
    date: '20, Sep, 2025',
    eventType: 'Party',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
  },
  {
    id: 6,
    clientName: 'Vivek Shah',
    location: 'Surat, Gujarat',
    date: '20, Sep, 2025',
    eventType: 'Party',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
  },
];

export default function ArtistDashboard() {
  const [currentArtistIndex, setCurrentArtistIndex] = useState(0);
  const router = useRouter();

  const handleReject = (bookingId: number) => {
    console.log('Reject booking:', bookingId);
  };

  const handleCall = (bookingId: number) => {
    console.log('Call client:', bookingId);
  };

  const handleDotClick = (index: number) => {
    setCurrentArtistIndex(index);
  };

  const currentArtist = mockArtists[currentArtistIndex];

  return (
    <ArtistDashboardLayout>
      <div className="md:flex w-full">
        {/* Left Sidebar - Artist Profile */}
        <div className="md:w-80 p-5">
          {/* Artist Profile Card - Desktop */}
          <div className="hidden md:block relative rounded-2xl overflow-hidden mb-3">
            <div className="relative aspect-[4/5]">
              <Image
                src={currentArtist.image}
                alt={currentArtist.name}
                fill
                className="object-cover transition-all duration-500 ease-in-out"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

              {/* Artist Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white transition-all duration-300">
                <h2 className="text-xl font-bold mb-1">{currentArtist.name} <span className="text-sm font-medium">({currentArtist.role})</span></h2>

                <div className='flex items-center gap-2 mb-3'>
                  <Image src="/icons/phone.svg" alt="Phone" width={16} height={16} />
                  <p className="text-xs text-white">{currentArtist.phone}</p>
                </div>

                <Button
                  onClick={() => router.push('/artist/profile')}
                  variant="secondary"
                  size="sm"
                  className="w-full flex items-center justify-center border-[1.5px] border-border-color!"
                >
                  <Pencil className="w-4 h-4 mr-2 text-primary-orange" />
                  <span className='gradient-text'>Edit Profile</span>
                </Button>
              </div>
            </div>

          </div>


          {/* Artist Profile Card - Mobile */}
          <div className="md:hidden bg-card border border-border-color rounded-2xl p-3 mb-3 relative">
            <div className="flex items-center gap-5 transition-all duration-300">
              {/* Artist Image */}
              <div className="w-28 h-36 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={currentArtist.image}
                  alt={currentArtist.name}
                  width={120}
                  height={150}
                  className="object-cover w-full h-full transition-all duration-500 ease-in-out"
                />
              </div>

              {/* Artist Info */}
              <div className="flex-1 transition-all duration-300">
                <h2 className="text-white h2 mb-1">{currentArtist.name}</h2>
                <p className="mb-2">{currentArtist.role}</p>

                <div className='flex items-center gap-2 mb-3'>
                  <Image src="/icons/phone-gray.svg" alt="Phone" width={18} height={18} />
                  <p className="text-text-gray">{currentArtist.phone}</p>
                </div>

                <Button
                  onClick={() => router.push('/artist/profile')}
                  variant="secondary"
                  size="sm"
                  className="flex bg-transparent items-center justify-center border-[1.5px] border-border-color px-4 py-2 w-full"
                >
                  <Pencil className="w-4 h-4 mr-2 text-primary-orange" />
                  <span className='gradient-text text-sm'>Edit Profile</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center items-center gap-2 z-10 mb-5">
            {mockArtists.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-300 hover:scale-125 ${index === currentArtistIndex
                  ? 'bg-white scale-110 w-5'
                  : 'bg-white/40 hover:bg-white/60 w-2 '
                  }`}
              />
            ))}
          </div>

          {/* Profile Progress - Desktop */}
          <div className="hidden md:block bg-card border border-border-color rounded-xl p-4 text-center">
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E8047E" />
                    <stop offset="100%" stopColor="#ED4B22" />
                  </linearGradient>
                </defs>
                <path
                  className="text-[#404040]"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  strokeDasharray="50, 100"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">50%</span>
                <span className="text-[10px] text-text-gray">Completed</span>
              </div>
            </div>
            <h3 className="text-white font-semibold mb-2">Profile Progress</h3>
            <p className="text-text-gray text-sm">
              Your overall profile progress is showing here.
            </p>
          </div>

          {/* Profile Progress - Mobile */}
          <div className="md:hidden bg-card border border-border-color rounded-xl p-3">
            <div className="flex items-center gap-3">
              {/* Progress Circle */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-24 h-24 transform" viewBox="0 0 36 36">
                  <defs>
                    <linearGradient id="progressGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ED4B22" />
                      <stop offset="100%" stopColor="#E8047E" />
                    </linearGradient>
                  </defs>
                  <path
                    className="text-[#404040]"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke="url(#progressGradientMobile)"
                    strokeWidth="3"
                    strokeDasharray="50, 100"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center pt-2 justify-center">
                  <span className="h1 leading-4! text-white font-mono!">50%</span>
                  <span className="text-[10px] text-text-gray">Completed</span>
                </div>
              </div>

              {/* Progress Info */}
              <div className="flex-1">
                <h3 className="text-white h1 mb-1">Profile Progress</h3>
                <p className="text-text-gray secondary-text">
                  Your overall profile progress is showing here.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Leads/Booking */}
        <div className="flex-1 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white h1">Leads / Booking</h1>
            <button className='flex items-center gap-1 bg-[#262626]! py-2 px-4 border-[1.5px] border-border-color rounded-full btn2'>
              <span className='gradient-text'>
                Sort by
              </span>
              <Image src="/icons/up-down.svg" alt="Sort" width={18} height={18} />
            </button>
          </div>

          {/* Booking Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 md:gap-6 gap-5 md:overflow-y-auto md:max-h-[calc(100vh-100px)] [-webkit-scrollbar-width:none] [scrollbar-width:none] [-ms-overflow-style:none]">
            {mockBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                clientName={booking.clientName}
                location={booking.location}
                date={booking.date}
                eventType={booking.eventType}
                description={booking.description}
                onReject={() => handleReject(booking.id)}
                onCall={() => handleCall(booking.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </ArtistDashboardLayout>
  );
}
