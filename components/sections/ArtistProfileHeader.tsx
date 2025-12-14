'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Artist } from '@/types';
import BookingRequestModal from '@/components/modals/BookingRequestModal';
import BookingSuccessModal from '@/components/modals/BookingSuccessModal';
import { BookingFormData } from '@/components/modals/BookingRequestModal';
import Bookmark from '../icons/bookmark';
import { createBooking } from '@/app/artists/[id]/page';

interface ArtistProfileHeaderProps {
  artist: Artist;
  onBack: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onRequestBooking: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  isMobile?: boolean;
  disabledDates?: Date[];
}

const ArtistProfileHeader: React.FC<ArtistProfileHeaderProps> = ({
  artist,
  onBack,
  onBookmark,
  onShare,
  onRequestBooking,
  onCall,
  onWhatsApp,
  isMobile = false,
  disabledDates,
}) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();


  const formatPrice = (price: number) => {
    return `₹ ${price.toLocaleString()}`;
  };

  const handleRequestBooking = () => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    // User is logged in → open modal
    setShowBookingModal(true);
  };


  const handleBookingSubmit = (formData: BookingFormData) => {
    // Here you would typically send the data to your API
    console.log('Booking request submitted:', formData);
    createBooking(artist.id, formData).then(data => {
      console.log('Booking creation response:', data);
    }).catch(error => {
      console.error('Error creating booking:', error);
    });

    // Close booking modal and show success modal
    setShowBookingModal(false);
    setShowSuccessModal(true);

    // Call the original onRequestBooking if provided
    onRequestBooking?.();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
  };

  // modals render
  const renderModals = () => {
    return (
      <>
        {/* Booking Request Modal */}
        <BookingRequestModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSubmit={handleBookingSubmit}
          disabledDates={disabledDates}
        // artistName={artist.name}
        />

        {/* Booking Success Modal */}
        <BookingSuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessClose}
        // artistName={artist.name}
        />
      </>
    );
  };

  if (isMobile) {
    return (
      <div className="relative">
        {/* Mobile Header Image */}
        <div className="relative h-[80vh] w-full">
          <Image
            src={artist.image || "/icons/images.jpeg"}
            alt={artist.name || "artist"}
            fill
            className="object-cover"
            priority
          />


          {/* Status Bar Spacer */}
          <div className="h-12" />

          {/* Header Controls */}
          <div className="absolute top-12 left-4 right-4 flex justify-between z-10">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex flex-col gap-3">
              <button
                onClick={onBookmark}
                className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                 <Bookmark className="w-5 h-5" active={artist.isBookmarked} />
              </button>

              <button
                onClick={onShare}
                className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

          {/* Artist Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h1 className="t1">{artist.name}</h1>
            <p className="mb-1">
              {artist.category} | {artist.location}
            </p>
            <div className="flex items-center justify-between">
              <p className="secondary-text font-normal text-text-gray mb-1">Starting Price</p>
              <p>{formatPrice(artist.startingPrice)}</p>
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/98 backdrop-blur-md border-t border-gray-800 z-50">
          <div className="grid grid-cols-3 w-full place-items-center gap-4">
            <button
              onClick={handleRequestBooking}
              className="w-full bg-gradient-to-r from-primary-orange to-primary-pink text-white py-3 px-4 rounded-full font-medium hover:shadow-lg hover:shadow-primary-pink/25 transition-all duration-300 col-span-2 relative"
            >
              Request Booking
            </button>

            {/*<div className="flex gap-3">
              <button
                onClick={onCall}
                className="flex-1 bg-card border border-border-color backdrop-blur-sm text-white size-12 shrink-0 rounded-full font-medium hover:bg-background transition-colors flex items-center justify-center"
              >
                <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>

              <button
                onClick={onWhatsApp}
                className="flex-1 bg-card border border-border-color backdrop-blur-sm text-white size-12 shrink-0 rounded-full font-medium hover:bg-background transition-colors flex items-center justify-center"
              >
                <svg className="size-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
              </button>
            </div>*/}
          </div>
        </div>
        {renderModals()}
      </div>
    );
  }

  // Desktop Layout - Match Figma exactly
  return (
    <>
      <div className="h-screen bg-background relative">
        {/* Artist Image */}
        <div className="relative min-h-[600px] rounded-2xl overflow-hidden mx-4">
          <Image
            src={artist.image}
            alt={artist.name}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Header Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex flex-col gap-2">
              <button
                onClick={onBookmark}
                className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <Bookmark className="w-5 h-5" active={artist.isBookmarked} />
              </button>

              <button
                onClick={onShare}
                className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Artist Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="t1 mb-1">{artist.name}</h1>
            <p className="mb-1 text-white">
              {artist.category} | {artist.location}
            </p>

            <div className="mb-3 flex justify-between items-center gap-3">
              <p className="text-text-gray secondary-text">Starting Price</p>
              <p>{formatPrice(artist.startingPrice)}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-3 place-items-center gap-4">
              <button
                onClick={handleRequestBooking}
                className="w-full bg-gradient-to-r from-primary-orange to-primary-pink text-white py-3 px-4 rounded-full font-medium hover:shadow-lg hover:shadow-primary-pink/25 transition-all duration-300 md:col-span-2"
              >
                Request Booking
              </button>

              {/*<div className="flex gap-3">
                <button
                  onClick={onCall}
                  className="flex-1 bg-card border border-border-color backdrop-blur-sm text-white size-10 shrink-0 rounded-full font-medium hover:bg-background transition-colors flex items-center justify-center"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>

                <button
                  onClick={onWhatsApp}
                  className="flex-1 bg-card border border-border-color backdrop-blur-sm text-white size-10 shrink-0 rounded-full font-medium hover:bg-background transition-colors flex items-center justify-center"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                </button>
              </div>*/}
            </div>
          </div>
        </div>
      </div>
      {renderModals()}
    </>
  );
};

export default ArtistProfileHeader;
