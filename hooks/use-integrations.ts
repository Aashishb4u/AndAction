"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

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
  status: () => [...integrationKeys.all, "status"] as const,
};

async function fetchIntegrationStatus(): Promise<IntegrationStatus> {
  const response = await fetch("/api/artists/integrations/status");
  if (!response.ok) {
    throw new Error("Failed to fetch integration status");
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch integration status");
  }
  return data.data;
}

async function getYouTubeAuthUrl(): Promise<string> {
  const response = await fetch("/api/artists/integrations/youtube/auth-url");
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to get authorization URL");
  }
  return data.authUrl;
}

async function disconnectYouTube(): Promise<void> {
  const response = await fetch("/api/artists/integrations/youtube/disconnect", {
    method: "POST",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to disconnect YouTube");
  }
}

export function useIntegrationStatus() {
  return useQuery({
    queryKey: integrationKeys.status(),
    queryFn: fetchIntegrationStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useYouTubeConnect() {
  return useMutation({
    mutationFn: getYouTubeAuthUrl,
    onSuccess: (authUrl) => {
      // Redirect to YouTube OAuth
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to connect YouTube");
    },
  });
}

export function useYouTubeDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectYouTube,
    onSuccess: () => {
      // Update the integration status in cache
      queryClient.setQueryData(
        integrationKeys.status(),
        (oldData: IntegrationStatus | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            youtube: { connected: false },
          };
        }
      );
      toast.success("YouTube account disconnected successfully");

      // Also invalidate video queries since they depend on YouTube connection
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disconnect YouTube");
    },
  });
}
