"use client";

import { useQuery } from "@tanstack/react-query";

export interface Artist {
  id: string;
  name: string;
  location: string;
  thumbnail: string;
  videoUrl: string;
}

export type ArtistType = "singer" | "dancer" | "anchor" | "dj";

interface LocationParams {
  lat: number;
  lng: number;
}

interface FetchArtistsParams {
  type: ArtistType;
  location?: LocationParams | null;
  verified?: boolean;
}

interface ArtistsApiResponse {
  success: boolean;
  data?: {
    artists: any[];
  };
  message?: string;
}

const mockVideoUrl =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export const artistKeys = {
  all: ["artists"] as const,
  lists: () => [...artistKeys.all, "list"] as const,
  list: (filters: Partial<FetchArtistsParams>) =>
    [...artistKeys.lists(), filters] as const,
  byType: (type: ArtistType) => [...artistKeys.all, type] as const,
  byTypeWithLocation: (type: ArtistType, location: LocationParams | null) =>
    [...artistKeys.byType(type), location] as const,
};

const mapArtistData = (artist: any): Artist => ({
  id: artist.id,
  name: artist.stageName || `${artist.user.firstName} ${artist.user.lastName}`.trim(),
  location: artist.user.city || "Unknown",
  thumbnail: artist.user.avatar || "/icons/images.jpeg",
  videoUrl: mockVideoUrl,
});

async function fetchArtistsByType({
  type,
  location,
  verified = false,
}: FetchArtistsParams): Promise<Artist[]> {
  let url = `/api/artists?type=${type}&verified=${verified}`;

  if (location?.lat && location?.lng) {
    url += `&lat=${location.lat}&lng=${location.lng}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type}s`);
  }

  const json: ArtistsApiResponse = await response.json();
  const apiArtists = json?.data?.artists || [];

  return apiArtists.map(mapArtistData);
}

export function useArtistsByType(
  type: ArtistType,
  location: LocationParams | null = null,
  verified: boolean = false
) {
  return useQuery({
    queryKey: artistKeys.byTypeWithLocation(type, location),
    queryFn: () => fetchArtistsByType({ type, location, verified }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useAllArtists(
  location: LocationParams | null = null,
  verified: boolean = false
) {
  const singersQuery = useArtistsByType("singer", location, verified);
  const dancersQuery = useArtistsByType("dancer", location, verified);
  const anchorsQuery = useArtistsByType("anchor", location, verified);
  const djsQuery = useArtistsByType("dj", location, verified);

  return {
    singers: singersQuery.data || [],
    dancers: dancersQuery.data || [],
    anchors: anchorsQuery.data || [],
    djs: djsQuery.data || [],
    isLoading:
      singersQuery.isLoading ||
      dancersQuery.isLoading ||
      anchorsQuery.isLoading ||
      djsQuery.isLoading,
    isError:
      singersQuery.isError ||
      dancersQuery.isError ||
      anchorsQuery.isError ||
      djsQuery.isError,
    error:
      singersQuery.error ||
      dancersQuery.error ||
      anchorsQuery.error ||
      djsQuery.error,
    refetch: () => {
      singersQuery.refetch();
      dancersQuery.refetch();
      anchorsQuery.refetch();
      djsQuery.refetch();
    },
  };
}
