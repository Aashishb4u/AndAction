"use client";

import { getArtishName } from "@/lib/utils";
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
  | "live-band"
  | "spiritual"
  | "singer"
  | "anchor"
  | "dj"
  | "dj-based-band"
  | "dj-percussionist"
  | "musician"
  | "dancer"
  | "magician"
  | "comedian-mimicry"
  | "special-act"
  | "motivational-speaker"
  | "kids-entertainer"
  | "folk-artist"
  | "model";

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
  name: getArtishName(artist.user.name, artist.user.firstName, artist.user.lastName),
  location: artist.user.city || "Unknown",
  thumbnail: artist.profileImage || artist.user.avatar || "/avatars/default.jpg",
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
  "live-band",
  "spiritual",
  "singer",
  "anchor",
  "dj",
  "dj-based-band",
  "dj-percussionist",
  "musician",
  "dancer",
  "magician",
  "comedian-mimicry",
  "special-act",
  "motivational-speaker",
  "kids-entertainer",
  "folk-artist",
  "model",
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
  const liveBandsQuery = useArtistsByType("live-band", location, verified, enabled);
  const devotionalSpiritualSingersQuery = useArtistsByType("spiritual", location, verified, enabled);
  const singersQuery = useArtistsByType("singer", location, verified, enabled);
  const anchorEmceeHostsQuery = useArtistsByType("anchor", location, verified, enabled);
  const djVjsQuery = useArtistsByType("dj", location, verified, enabled);
  const djBasedBandsQuery = useArtistsByType("dj-based-band", location, verified, enabled);
  const djPercussionistsQuery = useArtistsByType("dj-percussionist", location, verified, enabled);
  const musiciansInstrumentalistsQuery = useArtistsByType("musician", location, verified, enabled);
  const dancersDanceGroupsQuery = useArtistsByType("dancer", location, verified, enabled);
  const magicialIllusionistsQuery = useArtistsByType("magician", location, verified, enabled);
  const comedianMimicryQuery = useArtistsByType("comedian-mimicry", location, verified, enabled);
  const specialActPerformersQuery = useArtistsByType("special-act", location, verified, enabled);
  const motivationalSpeakersQuery = useArtistsByType("motivational-speaker", location, verified, enabled);
  const kidsEntertainerQuery = useArtistsByType(
    "kids-entertainer",
    location,
    verified,
    enabled,
  );
  const folkArtistsQuery = useArtistsByType("folk-artist", location, verified, enabled);
  const modelsQuery = useArtistsByType("model", location, verified, enabled);

  return {
    liveBands: liveBandsQuery.data?.artists || [],
    devotionalSpiritualSingers: devotionalSpiritualSingersQuery.data?.artists || [],
    singers: singersQuery.data?.artists || [],
    anchorEmceeHosts: anchorEmceeHostsQuery.data?.artists || [],
    djVjs: djVjsQuery.data?.artists || [],
    djBasedBands: djBasedBandsQuery.data?.artists || [],
    djPercussionists: djPercussionistsQuery.data?.artists || [],
    musiciansInstrumentalists: musiciansInstrumentalistsQuery.data?.artists || [],
    dancersDanceGroups: dancersDanceGroupsQuery.data?.artists || [],
    magicialIllusionists: magicialIllusionistsQuery.data?.artists || [],
    comedianMimicry: comedianMimicryQuery.data?.artists || [],
    specialActPerformers: specialActPerformersQuery.data?.artists || [],
    motivationalSpeakers: motivationalSpeakersQuery.data?.artists || [],
    kidsEntertainers: kidsEntertainerQuery.data?.artists || [],
    folkArtists: folkArtistsQuery.data?.artists || [],
    models: modelsQuery.data?.artists || [],

    // Metadata for each type
    liveBandsMetadata: liveBandsQuery.data?.metadata,
    devotionalSpiritualSingersMetadata: devotionalSpiritualSingersQuery.data?.metadata,
    singersMetadata: singersQuery.data?.metadata,
    anchorEmceeHostsMetadata: anchorEmceeHostsQuery.data?.metadata,
    djVjsMetadata: djVjsQuery.data?.metadata,
    djBasedBandsMetadata: djBasedBandsQuery.data?.metadata,
    djPercussionistsMetadata: djPercussionistsQuery.data?.metadata,
    musiciansInstrumentalistsMetadata: musiciansInstrumentalistsQuery.data?.metadata,
    dancersDanceGroupsMetadata: dancersDanceGroupsQuery.data?.metadata,
    magicialIllusionistsMetadata: magicialIllusionistsQuery.data?.metadata,
    comedianMimicryMetadata: comedianMimicryQuery.data?.metadata,
    specialActPerformersMetadata: specialActPerformersQuery.data?.metadata,
    motivationalSpeakersMetadata: motivationalSpeakersQuery.data?.metadata,
    kidsEntertainersMetadata: kidsEntertainerQuery.data?.metadata,
    folkArtistsMetadata: folkArtistsQuery.data?.metadata,
    modelsMetadata: modelsQuery.data?.metadata,

    isLoading:
      liveBandsQuery.isLoading ||
      devotionalSpiritualSingersQuery.isLoading ||
      singersQuery.isLoading ||
      anchorEmceeHostsQuery.isLoading ||
      djVjsQuery.isLoading ||
      djBasedBandsQuery.isLoading ||
      djPercussionistsQuery.isLoading ||
      musiciansInstrumentalistsQuery.isLoading ||
      dancersDanceGroupsQuery.isLoading ||
      magicialIllusionistsQuery.isLoading ||
      comedianMimicryQuery.isLoading ||
      specialActPerformersQuery.isLoading ||
      motivationalSpeakersQuery.isLoading ||
      kidsEntertainerQuery.isLoading ||
      folkArtistsQuery.isLoading ||
      modelsQuery.isLoading,
    isError:
      liveBandsQuery.isError ||
      devotionalSpiritualSingersQuery.isError ||
      singersQuery.isError ||
      anchorEmceeHostsQuery.isError ||
      djVjsQuery.isError ||
      djBasedBandsQuery.isError ||
      djPercussionistsQuery.isError ||
      musiciansInstrumentalistsQuery.isError ||
      dancersDanceGroupsQuery.isError ||
      magicialIllusionistsQuery.isError ||
      comedianMimicryQuery.isError ||
      specialActPerformersQuery.isError ||
      motivationalSpeakersQuery.isError ||
      kidsEntertainerQuery.isError ||
      folkArtistsQuery.isError ||
      modelsQuery.isError,
    error:
      liveBandsQuery.error ||
      devotionalSpiritualSingersQuery.error ||
      singersQuery.error ||
      anchorEmceeHostsQuery.error ||
      djVjsQuery.error ||
      djBasedBandsQuery.error ||
      djPercussionistsQuery.error ||
      musiciansInstrumentalistsQuery.error ||
      dancersDanceGroupsQuery.error ||
      magicialIllusionistsQuery.error ||
      comedianMimicryQuery.error ||
      specialActPerformersQuery.error ||
      motivationalSpeakersQuery.error ||
      kidsEntertainerQuery.error ||
      folkArtistsQuery.error ||
      modelsQuery.error,
    refetch: () => {
      liveBandsQuery.refetch();
      devotionalSpiritualSingersQuery.refetch();
      singersQuery.refetch();
      anchorEmceeHostsQuery.refetch();
      djVjsQuery.refetch();
      djBasedBandsQuery.refetch();
      djPercussionistsQuery.refetch();
      musiciansInstrumentalistsQuery.refetch();
      dancersDanceGroupsQuery.refetch();
      magicialIllusionistsQuery.refetch();
      comedianMimicryQuery.refetch();
      specialActPerformersQuery.refetch();
      motivationalSpeakersQuery.refetch();
      kidsEntertainerQuery.refetch();
      folkArtistsQuery.refetch();
      modelsQuery.refetch();
    },
  };
}
