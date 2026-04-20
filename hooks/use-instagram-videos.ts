"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { syncInstagramReels } from "@/app/actions/instagram/sync-videos";
import {
  deleteInstagramVideo,
  deleteInstagramReel,
} from "@/app/actions/instagram/delete-video";
import { videoKeys } from "@/hooks/use-youtube-videos";

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  duration: number;
  durationFormatted: string | null;
  views: number;
  publishedAt: Date | null;
  isShort: boolean;
  source: string;
  isApproved: boolean;
  createdAt: Date;
}

export const instagramVideoKeys = {
  all: ["instagram-videos"] as const,
  reels: (artistProfileId: string | null | undefined) =>
    [...instagramVideoKeys.all, "reels", artistProfileId ?? "primary"] as const,
};

async function fetchSyncedInstagramReels(
  artistProfileId?: string | null
): Promise<Video[]> {
  const url = new URL("/api/artists/videos", window.location.origin);
  url.searchParams.set("source", "instagram");
  url.searchParams.set("type", "short");
  if (artistProfileId) url.searchParams.set("artistProfileId", artistProfileId);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch Instagram reels");
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch Instagram reels");
  }
  return data.data;
}

export function useSyncedInstagramReels(artistProfileId?: string | null) {
  return useQuery({
    queryKey: instagramVideoKeys.reels(artistProfileId),
    queryFn: () => fetchSyncedInstagramReels(artistProfileId),
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - backend auto-sync handles updates
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache retention
  });
}

export function useSyncInstagramReels(artistProfileId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncInstagramReels(artistProfileId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        // Invalidate all video queries to refetch (both YouTube and Instagram)
        queryClient.invalidateQueries({ queryKey: videoKeys.all });
        queryClient.invalidateQueries({
          queryKey: instagramVideoKeys.reels(artistProfileId),
        });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to sync Instagram reels");
    },
  });
}

export function useDeleteInstagramVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInstagramVideo,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        // Invalidate all video queries
        queryClient.invalidateQueries({ queryKey: videoKeys.all });
        queryClient.invalidateQueries({ queryKey: instagramVideoKeys.all });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete video");
    },
  });
}

export function useDeleteInstagramReel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInstagramReel,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        // Invalidate all video queries
        queryClient.invalidateQueries({ queryKey: videoKeys.all });
        queryClient.invalidateQueries({ queryKey: instagramVideoKeys.all });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete reel");
    },
  });
}
