"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ArtistDashboardLayout from "@/components/layout/ArtistDashboardLayout";
import BookingCard from "@/components/ui/BookingCard";
import Button from "@/components/ui/Button";
import { Pencil, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { BookingStatus } from "@prisma/client";
import { useArtistCategories } from "@/hooks/use-artist-categories";
import { findCategoryLabel } from "@/lib/artist-category-utils";
import AdditionalProfileModal from "@/components/artist/profile-setup/AdditionalProfileModal";

/* ----------------------------------------------------
   FORMAT DATE
---------------------------------------------------- */
export function formatDate(input: string | Date) {
  const date = input instanceof Date ? input : new Date(input);

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replace(/(\w+)\s(\d+),\s(\d+)/, "$2, $1, $3");
}

/* ----------------------------------------------------
   TYPES
---------------------------------------------------- */
type Booking = {
  id: string;
  eventDate: string;
  eventType: string;
  totalPrice: string;
  status: BookingStatus;
  createdAt: string;
  eventLocation: string;
  notes: string;

  client: {
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber?: string | null;
  };

  artist: {
    stageName: string;
  };
};

type BookingStatusMap = {
  [key in BookingStatus]: Booking[];
};

type ArtistProfileSummary = {
  id: string;
  profileImage?: string | null;
  stageName: string | null;
  artistType: string | null;
  subArtistType: string | null;
  profileOrder: number;
};

function getArtistProfileProgress(input: {
  user: any | null;
  artistProfile: any | null;
}) {
  const isFilled = (value: any) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number") return !Number.isNaN(value);
    return true;
  };

  const { user, artistProfile } = input;

  const checks = [
    isFilled(user?.firstName) || isFilled(user?.lastName),
    isFilled(user?.email),
    isFilled(user?.phoneNumber),
    isFilled(user?.city),
    isFilled(user?.state),
    isFilled(user?.avatar),

    isFilled(artistProfile?.stageName),
    isFilled(artistProfile?.artistType),
    isFilled(artistProfile?.subArtistType),
    isFilled(artistProfile?.shortBio),
    isFilled(artistProfile?.achievements),
    isFilled(artistProfile?.yearsOfExperience),

    isFilled(artistProfile?.performingLanguage),
    isFilled(artistProfile?.performingEventType),
    isFilled(artistProfile?.performingStates),
    isFilled(artistProfile?.performingDurationFrom),
    isFilled(artistProfile?.performingDurationTo),
    isFilled(artistProfile?.performingMembers),
    isFilled(artistProfile?.offStageMembers),

    isFilled(artistProfile?.contactNumber),
    isFilled(artistProfile?.whatsappNumber),
    isFilled(artistProfile?.contactEmail),

    isFilled(artistProfile?.soloChargesFrom) || isFilled(artistProfile?.soloChargesTo),
    isFilled(artistProfile?.soloChargesDescription),
    isFilled(artistProfile?.chargesWithBacklineFrom) || isFilled(artistProfile?.chargesWithBacklineTo),
    isFilled(artistProfile?.chargesWithBacklineDescription),

    isFilled(artistProfile?.youtubeChannelId),
    isFilled(artistProfile?.instagramId),
  ];

  const total = checks.length;
  const completed = checks.filter(Boolean).length;
  const percentage = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((completed / total) * 100)));

  return { percentage, completed, total };
}

const defaultBookingsState: BookingStatusMap = {
  PENDING: [],
  APPROVED: [],
  DECLINED: [],
  CANCELLED: [],
  COMPLETED: [],
};

export default function ArtistDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { categories } = useArtistCategories();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingStatusMap>(defaultBookingsState);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc' = Newest first
  const [profiles, setProfiles] = useState<ArtistProfileSummary[]>([]);
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [profileDetailsById, setProfileDetailsById] = useState<Record<string, any>>({});
  const profilesForUi: ArtistProfileSummary[] =
    profiles.length > 0
      ? profiles
      : session?.user?.artistProfile
      ? [
          {
            id: session.user.artistProfile.id,
            profileImage: (session.user.artistProfile as any).profileImage ?? null,
            stageName: session.user.artistProfile.stageName ?? null,
            artistType: session.user.artistProfile.artistType ?? null,
            subArtistType: session.user.artistProfile.subArtistType ?? null,
            profileOrder: 0,
          },
        ]
      : [];
  const mobileCarouselRef = useRef<HTMLDivElement | null>(null);
  const desktopCarouselRef = useRef<HTMLDivElement | null>(null);
  const mobileRafRef = useRef<number | null>(null);
  const desktopRafRef = useRef<number | null>(null);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [desktopActiveIndex, setDesktopActiveIndex] = useState(0);
  const totalProfileCards = Math.max(1, profilesForUi.length + 1);
  const activeIndexForProgress = isDesktop ? desktopActiveIndex : mobileActiveIndex;
  const activeProfileId =
    activeIndexForProgress >= 0 && activeIndexForProgress < profilesForUi.length
      ? profilesForUi[activeIndexForProgress]?.id
      : null;

  const clampIndex = (index: number) =>
    Math.max(0, Math.min(totalProfileCards - 1, index));

  const getActiveIndexFromScroll = (el: HTMLDivElement | null) => {
    if (!el) return 0;
    const width = el.clientWidth || 1;
    return clampIndex(Math.round(el.scrollLeft / width));
  };

  const scheduleIndexUpdate = (
    ref: React.MutableRefObject<HTMLDivElement | null>,
    rafRef: React.MutableRefObject<number | null>,
    setIndex: (index: number) => void
  ) => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      setIndex(getActiveIndexFromScroll(ref.current));
    });
  };

  const scrollToProfileCard = (
    ref: React.MutableRefObject<HTMLDivElement | null>,
    index: number
  ) => {
    const el = ref.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    el.scrollTo({ left: width * clampIndex(index), behavior: "smooth" });
  };

  /* ----------------------------------------------------
     FETCH BOOKINGS
  ---------------------------------------------------- */
  const getBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      const json = await response.json();

      const bookingsGrouped: BookingStatusMap = {
        PENDING: [],
        APPROVED: [],
        DECLINED: [],
        CANCELLED: [],
        COMPLETED: [],
      };

      json.data.bookings.forEach((booking: Booking) => {
        bookingsGrouped[booking.status].push(booking);
      });

      setBookings(bookingsGrouped);
    } catch (err) {
      console.error("Unable to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  const getProfiles = async () => {
    try {
      const response = await fetch("/api/artists/profiles");
      const json = await response.json();
      if (json?.success) {
        setProfiles((json?.data?.profiles ?? []) as ArtistProfileSummary[]);
      }
    } catch (err) {
      console.error("Unable to fetch profiles", err);
    }
  };

  const getProfileDetails = async (profileId: string) => {
    try {
      const response = await fetch(`/api/artists/profiles/${profileId}`);
      const json = await response.json();
      if (!response.ok || !json?.success) return;
      const profile = json?.data?.profile;
      if (!profile?.id) return;
      setProfileDetailsById((prev) => ({ ...prev, [profile.id]: profile }));
    } catch (err) {
      console.error("Unable to fetch profile details", err);
    }
  };


  /* ----------------------------------------------------
     UPDATE BOOKING STATUS (LOCAL)
  ---------------------------------------------------- */
  const updateBookingStateLocal = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });

      const json = await res.json();
      if (!json.success) return;

      // Refresh UI instantly
      getBookings();
    } catch (err) {
      console.error("Error updating booking:", err);
    }
  };

  /* ----------------------------------------------------
     AUTH REDIRECTS
  ---------------------------------------------------- */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    else if (status === "authenticated" && session?.user?.role !== "artist")
      router.push("/");
  }, [status, session, router]);

  /* ----------------------------------------------------
     INITIAL LOAD
  ---------------------------------------------------- */
  useEffect(() => {
    getBookings();
    getProfiles();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!activeProfileId) return;
    const sessionArtistId = session?.user?.artistProfile?.id ?? null;
    if (activeProfileId === sessionArtistId) return;
    if (profileDetailsById[activeProfileId]) return;
    getProfileDetails(activeProfileId);
  }, [activeProfileId, profileDetailsById, session?.user?.artistProfile?.id]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading your dashboard...
      </div>
    );
  }

  const artist = session?.user?.artistProfile;
  const fullName = `${session?.user?.firstName ?? ""} ${
    session?.user?.lastName ?? ""
  }`.trim();

  const displayArtistType = (() => {
    const rawType = artist?.artistType?.trim() || "";
    if (!rawType) return "";
    return findCategoryLabel(categories, rawType) || rawType;
  })();

  const totalBookings = Object.values(bookings).flat().length;
  const selectedArtistProfileForProgress = (() => {
    if (!activeProfileId) return null;
    const sessionArtist = session?.user?.artistProfile ?? null;
    if (sessionArtist?.id === activeProfileId) return sessionArtist;
    return profileDetailsById[activeProfileId] ?? null;
  })();

  const profileProgress =
    activeIndexForProgress >= profilesForUi.length
      ? 0
      : getArtistProfileProgress({
          user: session?.user ?? null,
          artistProfile: selectedArtistProfileForProgress,
        }).percentage;

  /* ----------------------------------------------------
     PAGE JSX
  ---------------------------------------------------- */
  return (
    <ArtistDashboardLayout useMainSidebar={true}>
      <div className="w-full bg-[#0F0F0F] md:flex">
        {/* ----------------------------------------------------
             LEFT SIDEBAR
        ---------------------------------------------------- */}
        <div className="px-4 pb-4 pt-2 md:w-80 md:p-5">
          <div className="mb-3 md:hidden">
            <div
              ref={mobileCarouselRef}
              onScroll={() =>
                scheduleIndexUpdate(mobileCarouselRef, mobileRafRef, setMobileActiveIndex)
              }
              className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {profilesForUi.map((profile) => {
                const profileArtistType = (() => {
                  const rawType = profile?.artistType?.trim() || "";
                  if (!rawType) return "";
                  return findCategoryLabel(categories, rawType) || rawType;
                })();

                return (
                  <div key={profile.id} className="w-full shrink-0 snap-start">
                    <div className="rounded-xl border border-border-color bg-card p-3.5 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative h-31 w-22 shrink-0 overflow-hidden rounded-xl border border-[#e6d7c8] sm:h-35 sm:w-25">
                          <Image
                            src={profile?.profileImage || session?.user?.avatar || "/avatars/default.jpg"}
                            alt={profile?.stageName || fullName || "Artist"}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-lg font-semibold leading-tight text-white sm:text-xl">
                            {profile?.stageName || fullName}
                          </h2>
                          <p className="truncate text-sm text-text-gray sm:text-base">
                            {session?.user?.email}
                          </p>
                          <p className="mt-1 truncate text-sm sm:text-base">{profileArtistType}</p>

                          <div className="mt-2 w-full sm:mt-3">
                            <Button
                              onClick={() => router.push(`/artist/profile?profileId=${profile.id}`)}
                              variant="secondary"
                              size="sm"
                              className="w-full min-w-0 rounded-full border-[1.5px] border-border-color px-3 py-2 text-sm"
                            >
                              <Pencil className="mr-2 h-4 w-4 shrink-0 text-primary-orange" />
                              <span className="truncate gradient-text">Edit Profile</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="w-full shrink-0 snap-start">
                <div className="rounded-xl border border-border-color bg-gradient-to-b from-[#1A1A1A] to-[#101010] p-4 text-center sm:p-5">
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">Add New Profile</h2>
                  <p className="mt-1.5 text-sm text-text-gray sm:text-base">
                    Showcase your other talent
                  </p>

                  <div className="mt-4">
                    <Button
                      onClick={() => setIsAddProfileOpen(true)}
                      variant="secondary"
                      size="md"
                      className="w-full rounded-full border-[1.5px] border-border-color bg-card"
                    >
                      <Plus className="mr-2 h-5 w-5 text-primary-orange" />
                      <span className="gradient-text">Add another profile</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
              {Array.from({ length: totalProfileCards }).map((_, i) => {
                const isActive = i === mobileActiveIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToProfileCard(mobileCarouselRef, i)}
                    aria-label={`Go to profile card ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      isActive ? "w-10 bg-white/90" : "w-2 bg-white/25"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Mobile profile progress (50%) */}
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-border-color bg-card p-3.5 md:hidden sm:p-4">
            <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
              <svg className="h-24 w-24 -rotate-90 transform sm:h-28 sm:w-28" viewBox="0 0 36 36">
                <defs>
                  <linearGradient id="progressGradientMobile">
                    <stop offset="0%" stopColor="#E8047E" />
                    <stop offset="100%" stopColor="#ED4B22" />
                  </linearGradient>
                </defs>

                <path
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                  className="text-[#404040]"
                />
                <path
                  stroke="url(#progressGradientMobile)"
                  strokeWidth="3.5"
                  strokeDasharray={`${profileProgress}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-xl font-bold text-white sm:text-2xl">{profileProgress}%</span>
                  <div className="text-[10px] text-text-gray">Completed</div>
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white sm:text-xl">Profile Progress</h3>
              <p className="mt-1 text-sm text-text-gray sm:text-base">Your overall profile progress is showing here.</p>
            </div>
          </div>

          <div className="mb-3 hidden md:block">
            <div
              ref={desktopCarouselRef}
              onScroll={() =>
                scheduleIndexUpdate(desktopCarouselRef, desktopRafRef, setDesktopActiveIndex)
              }
              className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl border border-border-color bg-card [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {profilesForUi.map((profile) => {
                const profileArtistType = (() => {
                  const rawType = profile?.artistType?.trim() || "";
                  if (!rawType) return "";
                  return findCategoryLabel(categories, rawType) || rawType;
                })();

                return (
                  <div key={profile.id} className="w-full shrink-0 snap-start">
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={profile?.profileImage || session?.user?.avatar || "/avatars/default.jpg"}
                        alt={profile?.stageName || fullName || "Artist"}
                        fill
                        unoptimized
                        className="object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h2 className="text-xl font-bold mb-1">
                          {profile?.stageName || fullName}
                          <span className="text-sm font-medium ml-1">
                            ({profileArtistType || "Performer"})
                          </span>
                        </h2>

                        <div className="flex items-center gap-2 mb-3">
                          <Image src="/icons/phone.svg" width={16} height={16} alt="" />
                          <p className="text-xs">
                            +91
                            {session?.user?.phoneNumber || "-"}
                          </p>
                        </div>

                        <Button
                          onClick={() => router.push(`/artist/profile?profileId=${profile.id}`)}
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
                );
              })}

              <div className="w-full shrink-0 snap-start">
                <div className="relative aspect-[4/5] bg-gradient-to-b from-[#1A1A1A] to-[#101010]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
                    <h2 className="text-2xl font-semibold">Add New Profile</h2>
                    <p className="mt-2 text-sm text-text-gray">Showcase your other talent</p>

                    <div className="mt-6 w-full">
                      <Button
                        onClick={() => setIsAddProfileOpen(true)}
                        variant="secondary"
                        size="md"
                        className="w-full rounded-full border-[1.5px] border-border-color bg-card"
                      >
                        <Plus className="mr-2 h-5 w-5 text-primary-orange" />
                        <span className="gradient-text">Add another profile</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
              {Array.from({ length: totalProfileCards }).map((_, i) => {
                const isActive = i === desktopActiveIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToProfileCard(desktopCarouselRef, i)}
                    aria-label={`Go to profile card ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      isActive ? "w-10 bg-white/90" : "w-2 bg-white/25"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Profile Progress Box (original centered for md+) */}
          <div className="hidden md:block bg-card border border-border-color rounded-xl p-4 text-center">
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg
                className="w-28 h-28 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <defs>
                  <linearGradient id="progressGradient">
                    <stop offset="0%" stopColor="#E8047E" />
                    <stop offset="100%" stopColor="#ED4B22" />
                  </linearGradient>
                </defs>

                <path
                  className="text-[#404040]"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                />
                <path
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  strokeDasharray={`${profileProgress}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{profileProgress}%</span>
                <span className="text-[10px] text-text-gray">Completed</span>
              </div>
            </div>

            <h3 className="text-white font-semibold mb-2">
              Profile Progress
            </h3>
            <p className="text-text-gray text-sm">
              Your overall profile progress is showing here.
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------
             RIGHT CONTENT - BOOKINGS
        ---------------------------------------------------- */}
        <div className="flex-1 px-4 pb-4  md:p-5">
          <div className="mb-4 flex items-start justify-between gap-2 sm:items-center">
            <h1 className="text-white h1 leading-tight">Leads / Bookings</h1>
            <button
              className="btn2 flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-border-color bg-[#262626] px-3 py-2 sm:px-4"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              title="Sort by event date"
              aria-label={`Sort by event date, currently ${sortOrder === 'desc' ? 'newest first' : 'oldest first'}`}
            >
              <span className="gradient-text text-sm sm:text-base">
                Sort by
              </span>
              <Image
                src="/icons/up-down.svg"
                width={18}
                height={18}
                alt="Sort"
                className="shrink-0"
                style={{ transform: sortOrder === 'desc' ? 'rotate(0deg)' : 'rotate(180deg)' }}
              />
            </button>
          </div>

          {/* EMPTY STATE */}
          {totalBookings === 0 && (
            <div className="flex flex-col items-center mt-10 text-gray-400">
              <h2 className="text-xl text-white mb-2">No Bookings Yet!</h2>
              <p>Your leads and bookings will appear here.</p>
            </div>
          )}

          {/* SECTIONS */}
          <div className="space-y-10">
            {(
              ["APPROVED", "PENDING", "COMPLETED", "CANCELLED", "DECLINED"] as const
            ).map((status) => {
              let bookingsList = bookings[status];
              if (bookingsList.length === 0) return null;

              // Sort by eventDate
              bookingsList = [...bookingsList].sort((a, b) => {
                const dateA = new Date(a.eventDate).getTime();
                const dateB = new Date(b.eventDate).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
              });

              const sectionTitle =
                status.charAt(0) + status.slice(1).toLowerCase();

              return (
                <section key={status} className="space-y-6">
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">
                    {sectionTitle}
                    <span className="ml-3 text-sm text-gray-400">
                      ({bookingsList.length})
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    {bookingsList.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        status={booking.status}
                        clientName={`${booking.client.firstName} ${booking.client.lastName}`}
                        clientPhone={booking.client?.phoneNumber ?? null}
                        location={booking.eventLocation}
                        date={formatDate(booking.eventDate)}
                        eventType={booking.eventType}
                        description={booking.notes}
                        onReject={() => {
                          if (booking.status === "PENDING") {
                            updateBookingStateLocal(booking.id, "DECLINED");
                          }
                        }}
                        onAccept={() => {
                          if (booking.status === "PENDING") {
                            updateBookingStateLocal(booking.id, "APPROVED");
                          }
                        }}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      <AdditionalProfileModal
        isOpen={isAddProfileOpen}
        onClose={() => setIsAddProfileOpen(false)}
        onCreated={() => {
          getProfiles();
        }}
      />
    </ArtistDashboardLayout>
  );
}
