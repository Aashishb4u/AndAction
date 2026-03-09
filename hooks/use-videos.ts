"use client";

import React, { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  createdAt: string;
  isShort: boolean;
  isBookmarked?: boolean;
  bookmarkId?: string | null;
  user: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    image: string | null;
    isArtistVerified: boolean;
    artist: { id: string; artistType: string } | null;
  };
}

interface VideosResponse {
  success: boolean;
  data: {
    videos: Video[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

interface UseVideosOptions {
  type?: "all" | "shorts" | "videos";
  category?: string;
  withBookmarks?: boolean;
  limit?: number;
  random?: boolean;
}

export const videoKeys = {
  all: ["videos"] as const,
  lists: () => [...videoKeys.all, "list"] as const,
  list: (filters: UseVideosOptions) => [...videoKeys.lists(), filters] as const,
};

async function fetchVideos({
  pageParam = 1,
  type = "videos",
  category = "all",
  withBookmarks = true,
  limit = 12,
  random = false,
  seed,
}: {
  pageParam?: number;
  type?: string;
  category?: string;
  withBookmarks?: boolean;
  limit?: number;
  random?: boolean;
  seed?: number;
}): Promise<VideosResponse["data"]> {
  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: limit.toString(),
    withBookmarks: withBookmarks.toString(),
    category: category,
  });

  if (type !== "all") {
    params.set("type", type);
  }

  if (random) {
    params.set("random", "true");
    if (seed !== undefined) {
      params.set("seed", seed.toString());
    }
  }

  const response = await fetch(`/api/videos?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch videos");
  }

  const json: VideosResponse = await response.json();
  return json.data;
}

export function useInfiniteVideos(options: UseVideosOptions = {}) {
  const {
    type = "videos",
    category = "all",
    withBookmarks = true,
    limit = 20,
    random = false,
  } = options;

  const currentKey = `${type}:${category}`;
  const [prevKey, setPrevKey] = useState(currentKey);
  const [seed, setSeed] = useState(() => (random ? Math.random() * 2 - 1 : 0));

  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    setSeed(random ? Math.random() * 2 - 1 : 0);
  }

  return useInfiniteQuery({
    queryKey: videoKeys.list({ type, category, withBookmarks, limit, random, seed: random ? seed : 0 } as any),
    queryFn: ({ pageParam }) =>
      fetchVideos({ pageParam, type, category, withBookmarks, limit, random, seed: random ? seed : undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.hasPrevPage
        ? firstPage.pagination.page - 1
        : undefined;
    },
    staleTime: 0, // always fetch fresh so random order changes on each visit/category switch
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Bookmark mutations
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      bookmarkId,
      isBookmarked,
    }: {
      videoId: string;
      bookmarkId?: string | null;
      isBookmarked: boolean;
    }) => {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to remove bookmark");
        return { action: "removed", videoId };
      } else {
        // Create bookmark
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });
        if (!response.ok) throw new Error("Failed to create bookmark");
        const json = await response.json();
        return {
          action: "created",
          videoId,
          bookmarkId: json?.data?.bookmark?.id,
        };
      }
    },
    onMutate: async ({ videoId, isBookmarked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: videoKeys.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({
        queryKey: videoKeys.lists(),
      });

      // Optimistically update all video lists
      queryClient.setQueriesData(
        { queryKey: videoKeys.lists() },
        (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: page.videos.map((video: Video) =>
                video.id === videoId
                  ? {
                      ...video,
                      isBookmarked: !isBookmarked,
                      bookmarkId: isBookmarked ? null : "temp-id",
                    }
                  : video,
              ),
            })),
          };
        },
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data) => {
      // Update with real bookmark ID
      if (data.action === "created") {
        queryClient.setQueriesData(
          { queryKey: videoKeys.lists() },
          (old: any) => {
            if (!old?.pages) return old;

            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                videos: page.videos.map((video: Video) =>
                  video.id === data.videoId
                    ? { ...video, bookmarkId: data.bookmarkId }
                    : video,
                ),
              })),
            };
          },
        );
      }
    },
  });
}
