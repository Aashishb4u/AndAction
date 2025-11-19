'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import ArtistProfileHeader from '@/components/sections/ArtistProfileHeader';
import ArtistDetailTabs from '@/components/sections/ArtistDetailTabs';
import { Artist } from '@/types';
import LoadingSpinner from '@/components/ui/Loading';
import { transformArtist } from '../transformArtist';

const getArtistById = async (id: string): Promise<Artist | null> => {
  const res = await fetch(`/api/artists/${id}`, { cache: 'no-store' })
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json.data.artist ? transformArtist(json.data.artist) : null;
}

export default function ArtistDetailPage() {
  const params: { id: string } = useParams();
  const { id } = params;
  const router = useRouter();
  const [artist, setArtist] = React.useState<Artist | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const handleBack = () => {
    router.back();
  };

  const handleBookmark = () => {
    // Handle bookmark logic
    console.log('Bookmark toggled');
  };

  const handleShare = () => {
    // Handle share logic
    console.log('Share artist');
  };

  const handleRequestBooking = () => {
    // Handle booking request
    console.log('Request booking');
  };

  const handleCall = () => {
    if (artist?.phone) {
      window.open(`tel:${artist?.phone}`, '_self');
    }
  };

  const handleWhatsApp = () => {
    if (artist?.whatsapp) {
      window.open(`https://wa.me/${artist.whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  useEffect(() => {
    const fetchArtist = async () => {
      const artist = await getArtistById(id);
      setArtist(artist);
      setLoading(false);
      return artist;
    };
    fetchArtist();
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullScreen text='Loading artist...'/>
  }

  if (!artist) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Artist not found</h1>
            <button
              onClick={handleBack}
              className="text-primary-pink hover:text-primary-orange transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout hideNavbar hideBottomBar>
      {/* Desktop Layout */}
      <div className="hidden max-w-7xl mx-auto lg:flex min-h-screen bg-background py-10 lg:py-14">
        {/* Left Side - Artist Profile */}
        <div className="w-[400px] flex-shrink-0">
          <ArtistProfileHeader
            artist={artist}
            onBack={handleBack}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onRequestBooking={handleRequestBooking}
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
          />
        </div>

        {/* Right Side - Artist Details */}
        <div className="flex-1">
          <ArtistDetailTabs artist={artist} />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-background">
        <ArtistProfileHeader
          artist={artist}
          onBack={handleBack}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onRequestBooking={handleRequestBooking}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          isMobile={true}
        />
        <ArtistDetailTabs artist={artist} isMobile={true} />
      </div>
    </SiteLayout>
  );
}
