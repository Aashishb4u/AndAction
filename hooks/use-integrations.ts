"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { videoKeys } from "@/hooks/use-youtube-videos";

interface IntegrationStatus {
  youtube: {
    connected: boolean;
    channelName?: string;
    channelId?: string;
    connectedAt?: string;
  };
  instagram: {
    connected: boolean;
    username?: string;
    connectedAt?: string;
  };
}

export const integrationKeys = {
  all: ["integrations"] as const,
  status: (artistProfileId: string | null | undefined) =>
    [...integrationKeys.all, "status", artistProfileId ?? "primary"] as const,
};

function clearYouTubeVideoCache(
  queryClient: QueryClient,
  artistProfileId: string | null | undefined,
) {
  queryClient.removeQueries({
    queryKey: videoKeys.list("videos", artistProfileId),
    exact: true,
  });
  queryClient.removeQueries({
    queryKey: videoKeys.list("shorts", artistProfileId),
    exact: true,
  });
}

async function fetchIntegrationStatus(
  artistProfileId?: string | null,
): Promise<IntegrationStatus> {
  const url = new URL("/api/artists/integrations/status", window.location.origin);
  if (artistProfileId) url.searchParams.set("artistProfileId", artistProfileId);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch integration status");
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch integration status");
  }
  return data.data;
}

async function getYouTubeAuthUrl(artistProfileId?: string | null): Promise<string> {
  const url = new URL(
    "/api/artists/integrations/youtube/auth-url",
    window.location.origin,
  );
  if (artistProfileId) url.searchParams.set("artistProfileId", artistProfileId);
  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to get authorization URL");
  }
  return data.authUrl;
}

async function disconnectYouTube(artistProfileId?: string | null): Promise<void> {
  const response = await fetch("/api/artists/integrations/youtube/disconnect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artistProfileId: artistProfileId ?? null }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to disconnect YouTube");
  }
}

async function connectYouTubeByChannel(
  input: { channelInput: string; artistProfileId?: string | null },
): Promise<{ channelId: string; channelName: string }> {
  const response = await fetch(
    "/api/artists/integrations/youtube/connect-channel",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to connect YouTube channel");
  }
  return data.data;
}

async function getInstagramAuthUrl(input: {
  returnUrl?: string;
  artistProfileId?: string | null;
}): Promise<string> {
  const url = new URL(
    "/api/artists/integrations/instagram/auth-url",
    window.location.origin
  );
  if (input.returnUrl) {
    url.searchParams.set("returnUrl", input.returnUrl);
  }
  if (input.artistProfileId) {
    url.searchParams.set("artistProfileId", input.artistProfileId);
  }
  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to get authorization URL");
  }
  return data.authUrl;
}

async function disconnectInstagram(artistProfileId?: string | null): Promise<void> {
  const response = await fetch(
    "/api/artists/integrations/instagram/disconnect",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistProfileId: artistProfileId ?? null }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to disconnect Instagram");
  }
}

export function useIntegrationStatus(artistProfileId?: string | null) {
  return useQuery({
    queryKey: integrationKeys.status(artistProfileId),
    queryFn: () => fetchIntegrationStatus(artistProfileId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useYouTubeConnect(artistProfileId?: string | null) {
  return useMutation({
    mutationFn: () => getYouTubeAuthUrl(artistProfileId),
    onSuccess: (authUrl) => {
      // Redirect to YouTube OAuth
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to connect YouTube");
    },
  });
}

export function useYouTubeConnectByChannel(artistProfileId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelInput: string) =>
      connectYouTubeByChannel({ channelInput, artistProfileId }),
    onSuccess: async (data) => {
      // Update the integration status in cache
      queryClient.setQueryData(
        integrationKeys.status(artistProfileId),
        (oldData: IntegrationStatus | undefined) => {
          if (!oldData) {
            return {
              youtube: {
                connected: true,
                channelName: data.channelName,
                channelId: data.channelId,
              },
              instagram: { connected: false },
            };
          }
          return {
            ...oldData,
            youtube: {
              connected: true,
              channelName: data.channelName,
              channelId: data.channelId,
            },
          };
        }
      );
      toast.success(`YouTube channel "${data.channelName}" connected successfully`);

      clearYouTubeVideoCache(queryClient, artistProfileId);
      queryClient.invalidateQueries({
        queryKey: videoKeys.all,
        refetchType: "active",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to connect YouTube channel");
    },
  });
}

export function useYouTubeDisconnect(artistProfileId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disconnectYouTube(artistProfileId),
    onSuccess: () => {
      // Update the integration status in cache
      queryClient.setQueryData(
        integrationKeys.status(artistProfileId),
        (oldData: IntegrationStatus | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            youtube: { connected: false },
          };
        }
      );
      toast.success("YouTube account disconnected successfully");

      clearYouTubeVideoCache(queryClient, artistProfileId);
      queryClient.invalidateQueries({
        queryKey: videoKeys.all,
        refetchType: "active",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disconnect YouTube");
    },
  });
}

export function useInstagramConnect(
  input?: { returnUrl?: string; artistProfileId?: string | null },
) {
  return useMutation({
    mutationFn: () => getInstagramAuthUrl(input ?? {}),
    onSuccess: (authUrl) => {
      // Redirect to Instagram OAuth
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to connect Instagram");
    },
  });
}

export function useInstagramDisconnect(artistProfileId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disconnectInstagram(artistProfileId),
    onSuccess: () => {
      // Update the integration status in cache
      queryClient.setQueryData(
        integrationKeys.status(artistProfileId),
        (oldData: IntegrationStatus | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            instagram: { connected: false },
          };
        }
      );
      toast.success("Instagram account disconnected successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disconnect Instagram");
    },
  });
}
