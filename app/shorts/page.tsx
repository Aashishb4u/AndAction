"use client";

import { VIDEO_CATEGORIES } from "@/lib/constants";

const fetchShortsPage = async ({ pageParam = 1, queryKey }: any) => {
  const [_key, { category }] = queryKey;
  const url = category && category !== 'all'
    ? `/api/videos?type=shorts&page=${pageParam}&category=${category}`
    : `/api/videos?type=shorts&page=${pageParam}`;
  
  const res = await fetch(url);
  const json = await res.json();

  return json.data.videos.map((v: any) => ({
    id: v.id,
    title: v.title,
    creator: `${v.user.firstName} ${v.user.lastName}`,
    creatorId: v.user.artist?.id,
    avatar: v.user.avatar || v.user.image,
    videoUrl: v.url,
    thumbnail: v.thumbnailUrl,
    description: "",
    isBookmarked: false,
  }));
};
import { useState, useEffect, useRef, useCallback } from "react";
import SiteLayout from "@/components/layout/SiteLayout";
import ShortsPlayer from "@/components/ui/ShortsPlayer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Copy,
  MessageCircle,
  Facebook,
  Twitter,
  Mail,
  Linkedin,
} from "lucide-react";
import { toast } from "react-toastify";

export default function ShortsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const queryClient = useQueryClient();
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    shortId: string;
    title: string;
  }>({
    isOpen: false,
    shortId: "",
    title: "",
  });

  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["shorts", { category: selectedCategory }],
      queryFn: fetchShortsPage,
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage && lastPage.length > 0
          ? allPages.length + 1
          : undefined;
      },
      refetchOnWindowFocus: false,
    });

  const shorts = data?.pages.flat() || [];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("shorts_sound");
      if (saved === "on") setSoundEnabled(true);
    }
  }, []);

  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);

  // Load more videos when approaching the end
  const loadMoreVideos = useCallback(() => {
    if (
      currentIndex >= shorts.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    currentIndex,
    shorts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  const handleScroll = useCallback(
    (direction: "up" | "down", velocity: number = 1) => {
      const now = Date.now();
      const debounceTime = velocity > 2 ? 50 : 100;

      if (now - lastScrollTime.current < debounceTime) {
        return;
      }

      lastScrollTime.current = now;

      setCurrentIndex((prevIndex) => {
        const newIndex =
          direction === "down"
            ? Math.min(prevIndex + 1, shorts.length - 1)
            : Math.max(prevIndex - 1, 0);

        if (newIndex === prevIndex) return prevIndex;

        if (newIndex >= shorts.length - 2) loadMoreVideos();

        return newIndex;
      });
    },
    [shorts.length, loadMoreVideos],
  );

  // Wheel (desktop)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      const deltaY = e.deltaY;
      const timeDelta = Math.max(now - lastScrollTime.current, 16);
      velocityRef.current = Math.min(Math.abs(deltaY) / timeDelta, 10);

      if (Math.abs(deltaY) > 3) {
        const direction = deltaY > 0 ? "down" : "up";
        handleScroll(direction, velocityRef.current);
      }
    },
    [handleScroll],
  );

  // Touch events (mobile)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.stopPropagation();
    touchStartY.current = e.touches[0].clientY;
    lastTouchTime.current = Date.now();
    velocityRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    const now = Date.now();
    const timeDelta = now - lastTouchTime.current;

    if (timeDelta > 0) velocityRef.current = Math.abs(deltaY) / timeDelta;

    lastTouchTime.current = now;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.stopPropagation();
      touchEndY.current = e.changedTouches[0].clientY;
      const deltaY = touchStartY.current - touchEndY.current;
      const now = Date.now();
      const duration = now - lastTouchTime.current;
      const finalVelocity = Math.abs(deltaY) / Math.max(duration, 50);

      const threshold = finalVelocity > 0.5 ? 25 : 40;

      if (Math.abs(deltaY) > threshold) {
        const direction = deltaY > 0 ? "down" : "up";
        handleScroll(direction, finalVelocity);
      }
    },
    [handleScroll],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        handleScroll("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleScroll("up");
      }
    },
    [handleScroll],
  );

  useEffect(() => {
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeyDown);

    const mobile = mobileContainerRef.current;
    const desktop = desktopContainerRef.current;

    if (mobile) {
      mobile.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      mobile.addEventListener("touchmove", handleTouchMove, { passive: false });
      mobile.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    if (desktop) {
      desktop.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      desktop.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      desktop.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);

      if (mobile) {
        mobile.removeEventListener("touchstart", handleTouchStart);
        mobile.removeEventListener("touchmove", handleTouchMove);
        mobile.removeEventListener("touchend", handleTouchEnd);
      }

      if (desktop) {
        desktop.removeEventListener("touchstart", handleTouchStart);
        desktop.removeEventListener("touchmove", handleTouchMove);
        desktop.removeEventListener("touchend", handleTouchEnd);
      }

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  ]);

  const getVisibleVideos = useCallback(() => {
    const bufferSize = 2;
    const startIndex = Math.max(0, currentIndex - bufferSize);
    const endIndex = Math.min(shorts.length - 1, currentIndex + bufferSize);

    return shorts.slice(startIndex, endIndex + 1).map((short, idx) => ({
      ...short,
      absoluteIndex: startIndex + idx,
    }));
  }, [currentIndex, shorts]);

  // Bookmark handler: persist to backend and update state
  const handleBookmark = async (id: string) => {
    // Check if user is logged in
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    const short = shorts.find((s) => s.id === id);
    if (!short) return;

    const previousData = queryClient.getQueryData(["shorts"]);

    // Optimistic update helper
    const updateBookmarkState = (isBookmarked: boolean) => {
      queryClient.setQueryData(["shorts"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any[]) =>
            page.map((video) =>
              video.id === id ? { ...video, isBookmarked } : video,
            ),
          ),
        };
      });
    };

    try {
      if (short.isBookmarked) {
        // Optimistic update: Remove bookmark
        updateBookmarkState(false);
        await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      } else {
        // Optimistic update: Add bookmark
        updateBookmarkState(true);
        await fetch(`/api/bookmarks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: id }),
        });
      }
    } catch (err) {
      console.error("Bookmark error:", err);
      // Revert to previous data on error
      if (previousData) {
        queryClient.setQueryData(["shorts"], previousData);
      }
    }
  };

  // Share handler: open share modal
  const handleShare = async (id: string) => {
    const short = shorts.find((s) => s.id === id);
    const shareTitle = short?.title || "Check out this short";
    setShareModal({ isOpen: true, shortId: id, title: shareTitle });
  };

  const getShareUrl = () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;
    return `${baseUrl}/shorts/${shareModal.shortId}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast.success("Link copied to clipboard");
      setShareModal({ isOpen: false, shortId: "", title: "" });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareModal.title} - ${getShareUrl()}`)}`;
        window.open(url, "_blank");
        setShareModal({ isOpen: false, shortId: "", title: "" });
      },
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
        window.open(url, "_blank");
        setShareModal({ isOpen: false, shortId: "", title: "" });
      },
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareModal.title)}&url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, "_blank");
        setShareModal({ isOpen: false, shortId: "", title: "" });
      },
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, "_blank");
        setShareModal({ isOpen: false, shortId: "", title: "" });
      },
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-600 hover:bg-gray-700",
      action: () => {
        const url = `mailto:?subject=${encodeURIComponent(shareModal.title)}&body=${encodeURIComponent(`Check out this short: ${getShareUrl()}`)}`;
        window.location.href = url;
        setShareModal({ isOpen: false, shortId: "", title: "" });
      },
    },
  ];

  const visibleVideos = getVisibleVideos();

  return (
    <SiteLayout showPreloader={false} hideNavbarOnMobile={true}>
      {/* Category Filter Header */}
      <div
        className="fixed top-0 md:static md:mt-16 left-0 right-0 z-50 flex gap-2 overflow-x-auto scrollbar-hide bg-background-light backdrop-blur-sm p-4 border-y border-border-line"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {VIDEO_CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => {
              setSelectedCategory(category.value);
              setCurrentIndex(0);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
              selectedCategory === category.value
                ? "bg-white border-white"
                : "bg-transparent text-white border-[#2D2D2D] hover:border-gray-400"
            }`}
          >
            <span
              className={
                selectedCategory === category.value
                  ? "text-transparent bg-clip-text bg-linear-to-r from-[#ED4B22] to-[#E8047E]"
                  : ""
              }
            >
              {category.label}
            </span>
          </button>
        ))}
      </div>

      {/* MOBILE */}
      <div className="md:hidden">
        <div
          ref={mobileContainerRef}
          className="fixed left-0 right-0 bg-black overflow-hidden shorts-scrollbar-hide"
          style={{
            top: 0,
            bottom: "4rem", // Leave space for bottom bar
            zIndex: 0,
            paddingTop: "4.5rem", // Add top padding for category header
          }}
        >
          <div
            className="relative h-full"
            style={{
              transform: `translateY(-${currentIndex * 100}%)`,
              transition: "transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
              willChange: "transform",
              height: "100%", // Ensure container takes full height of parent
            }}
          >
            {visibleVideos.map((video) => (
              <div
                key={`${video.id}-${video.absoluteIndex}`}
                className="absolute inset-0 w-full h-full"
                style={{ top: `${video.absoluteIndex * 100}%` }}
              >
                <ShortsPlayer
                  short={video}
                  isActive={video.absoluteIndex === currentIndex && !isDesktop}
                  shouldLoad={!isDesktop}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                  soundEnabled={soundEnabled}
                  setSoundEnabled={setSoundEnabled}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Add bottom navigation bar for mobile */}
        <div className="fixed bottom-0 left-0 w-full z-10">
          {/* Import and use your MobileBottomBar component here */}
          {/* If you use <MobileBottomBar /> elsewhere, import it at the top */}
          {/* <MobileBottomBar /> */}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block pt-4 min-h-screen bg-black">
        <div className="max-w-md mx-auto">
          <div
            ref={desktopContainerRef}
            className="relative bg-black overflow-hidden shorts-scrollbar-hide"
            style={{ height: "calc(100vh - 6rem)", zIndex: 0 }}
          >
            <div
              className="relative h-full pt-16 pb-16" // Add top and bottom padding to prevent overlap
              style={{
                transform: `translateY(-${currentIndex * 100}%)`,
                transition: "transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
                willChange: "transform",
              }}
            >
              {visibleVideos.map((video) => (
                <div
                  key={`${video.id}-${video.absoluteIndex}`}
                  className="absolute inset-0 w-full h-full"
                  style={{ top: `${video.absoluteIndex * 100}%` }}
                >
                  <ShortsPlayer
                    short={video}
                    isActive={video.absoluteIndex === currentIndex && isDesktop}
                    shouldLoad={isDesktop}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    soundEnabled={soundEnabled}
                    setSoundEnabled={setSoundEnabled}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() =>
            setShareModal({ isOpen: false, shortId: "", title: "" })
          }
        >
          <div
            className="bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Share Short</h3>
              <button
                onClick={() =>
                  setShareModal({ isOpen: false, shortId: "", title: "" })
                }
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Video Title */}
            <p className="text-gray-400 text-sm mb-6 line-clamp-2">
              {shareModal.title}
            </p>

            {/* Share Options Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl ${option.color} transition-all transform hover:scale-105`}
                >
                  <option.icon className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-medium">
                    {option.name}
                  </span>
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
