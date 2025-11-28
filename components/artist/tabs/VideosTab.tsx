"use client";

import React, { useState, useEffect } from "react";
import { Artist } from "@/types";
import VideoCard from "@/components/ui/VideoCard";
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

interface VideosTabProps {
  artist: Artist;
}

interface StoredVideo {
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

const VideosTab: React.FC<VideosTabProps> = ({ artist }) => {
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(true);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(
    new Set()
  );
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const router = useRouter();

  const fetchStoredVideos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSyncedVideos("videos");

      if (!result.success) {
        setError(result.message || "Failed to fetch videos");
        return;
      }

      setIsYouTubeConnected(true);
      const videosData =
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
      setVideos(videosData);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to fetch videos. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoredVideos();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncYouTubeVideos();

      if (result.success) {
        toast.success(
          `Synced ${result.synced} new videos! (${result.skipped} already existed)`
        );
        await fetchStoredVideos();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Error syncing videos:", err);
      toast.error("Failed to sync videos. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (deletingVideos.has(videoId)) return;
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    setDeletingVideos((prev) => new Set(prev).add(videoToDelete));
    setDeleteDialogOpen(false);

    try {
      const result = await deleteVideo(videoToDelete);

      if (result.success) {
        toast.success("Video removed from your profile");
        setVideos((prev) => prev.filter((v) => v.id !== videoToDelete));
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Error deleting video:", err);
      toast.error("Failed to delete video. Please try again.");
    } finally {
      setDeletingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoToDelete);
        return newSet;
      });
      setVideoToDelete(null);
    }
  };

  const handleBookmark = (videoId: string) => {
    setBookmarkedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleShare = async (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (video) {
      try {
        await navigator.share({
          title: video.title,
          url: video.videoUrl,
        });
      } catch {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(video.videoUrl);
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
        <p className="text-text-gray">Loading videos...</p>
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
          Connect your YouTube account to automatically sync your videos and
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
        <Button variant="outline" onClick={fetchStoredVideos}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4 border border-border-color">
          <Youtube className="w-8 h-8 text-text-gray" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          No Videos Synced
        </h3>
        <p className="text-text-gray mb-4 max-w-md">
          Click the sync button to import your YouTube videos and display them
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
    <div className="space-y-6">
      {/* Header with sync and refresh buttons */}
      <div className="flex items-center justify-between">
        <p className="text-text-gray text-sm">
          {videos.length} video{videos.length !== 1 ? "s" : ""} synced
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
          <Button variant="ghost" size="sm" onClick={fetchStoredVideos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            id={video.id}
            title={video.title}
            creator={artist.name}
            thumbnail={video.thumbnail || "/images/video-placeholder.png"}
            videoUrl={video.videoUrl}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onDelete={handleDelete}
            isBookmarked={bookmarkedVideos.has(video.id)}
            showDeleteButton={true}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Video"
        description="Are you sure you want to delete this video? This will only remove it from your profile, not from YouTube."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={videoToDelete ? deletingVideos.has(videoToDelete) : false}
        onConfirm={confirmDelete}
        onCancel={() => setVideoToDelete(null)}
      />
    </div>
  );
};

export default VideosTab;
