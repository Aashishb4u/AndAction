'use client';

import React, { useState, useEffect } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import VideoCard from '@/components/ui/VideoCard';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";
import { X, Copy, MessageCircle, Facebook, Twitter, Mail, Linkedin } from 'lucide-react';

const VIDEO_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "musician", label: "Musician" },
  { value: "dancer", label: "Dancer" },
  { value: "dj", label: "DJ" },
  { value: "speaker", label: "Speaker" },
  { value: "comedian", label: "Comedian" },
  { value: "actor", label: "Actor" },
];

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; videoId: string; title: string }>({
    isOpen: false,
    videoId: '',
    title: '',
  });

  const { data: session } = useSession();
  const router = useRouter();

  // ---------- FETCH VIDEOS WITH BOOKMARK INFO ----------
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos?type=videos&withBookmarks=true');
        const json = await res.json();

        if (json.success) {
          const mapped = json.data.videos.map((v: any) => ({
            id: v.id,
            title: v.title,
            creator: `${v.user.firstName} ${v.user.lastName}`,
            thumbnail: v.thumbnailUrl,
            videoUrl: v.url,
            category: v.category || 'other',

            // 🔥 bookmark data
            isBookmarked: v.isBookmarked,
            bookmarkId: v.bookmarkId,
          }));

          setVideos(mapped);
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  // Filter videos by category
  const filteredVideos = videos.filter(video => {
    if (selectedCategory === "all") return true;
    return video.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  // ---------- TOGGLE BOOKMARK ----------
  const toggleBookmark = async ({ id, bookmarkId, isBookmarked }: any) => {
    try {
      // REMOVE bookmark

      if (!session?.user) {
        router.push("/auth/signin");
        return;
      }
      if (isBookmarked && bookmarkId) {
        await fetch(`/api/bookmarks/${bookmarkId}`, {
          method: 'DELETE',
        });

        setVideos(prev =>
          prev.map(v =>
            v.id === id
              ? { ...v, isBookmarked: false, bookmarkId: null }
              : v
          )
        );
        return;
      }

      // CREATE bookmark
      const res = await fetch(`/api/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: id }),
      });

      const json = await res.json();
      const newBookmarkId = json?.data?.bookmark?.id;

      setVideos(prev =>
        prev.map(v =>
          v.id === id
            ? { ...v, isBookmarked: true, bookmarkId: newBookmarkId }
            : v
        )
      );
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleShare = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    const shareTitle = video?.title || 'Check out this video';
    setShareModal({ isOpen: true, videoId, title: shareTitle });
  };

  const getShareUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;
    return `${baseUrl}/videos/${shareModal.videoId}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast.success('Link copied to clipboard');
      setShareModal({ isOpen: false, videoId: '', title: '' });
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareModal.title} - ${getShareUrl()}`)}`;
        window.open(url, '_blank');
        setShareModal({ isOpen: false, videoId: '', title: '' });
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank');
        setShareModal({ isOpen: false, videoId: '', title: '' });
      },
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareModal.title)}&url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank');
        setShareModal({ isOpen: false, videoId: '', title: '' });
      },
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank');
        setShareModal({ isOpen: false, videoId: '', title: '' });
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => {
        const url = `mailto:?subject=${encodeURIComponent(shareModal.title)}&body=${encodeURIComponent(`Check out this video: ${getShareUrl()}`)}`;
        window.location.href = url;
        setShareModal({ isOpen: false, videoId: '', title: '' });
      },
    },
  ];


  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-20 lg:pt-24 pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Category Filter Chips */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {VIDEO_CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${selectedCategory === category.value
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-white border-gray-600 hover:border-gray-400"
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-20 text-gray-400">
              Loading videos...
            </div>
          )}

          {/* Videos Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  creator={video.creator}
                  thumbnail={video.thumbnail}
                  videoUrl={video.videoUrl}

                  isBookmarked={video.isBookmarked}
                  bookmarkId={video.bookmarkId}
                  onBookmark={(data) => toggleBookmark(data)}
                  onShare={() => handleShare(video.id)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredVideos.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                {selectedCategory === "all" ? "No videos found." : `No ${selectedCategory} videos found.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShareModal({ isOpen: false, videoId: '', title: '' })}
        >
          <div 
            className="bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Share Video</h3>
              <button
                onClick={() => setShareModal({ isOpen: false, videoId: '', title: '' })}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Video Title */}
            <p className="text-gray-400 text-sm mb-6 line-clamp-2">{shareModal.title}</p>

            {/* Share Options Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl ${option.color} transition-all transform hover:scale-105`}
                >
                  <option.icon className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-medium">{option.name}</span>
                </button>
              ))}
            </div>

            {/* Copy Link Section */}
            <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 bg-transparent text-gray-300 text-sm outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-primary-pink hover:bg-primary-pink/80 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
