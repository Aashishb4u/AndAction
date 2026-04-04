"use client";

import { useQuery, useQueries } from "@tanstack/react-query";

export interface Artist {
  id: string;
  name: string;
  location: string;
  thumbnail: string;
  videoUrl: string;
  distance?: number | null; // Distance from user in km
}

export type ArtistType =
  | "singer"
  | "dancer"
  | "anchor"
  | "dj"
  | "dj-percussionist"
  | "band"
  | "comedian"
  | "musician"
  | "magician"
  | "actor"
  | "mimicry"
  | "special-act"
  | "spiritual"
  | "kids-entertainer";

interface LocationParams {
  lat: number;
  lng: number;
}

interface FetchArtistsParams {
  type: string;
  location?: LocationParams | null;
  verified?: boolean;
  minResults?: number;
  maxRadius?: number;
  enabled?: boolean;
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

function normalizeArtistTypeRequest(type: string): string {
  const normalized = type.trim().toLowerCase();

  const typeMap: Record<string, string> = {
    band: "live-band",
    spiritual: "spiritual-singer",
  };

  return typeMap[normalized] || normalized;
}

export const artistKeys = {
  all: ["artists"] as const,
  lists: () => [...artistKeys.all, "list"] as const,
  list: (filters: Partial<FetchArtistsParams>) =>
    [...artistKeys.lists(), filters] as const,
  byType: (type: string) => [...artistKeys.all, type] as const,
  byTypeWithLocation: (type: string, location: LocationParams | null) =>
    [
      ...artistKeys.byType(type),
      location ? `${location.lat.toFixed(4)},${location.lng.toFixed(4)}` : null,
    ] as const,
};

const mapArtistData = (artist: any): Artist => ({
  id: artist.id,
  name:
    artist.stageName ||
    `${artist.user.firstName} ${artist.user.lastName}`.trim(),
  location: artist.user.city || "Unknown",
  thumbnail: artist.user.avatar || "/avatars/default.jpg",
  videoUrl: mockVideoUrl,
  distance: artist.distance !== undefined ? artist.distance : null,
});

async function fetchArtistsByType({
  type,
  location,
  verified = false,
  minResults = 10,
  maxRadius = 500,
}: FetchArtistsParams): Promise<{
  artists: Artist[];
  metadata?: SearchMetadata;
}> {
  const typeParam = normalizeArtistTypeRequest(type);

  let url = `/api/artists/nearby?type=${encodeURIComponent(typeParam)}&verified=${verified}&minResults=${minResults}&maxRadius=${maxRadius}`;

  if (location && Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
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
  type: string,
  location: LocationParams | null = null,
  verified: boolean = false,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: artistKeys.byTypeWithLocation(type, location),
    queryFn: () => fetchArtistsByType({ type, location, verified }),
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes - data stays fresh longer
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache longer
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false, // Critical: don't refetch when component remounts
    refetchIntervalInBackground: false,
    retryOnMount: false,
  });
}

// All available artist types
export const ALL_ARTIST_TYPES: ArtistType[] = [
  "singer",
  "dancer",
  "anchor",
  "dj",
  "dj-percussionist",
  "band",
  "comedian",
  "musician",
  "magician",
  "actor",
  "mimicry",
  "special-act",
  "spiritual",
  "kids-entertainer",
];

export function useArtistsByCategoryValues(
  categoryValues: string[],
  location: LocationParams | null = null,
  verified: boolean = false,
  enabled: boolean = true,
) {
  const queries = useQueries({
    queries: categoryValues.map((type) => ({
      queryKey: artistKeys.byTypeWithLocation(type, location),
      queryFn: () => fetchArtistsByType({ type, location, verified }),
      enabled,
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchIntervalInBackground: false,
      retryOnMount: false,
    })),
  });

  const byType = categoryValues.reduce(
    (acc, type, index) => {
      acc[type] = queries[index]?.data?.artists || [];
      return acc;
    },
    {} as Record<string, Artist[]>,
  );

  return {
    byType,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    refetch: () => {
      queries.forEach((query) => {
        query.refetch();
      });
    },
  };
}

export function useAllArtists(
  location: LocationParams | null = null,
  verified: boolean = false,
  enabled: boolean = true,
) {
  const singersQuery = useArtistsByType("singer", location, verified, enabled);
  const dancersQuery = useArtistsByType("dancer", location, verified, enabled);
  const anchorsQuery = useArtistsByType("anchor", location, verified, enabled);
  const djsQuery = useArtistsByType("dj", location, verified, enabled);
  const bandsQuery = useArtistsByType("band", location, verified, enabled);
  const comediansQuery = useArtistsByType("comedian", location, verified, enabled);
  const musiciansQuery = useArtistsByType("musician", location, verified, enabled);
  const magiciansQuery = useArtistsByType("magician", location, verified, enabled);
  const actorsQuery = useArtistsByType("actor", location, verified, enabled);
  const djPercussionistsQuery = useArtistsByType("dj-percussionist", location, verified, enabled);
  const mimicryQuery = useArtistsByType("mimicry", location, verified, enabled);
  const specialActQuery = useArtistsByType("special-act", location, verified, enabled);
  const spiritualQuery = useArtistsByType("spiritual", location, verified, enabled);
  const kidsEntertainerQuery = useArtistsByType(
    "kids-entertainer",
    location,
    verified,
    enabled,
  );

  return {
    singers: singersQuery.data?.artists || [],
    dancers: dancersQuery.data?.artists || [],
    anchors: anchorsQuery.data?.artists || [],
    djs: djsQuery.data?.artists || [],
    bands: bandsQuery.data?.artists || [],
    comedians: comediansQuery.data?.artists || [],
    musicians: musiciansQuery.data?.artists || [],
    magicians: magiciansQuery.data?.artists || [],
    actors: actorsQuery.data?.artists || [],
    djPercussionists: djPercussionistsQuery.data?.artists || [],
    mimicry: mimicryQuery.data?.artists || [],
    specialAct: specialActQuery.data?.artists || [],
    spiritual: spiritualQuery.data?.artists || [],
    kidsEntertainers: kidsEntertainerQuery.data?.artists || [],

    // Metadata for each type
    singersMetadata: singersQuery.data?.metadata,
    dancersMetadata: dancersQuery.data?.metadata,
    anchorsMetadata: anchorsQuery.data?.metadata,
    djsMetadata: djsQuery.data?.metadata,
    bandsMetadata: bandsQuery.data?.metadata,
    comediansMetadata: comediansQuery.data?.metadata,
    musiciansMetadata: musiciansQuery.data?.metadata,
    magiciansMetadata: magiciansQuery.data?.metadata,
    actorsMetadata: actorsQuery.data?.metadata,
    djPercussionistsMetadata: djPercussionistsQuery.data?.metadata,
    mimicryMetadata: mimicryQuery.data?.metadata,
    specialActMetadata: specialActQuery.data?.metadata,
    spiritualMetadata: spiritualQuery.data?.metadata,
    kidsEntertainersMetadata: kidsEntertainerQuery.data?.metadata,

    isLoading:
      singersQuery.isLoading ||
      dancersQuery.isLoading ||
      anchorsQuery.isLoading ||
      djsQuery.isLoading ||
      bandsQuery.isLoading ||
      comediansQuery.isLoading ||
      musiciansQuery.isLoading ||
      magiciansQuery.isLoading ||
      actorsQuery.isLoading ||
      djPercussionistsQuery.isLoading ||
      mimicryQuery.isLoading ||
      specialActQuery.isLoading ||
      spiritualQuery.isLoading ||
      kidsEntertainerQuery.isLoading,
    isError:
      singersQuery.isError ||
      dancersQuery.isError ||
      anchorsQuery.isError ||
      djsQuery.isError ||
      bandsQuery.isError ||
      comediansQuery.isError ||
      musiciansQuery.isError ||
      magiciansQuery.isError ||
      actorsQuery.isError ||
      djPercussionistsQuery.isError ||
      mimicryQuery.isError ||
      specialActQuery.isError ||
      spiritualQuery.isError ||
      kidsEntertainerQuery.isError,
    error:
      singersQuery.error ||
      dancersQuery.error ||
      anchorsQuery.error ||
      djsQuery.error ||
      bandsQuery.error ||
      comediansQuery.error ||
      musiciansQuery.error ||
      magiciansQuery.error ||
      actorsQuery.error ||
      djPercussionistsQuery.error ||
      mimicryQuery.error ||
      specialActQuery.error ||
      spiritualQuery.error ||
      kidsEntertainerQuery.error,
    refetch: () => {
      singersQuery.refetch();
      dancersQuery.refetch();
      anchorsQuery.refetch();
      djsQuery.refetch();
      bandsQuery.refetch();
      comediansQuery.refetch();
      musiciansQuery.refetch();
      magiciansQuery.refetch();
      actorsQuery.refetch();
      djPercussionistsQuery.refetch();
      mimicryQuery.refetch();
      specialActQuery.refetch();
      spiritualQuery.refetch();
      kidsEntertainerQuery.refetch();
    },
  };
}
