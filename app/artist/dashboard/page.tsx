'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ArtistDashboardLayout from '@/components/layout/ArtistDashboardLayout';
import BookingCard from '@/components/ui/BookingCard';
import Button from '@/components/ui/Button';
import { Pencil } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ArtistDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  console.log(session)
  // 👇 Redirect to signin if not authenticated or not artist
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    else if (status === 'authenticated' && session?.user?.role !== 'artist')
      router.push('/');
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading your dashboard...
      </div>
    );
  }

  const artist = session?.user?.artistProfile;
  const fullName = `${session?.user?.firstName ?? ''} ${session?.user?.lastName ?? ''}`.trim();

  // Mock bookings (replace with real API later)
  const mockBookings = [
    {
      id: 1,
      clientName: 'Vivek Shah',
      location: 'Surat, Gujarat',
      date: '20, Sep, 2025',
      eventType: 'Party',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
    },
  ];

  return (
    <ArtistDashboardLayout>
      <div className="md:flex w-full">
        {/* Left Sidebar - Artist Profile */}
        <div className="md:w-80 p-5">
          {/* Artist Profile Card */}
          <div className="relative rounded-2xl overflow-hidden mb-3 bg-card border border-border-color">
            <div className="relative aspect-[4/5]">
              <Image
                src={session?.user?.avatar || '/icons/images.jpeg'}
                alt={artist?.stageName || fullName || 'Artist'}
                fill
                className="object-cover transition-all duration-500 ease-in-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

              {/* Artist Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-xl font-bold mb-1">
                  {artist?.stageName || fullName || 'Your Artist Name'}{' '}
                  <span className="text-sm font-medium">
                    ({artist?.artistType || 'Performer'})
                  </span>
                </h2>

                <div className="flex items-center gap-2 mb-3">
                  <Image
                    src="/icons/phone.svg"
                    alt="Phone"
                    width={16}
                    height={16}
                  />
                  <p className="text-xs text-white">
                    {`+91` +artist?.contactNumber || session?.user?.phoneNumber || '-'}
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/artist/profile')}
                  variant="secondary"
                  size="sm"
                  className="w-full flex items-center justify-center border-[1.5px] border-border-color"
                >
                  <Pencil className="w-4 h-4 mr-2 text-primary-orange" />
                  <span className="gradient-text">Edit Profile</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Progress */}
          <div className="bg-card border border-border-color rounded-xl p-4 text-center">
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg
                className="w-28 h-28 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <defs>
                  <linearGradient
                    id="progressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
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
                  strokeDasharray="80, 100"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">80%</span>
                <span className="text-[10px] text-text-gray">Completed</span>
              </div>
            </div>
            <h3 className="text-white font-semibold mb-2">Profile Progress</h3>
            <p className="text-text-gray text-sm">
              Your overall profile progress is showing here.
            </p>
          </div>
        </div>

        {/* Right Content - Leads/Booking */}
        <div className="flex-1 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white h1">Leads / Bookings</h1>
            <button className="flex items-center gap-1 bg-[#262626]! py-2 px-4 border-[1.5px] border-border-color rounded-full btn2">
              <span className="gradient-text">Sort by</span>
              <Image
                src="/icons/up-down.svg"
                alt="Sort"
                width={18}
                height={18}
              />
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
                onReject={() => console.log('Reject', booking.id)}
                onCall={() => console.log('Call', booking.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </ArtistDashboardLayout>
  );
}
