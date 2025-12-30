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
  reels: () => [...instagramVideoKeys.all, "reels"] as const,
};

async function fetchSyncedInstagramReels(): Promise<Video[]> {
  const response = await fetch(
    "/api/artists/videos?source=instagram&type=short"
  );
  if (!response.ok) {
    throw new Error("Failed to fetch Instagram reels");
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch Instagram reels");
  }
  return data.data;
}

export function useSyncedInstagramReels() {
  return useQuery({
    queryKey: instagramVideoKeys.reels(),
    queryFn: fetchSyncedInstagramReels,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useSyncInstagramReels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncInstagramReels,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        // Invalidate all video queries to refetch (both YouTube and Instagram)
        queryClient.invalidateQueries({ queryKey: videoKeys.all });
        queryClient.invalidateQueries({ queryKey: instagramVideoKeys.reels() });
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
        queryClient.invalidateQueries({
          queryKey: instagramVideoKeys.reels(),
        });
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
        queryClient.invalidateQueries({ queryKey: instagramVideoKeys.reels() });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete reel");
    },
  });
}
