"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  syncYouTubeVideos,
  getSyncedVideos,
} from "@/app/actions/youtube/sync-videos";
import { deleteVideo } from "@/app/actions/youtube/delete-video";

export const videoKeys = {
  all: ["videos"] as const,
  lists: () => [...videoKeys.all, "list"] as const,
  list: (type: "videos" | "shorts") => [...videoKeys.lists(), type] as const,
};

export function useSyncedVideos(type: "videos" | "shorts") {
  return useQuery({
    queryKey: videoKeys.list(type),
    queryFn: async () => {
      const result = await getSyncedVideos(type);
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch videos");
      }
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
}

export function useSyncYouTubeVideos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncYouTubeVideos,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          `Synced ${result.synced} new videos! (${result.skipped} already existed)`
        );
        // Invalidate both videos and shorts queries to refetch
        queryClient.invalidateQueries({ queryKey: videoKeys.all });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      console.error("Error syncing videos:", error);
      toast.error("Failed to sync videos. Please try again.");
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVideo,
    onSuccess: (result, videoId) => {
      if (result.success) {
        toast.success("Video removed from your profile");
        // Optimistically remove the video from cache
        queryClient.setQueriesData(
          { queryKey: videoKeys.lists() },
          (oldData: any[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.filter((v) => v.id !== videoId);
          }
        );
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video. Please try again.");
    },
  });
}
