"use client";

import React, { useState, useEffect } from "react";
import { Artist } from "@/types";
import ShortsCard from "@/components/ui/ShortsCard";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Loader2, Youtube, RefreshCw, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  syncYouTubeVideos,
  getSyncedVideos,
} from "@/app/actions/youtube/sync-videos";
import { deleteVideo } from "@/app/actions/youtube/delete-video";

interface ShortsTabProps {
  artist: Artist;
}

interface StoredShort {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  videoUrl: string;
  duration: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  publishedAt: Date | null;
  isShort: boolean;
  isHidden: boolean;
}

const ShortsTab: React.FC<ShortsTabProps> = ({ artist }) => {
  const [shorts, setShorts] = useState<StoredShort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(true);
  const [bookmarkedShorts, setBookmarkedShorts] = useState<Set<string>>(
    new Set()
  );
  const [deletingShorts, setDeletingShorts] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shortToDelete, setShortToDelete] = useState<string | null>(null);
  const router = useRouter();

  const fetchStoredShorts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Pass true to get only shorts
      const result = await getSyncedVideos("shorts");

      if (!result.success) {
        setError(result.message || "Failed to fetch shorts");
        return;
      }

      setIsYouTubeConnected(true);
      // Map the data to our expected format
      const shortsData =
        result.data?.map((v) => ({
          id: v.id,
          youtubeVideoId: v.youtubeVideoId || "",
          title: v.title,
          description: v.description,
          thumbnail: v.thumbnailUrl,
          videoUrl: v.url,
          duration: v.durationFormatted,
          durationSeconds: null,
          viewCount: v.views,
          publishedAt: v.publishedAt,
          isShort: v.isShort,
          isHidden: false,
        })) || [];
      setShorts(shortsData);
    } catch (err) {
      console.error("Error fetching shorts:", err);
      setError("Failed to fetch shorts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoredShorts();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncYouTubeVideos();

      if (result.success) {
        toast.success(
          `Synced ${result.synced} new videos! (${result.skipped} already existed)`
        );
        await fetchStoredShorts();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Error syncing shorts:", err);
      toast.error("Failed to sync shorts. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (shortId: string) => {
    if (deletingShorts.has(shortId)) return;
    setShortToDelete(shortId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!shortToDelete) return;

    setDeletingShorts((prev) => new Set(prev).add(shortToDelete));
    setDeleteDialogOpen(false);

    try {
      const result = await deleteVideo(shortToDelete);

      if (result.success) {
        toast.success("Short removed from your profile");
        setShorts((prev) => prev.filter((s) => s.id !== shortToDelete));
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Error deleting short:", err);
      toast.error("Failed to delete short. Please try again.");
    } finally {
      setDeletingShorts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shortToDelete);
        return newSet;
      });
      setShortToDelete(null);
    }
  };

  const handleBookmark = (shortId: string) => {
    setBookmarkedShorts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(shortId)) {
        newSet.delete(shortId);
      } else {
        newSet.add(shortId);
      }
      return newSet;
    });
  };

  const handleShare = async (shortId: string) => {
    const short = shorts.find((s) => s.id === shortId);
    if (short) {
      try {
        await navigator.share({
          title: short.title,
          url: short.videoUrl,
        });
      } catch {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(short.videoUrl);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const handleConnectYouTube = () => {
    router.push("/artist/profile?tab=integrations");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary-pink animate-spin mb-4" />
        <p className="text-text-gray">Loading shorts...</p>
      </div>
    );
  }

  // YouTube not connected state
  if (!isYouTubeConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
          <Youtube className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Connect Your YouTube
        </h3>
        <p className="text-text-gray mb-6 max-w-md">
          Connect your YouTube account to automatically sync your shorts and
          display them on your profile.
        </p>
        <Button variant="primary" onClick={handleConnectYouTube}>
          <Youtube className="w-4 h-4 mr-2" />
          Connect YouTube
        </Button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-red-400 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchStoredShorts}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4 border border-border-color">
          <Youtube className="w-8 h-8 text-text-gray" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          No Shorts Synced
        </h3>
        <p className="text-text-gray mb-4 max-w-md">
          Click the sync button to import your YouTube Shorts and display them
          on your profile.
        </p>
        <Button variant="primary" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Sync from YouTube
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="md:space-y-6 space-y-4 pb-24 md:pb-0">
      {/* Header with sync and refresh buttons */}
      <div className="flex items-center justify-between">
        <p className="text-text-gray text-sm">
          {shorts.length} short{shorts.length !== 1 ? "s" : ""} synced
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Sync Videos
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchStoredShorts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Shorts Grid - 4 columns for vertical videos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {shorts.map((short) => (
          <ShortsCard
            key={short.id}
            id={short.id}
            title={short.title}
            creator={artist.name}
            thumbnail={short.thumbnail || "/images/video-placeholder.png"}
            videoUrl={short.videoUrl}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onDelete={handleDelete}
            isBookmarked={bookmarkedShorts.has(short.id)}
            showDeleteButton={true}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Short"
        description="Are you sure you want to delete this short? This will only remove it from your profile, not from YouTube."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={shortToDelete ? deletingShorts.has(shortToDelete) : false}
        onConfirm={confirmDelete}
        onCancel={() => setShortToDelete(null)}
      />
    </div>
  );
};

export default ShortsTab;
