"use client";

import { useQuery } from "@tanstack/react-query";

export interface Artist {
  id: string;
  name: string;
  location: string;
  thumbnail: string;
  videoUrl: string;
  distance?: number | null; // Distance from user in km
}

export type ArtistType = "singer" | "dancer" | "anchor" | "dj" | "band" | "comedian";

interface LocationParams {
  lat: number;
  lng: number;
}

interface FetchArtistsParams {
  type: ArtistType;
  location?: LocationParams | null;
  verified?: boolean;
  minResults?: number;
  maxRadius?: number;
}

interface SearchMetadata {
  strategy: "nearby" | "expanded" | "nationwide";
  radiusUsed: number;
  totalFound: number;
  nearbyCount: number;
  expandedCount: number;
  nationwideCount: number;
  message: string;
  userLocation: {
    lat: number;
    lng: number;
  } | null;
}

interface ArtistsApiResponse {
  success: boolean;
  data?: {
    artists: any[];
    metadata?: SearchMetadata;
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
  thumbnail: artist.user.avatar || "/avatars/placeholder.png",
  videoUrl: mockVideoUrl,
  distance: artist.distance !== undefined ? artist.distance : null,
});

async function fetchArtistsByType({
  type,
  location,
  verified = false,
  minResults = 10,
  maxRadius = 500,
}: FetchArtistsParams): Promise<{ artists: Artist[]; metadata?: SearchMetadata }> {
  let url = `/api/artists/nearby?type=${type}&verified=${verified}&minResults=${minResults}&maxRadius=${maxRadius}`;

  if (location?.lat && location?.lng) {
    url += `&lat=${location.lat}&lng=${location.lng}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${type}s`);
  }

  const json: ArtistsApiResponse = await response.json();

  return {
    artists: (json?.data?.artists || []).map(mapArtistData),
    metadata: json?.data?.metadata,
  };
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
  const bandsQuery = useArtistsByType("band", location, verified);
  const comediansQuery = useArtistsByType("comedian", location, verified);

  return {
    singers: singersQuery.data?.artists || [],
    dancers: dancersQuery.data?.artists || [],
    anchors: anchorsQuery.data?.artists || [],
    djs: djsQuery.data?.artists || [],
    bands: bandsQuery.data?.artists || [],
    comedians: comediansQuery.data?.artists || [],
    
    // Metadata for each type
    singersMetadata: singersQuery.data?.metadata,
    dancersMetadata: dancersQuery.data?.metadata,
    anchorsMetadata: anchorsQuery.data?.metadata,
    djsMetadata: djsQuery.data?.metadata,
    bandsMetadata: bandsQuery.data?.metadata,
    comediansMetadata: comediansQuery.data?.metadata,
    
    isLoading:
      singersQuery.isLoading ||
      dancersQuery.isLoading ||
      anchorsQuery.isLoading ||
      djsQuery.isLoading ||
      bandsQuery.isLoading ||
      comediansQuery.isLoading,
    isError:
      singersQuery.isError ||
      dancersQuery.isError ||
      anchorsQuery.isError ||
      djsQuery.isError ||
      bandsQuery.isError ||
      comediansQuery.isError,
    error:
      singersQuery.error ||
      dancersQuery.error ||
      anchorsQuery.error ||
      djsQuery.error ||
      bandsQuery.error ||
      comediansQuery.error,
    refetch: () => {
      singersQuery.refetch();
      dancersQuery.refetch();
      anchorsQuery.refetch();
      djsQuery.refetch();
      bandsQuery.refetch();
      comediansQuery.refetch();
    },
  };
}
