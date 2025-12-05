"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SiteLayout from "@/components/layout/SiteLayout";
import ArtistProfileHeader from "@/components/sections/ArtistProfileHeader";
import ArtistDetailTabs from "@/components/sections/ArtistDetailTabs";
import { BookingStatus } from "@prisma/client";

export const createBooking = async (artistId: string, formData: any) => {
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        artistId,
        eventDate: formData.eventDate,
        eventType: formData.eventType,
        eventLocation: `${formData.city}, ${formData.state}`,
        totalPrice: formData.totalPrice,
        notes: formData.note,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const updateBookingState = async (
  bookingId: string,
  status: BookingStatus
) => {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newStatus: status,
      }),
    });

    const data = await response.json();
    console.log("updated booking status:", data);
    return data;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

export const getBookingsByStatus = async (artistId: string) => {
  try {
    const response = await fetch(`/api/bookings/slots/?artistId=${artistId}`);
    const json = await response.json();
    return json.data.bookings;
  } catch (error) {
    console.error("Error fetching bookings by status:", error);
    throw error;
  }
};

export default function ArtistDetailPage() {
  const router = useRouter();
  const { id: artistId } = useParams();
  const { data: session } = useSession();
  const [artist, setArtist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);

  useEffect(() => {
    if (!artistId) return;

    const fetchArtist = async () => {
      try {
        const res = await fetch(`/api/artists/${artistId}`);
        const json = await res.json();

        if (!json.success || !json.data?.artist) {
          setArtist(null);
          return;
        }

        const a = json.data.artist;
        const mappedArtist: any = {
          id: a.id,
          name: a.stageName || `${a.user.firstName} ${a.user.lastName}`.trim(),
          category: a.artistType,
          subCategory: [a.subArtistType],
          location: `${a.user.city || ""}${
            a.user.state ? ", " + a.user.state : ""
          }`,
          image: a.user.avatar || "/icons/images.jpeg",
          gender: a.user.gender || "unknown",

          bio: a.shortBio || "",
          yearsOfExperience: a.yearsOfExperience || 0,
          achievements: [a.achievements], // ? a.achievements.split(',').map(x => x.trim()) : [],
          subArtistTypes: [a.subArtistType], // ? a.subArtistType.split(',').map(x => x.trim()) : [],
          languages: [a.performingLanguage], // ? a.performingLanguage.split(',').map(x => x.trim()) : [],

          soloChargesFrom: a.soloChargesFrom || 0,
          soloChargesTo: a.soloChargesTo || 0,
          soloChargesDescription: a.soloChargesDescription || "",

          chargesWithBacklineFrom: a.chargesWithBacklineFrom || 0,
          chargesWithBacklineTo: a.chargesWithBacklineTo || 0,
          chargesWithBacklineDescription:
            a.chargesWithBacklineDescription || "",

          performingDurationFrom: a.performingDurationFrom || "",
          performingDurationTo: a.performingDurationTo || "",
          performingMembers: a.performingMembers || "",
          offStageMembers: a.offStageMembers || "",

          performingEventType: a.performingEventType || "",
          performingStates: a.performingStates || "",

          duration: `${a.performingDurationFrom || ""} - ${
            a.performingDurationTo || ""
          } minutes`,
          startingPrice: Number(a.soloChargesFrom) || 0,

          phone: a.contactNumber || "",
          whatsapp: a.whatsappNumber || "",
          isBookmarked: false,

          // UI expects these
          videos: [],
          shorts: [],
          performances: [],
        };

        return mappedArtist;
      } catch (err) {
        console.error("Artist Fetch Error:", err);
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      const [fetchedArtist, approvedBookings] = await Promise.all([
        fetchArtist(),
        getBookingsByStatus(artistId as string),
      ]);
      setArtist(fetchedArtist);
      setDisabledDates(approvedBookings.map((b: any) => new Date(b.eventDate)));
    };

    fetchData();
  }, [artistId]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center text-white">
          Loading...
        </div>
      </SiteLayout>
    );
  }

  if (!artist) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Artist not found
            </h1>
            <button
              onClick={() => router.back()}
              className="text-primary-pink hover:text-primary-orange transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const handleBack = () => router.back();
  const handleBookmark = async () => {
  if (!session?.user) {
    router.push("/auth/signin");
    return;
  }

  if (!artist) return;

  try {
    // -------------------------------
    // REMOVE BOOKMARK
    // -------------------------------
    if (artist.isBookmarked && artist.bookmarkId) {
      const res = await fetch(`/api/bookmarks/${artist.bookmarkId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (json.success) {
        setArtist((prev: any) => ({
          ...prev,
          isBookmarked: false,
          bookmarkId: null,
        }));
      }

      return;
    }

    // -------------------------------
    // CREATE BOOKMARK
    // -------------------------------
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ artistId: artist.id }),
    });

    const json = await res.json();

    if (json.success) {
      setArtist((prev: any) => ({
        ...prev,
        isBookmarked: true,
        bookmarkId: json.data.bookmark.id, // store ID
      }));
    }
  } catch (error) {
    console.error("Bookmark toggle error:", error);
  }
};


  const handleShare = () => console.log("Share artist");
  const handleRequestBooking = () => console.log("Request booking");
  const handleCall = () => window.open(`tel:${`+918248621277`}`, "_self");
  const handleWhatsApp = () =>
    window.open(
      `https://wa.me/${`+918248621277`.replace(/[^0-9]/g, "")}`,
      "_blank"
    );

  return (
    <SiteLayout hideNavbar hideBottomBar>
      {/* Desktop */}
      <div className="hidden max-w-7xl mx-auto lg:flex min-h-screen bg-background py-10 lg:py-14">
        <div className="w-[400px] flex-shrink-0">
          <ArtistProfileHeader
            artist={artist}
            disabledDates={disabledDates}
            onBack={handleBack}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onRequestBooking={handleRequestBooking}
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
          />
        </div>
        <div className="flex-1">
          <ArtistDetailTabs artist={artist} />
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden min-h-screen bg-background">
        <ArtistProfileHeader
          artist={artist}
          disabledDates={disabledDates}
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
