"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ArtistDashboardLayout from "@/components/layout/ArtistDashboardLayout";
import BookingCard from "@/components/ui/BookingCard";
import Button from "@/components/ui/Button";
import { Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { BookingStatus } from "@prisma/client";

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

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] =
    useState<BookingStatusMap>(defaultBookingsState);

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
  }, []);

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

  const totalBookings = Object.values(bookings).flat().length;

  /* ----------------------------------------------------
     PAGE JSX
  ---------------------------------------------------- */
  return (
    <ArtistDashboardLayout>
      <div className="md:flex w-full">
        {/* ----------------------------------------------------
             LEFT SIDEBAR
        ---------------------------------------------------- */}
        <div className="md:w-80 p-5">
          <div className="relative rounded-2xl overflow-hidden mb-3 bg-card border border-border-color">
            <div className="relative aspect-[4/5]">
              <Image
                src={session?.user?.avatar || "/icons/images.jpeg"}
                alt={artist?.stageName || fullName || "Artist"}
                fill
                unoptimized
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-xl font-bold mb-1">
                  {artist?.stageName || fullName}
                  <span className="text-sm font-medium ml-1">
                    ({artist?.artistType || "Performer"})
                  </span>
                </h2>

                <div className="flex items-center gap-2 mb-3">
                  <Image src="/icons/phone.svg" width={16} height={16} alt="" />
                  <p className="text-xs">
                    +91
                    {artist?.contactNumber ||
                      session?.user?.phoneNumber ||
                      "-"}
                  </p>
                </div>

                <Button
                  onClick={() => router.push("/artist/profile")}
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

          {/* Profile Progress Box (unchanged) */}
          <div className="bg-card border border-border-color rounded-xl p-4 text-center">
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
                  strokeDasharray="80, 100"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">80%</span>
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
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white h1">Leads / Bookings</h1>

            <button className="flex items-center gap-1 bg-[#262626] py-2 px-4 border-[1.5px] border-border-color rounded-full btn2">
              <span className="gradient-text">Sort by</span>
              <Image src="/icons/up-down.svg" width={18} height={18} alt="" />
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
              const bookingsList = bookings[status];
              if (bookingsList.length === 0) return null;

              const sectionTitle =
                status.charAt(0) + status.slice(1).toLowerCase();

              return (
                <section key={status} className="space-y-6">
                  <h2 className="text-2xl font-semibold text-white">
                    {sectionTitle}
                    <span className="ml-3 text-sm text-gray-400">
                      ({bookingsList.length})
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {bookingsList.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        status={booking.status}
                        clientName={`${booking.client.firstName} ${booking.client.lastName}`}
                        clientEmail={booking.client.email}
                        clientPhone={booking.client.phoneNumber}
                        location={booking.eventLocation}
                        date={formatDate(booking.eventDate)}
                        eventType={booking.eventType}
                        description={booking.notes}
                        onReject={() =>
                          status === "PENDING"
                            ? updateBookingStateLocal(booking.id, "DECLINED")
                            : null
                        }
                        onAccept={() =>
                          status === "PENDING"
                            ? updateBookingStateLocal(booking.id, "APPROVED")
                            : null
                        }
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </ArtistDashboardLayout>
  );
}
