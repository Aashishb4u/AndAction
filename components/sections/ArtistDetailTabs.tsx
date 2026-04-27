"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Artist } from "@/types";
import VideoCard from "@/components/ui/VideoCard";
import ShortsPlayer from "@/components/ui/ShortsPlayer";
import { Loader2 } from "lucide-react";
import { getArtishName } from "@/lib/utils";
import { useArtistCategories } from "@/hooks/use-artist-categories";
import { findCategoryLabel } from "@/lib/artist-category-utils";

interface ArtistDetailTabsProps {
  artist: Artist;
  isMobile?: boolean;
}

type TabType = "about" | "performance" | "videos" | "shorts";

const ArtistDetailTabs: React.FC<ArtistDetailTabsProps> = ({
  artist,
  isMobile = false,
}) => {
  const { categories } = useArtistCategories();
  const resolveArtistTypeLabel = useCallback(
    (rawValue?: string) => findCategoryLabel(categories, rawValue),
    [categories],
  );
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const t = searchParams.get("tab") as TabType | null;
    return t && ["about", "performance", "videos", "shorts"].includes(t)
      ? t
      : "about";
  });
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [showBioMoreButton, setShowBioMoreButton] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  // Paginated video state
  const [artistVideos, setArtistVideos] = useState<any[]>([]);
  const [videosPage, setVideosPage] = useState(1);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isInitialLoadingVideos, setIsInitialLoadingVideos] = useState(true);
  const videosObserverRef = useRef<HTMLDivElement>(null);
  const isFetchingVideosRef = useRef(false);

  // Paginated shorts state
  const [artistShorts, setArtistShorts] = useState<any[]>([]);
  const [shortsPage, setShortsPage] = useState(1);
  const [hasMoreShorts, setHasMoreShorts] = useState(true);
  const [isLoadingShorts, setIsLoadingShorts] = useState(false);
  const [isInitialLoadingShorts, setIsInitialLoadingShorts] = useState(true);
  const shortsObserverRef = useRef<HTMLDivElement>(null);
  const isFetchingShortsRef = useRef(false);

  const VIDEOS_PER_PAGE = 5;
  const SHORTS_PER_PAGE = 5;

  const [shortsCurrentIndex, setShortsCurrentIndex] = useState(0);
  const [shortsSoundEnabled, setShortsSoundEnabled] = useState<boolean>(true);
  const shortsContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);

  const formatExperienceLabel = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const num = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(num) || num <= 0) return null;

    if (num === 1) return "0-1";
    if (num === 2) return "1-3";
    if (num === 3) return "3-5";
    if (num === 4) return "5-10";
    if (num === 5) return "10+";

    if (num > 10) return "10+";
    if (num > 5) return "5-10";
    if (num > 3) return "3-5";
    if (num > 1) return "1-3";
    return "0-1";
  };

  const formatMemberRange = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (raw.includes("-") || raw.includes("+")) return raw;

    const num = Number(raw);
    if (!Number.isFinite(num)) return raw;

    if (num <= 1) return "1";
    if (num <= 5) return "2-5";
    if (num <= 10) return "6-10";
    if (num <= 20) return "11-20";
    return "20+";
  };

  // Keep tab in sync when browser back/forward changes URL
  useEffect(() => {
    const t = searchParams.get("tab") as TabType | null;
    const valid =
      t && ["about", "performance", "videos", "shorts"].includes(t)
        ? t
        : "about";
    setActiveTab(valid);
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const toggleBookmark = async ({ id, bookmarkId, isBookmarked }: any) => {
    try {
      if (isBookmarked && bookmarkId) {
        // DELETE bookmark
        await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });

        setArtistVideos((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, isBookmarked: false, bookmarkId: null } : v,
          ),
        );

        setArtistShorts((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, isBookmarked: false, bookmarkId: null } : s,
          ),
        );

        return;
      }

      // CREATE bookmark
      const res = await fetch(`/api/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id }),
      });

      const json = await res.json();
      const newBookmarkId = json?.data?.bookmark?.id;

      setArtistVideos((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, isBookmarked: true, bookmarkId: newBookmarkId }
            : v,
        ),
      );

      setArtistShorts((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, isBookmarked: true, bookmarkId: newBookmarkId }
            : s,
        ),
      );
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  // Fetch videos page
  const fetchVideosPage = useCallback(
    async (page: number) => {
      if (!artist?.userId) return;
      try {
        isFetchingVideosRef.current = true;
        if (page === 1) setIsInitialLoadingVideos(true);
        setIsLoadingVideos(true);
        const res = await fetch(
          `/api/videos?type=videos&artistId=${artist.userId}&withBookmarks=true&page=${page}&limit=${VIDEOS_PER_PAGE}`,
        );
        const json = await res.json();
        const newVideos = json?.data?.videos || [];
        const pagination = json?.data?.pagination;

        setArtistVideos((prev) =>
          page === 1 ? newVideos : [...prev, ...newVideos],
        );
        setHasMoreVideos(pagination?.hasNextPage ?? false);
      } catch (err) {
        console.error("Videos fetch error:", err);
      } finally {
        setIsLoadingVideos(false);
        setIsInitialLoadingVideos(false);
        isFetchingVideosRef.current = false;
      }
    },
    [artist?.userId],
  );

  // Fetch shorts page
  const fetchShortsPage = useCallback(
    async (page: number) => {
      if (!artist?.userId) return;
      try {
        isFetchingShortsRef.current = true;
        if (page === 1) setIsInitialLoadingShorts(true);
        setIsLoadingShorts(true);
        const res = await fetch(
          `/api/videos?type=shorts&artistId=${artist.userId}&withBookmarks=true&page=${page}&limit=${SHORTS_PER_PAGE}`,
        );
        const json = await res.json();
        const newShorts = json?.data?.videos || [];
        const pagination = json?.data?.pagination;

        setArtistShorts((prev) =>
          page === 1 ? newShorts : [...prev, ...newShorts],
        );
        setHasMoreShorts(pagination?.hasNextPage ?? false);
      } catch (err) {
        console.error("Shorts fetch error:", err);
      } finally {
        setIsLoadingShorts(false);
        setIsInitialLoadingShorts(false);
        isFetchingShortsRef.current = false;
      }
    },
    [artist?.userId],
  );

  // Initial fetch
  useEffect(() => {
    if (!artist?.userId) return;
    setArtistVideos([]);
    setArtistShorts([]);
    setVideosPage(1);
    setShortsPage(1);
    setHasMoreVideos(true);
    setHasMoreShorts(true);
    setShortsCurrentIndex(0);
    fetchVideosPage(1);
    fetchShortsPage(1);
  }, [artist?.userId, fetchVideosPage, fetchShortsPage]);

  // Fetch more videos when page changes (after initial)
  useEffect(() => {
    if (videosPage > 1) fetchVideosPage(videosPage);
  }, [videosPage, fetchVideosPage]);

  // Fetch more shorts when page changes (after initial)
  useEffect(() => {
    if (shortsPage > 1) fetchShortsPage(shortsPage);
  }, [shortsPage, fetchShortsPage]);

  // Infinite scroll observer for videos
  useEffect(() => {
    if (!videosObserverRef.current || !hasMoreVideos || isLoadingVideos) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (isFetchingVideosRef.current) return;
          isFetchingVideosRef.current = true;
          setVideosPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    const el = videosObserverRef.current;
    observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMoreVideos, isLoadingVideos, artistVideos.length]);

  // Infinite scroll observer for shorts
  useEffect(() => {
    if (!shortsObserverRef.current || !hasMoreShorts || isLoadingShorts) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShortsPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    const el = shortsObserverRef.current;
    observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMoreShorts, isLoadingShorts, artistShorts.length]);

  const profileShorts = useMemo(() => {
    return artistShorts.map((s: any) => {
      const artistProfile = s.user?.artists?.[0];
      const creator =
        artistProfile?.stageName ||
        getArtishName(s.user?.name, s.user?.firstName, s.user?.lastName);

      return {
        id: s.id,
        title: s.title || "",
        creator,
        creatorId: artistProfile?.id || artist.id,
        category: resolveArtistTypeLabel(artistProfile?.artistType || ""),
        userId: s.user?.id || "",
        avatar: artistProfile?.profileImage || s.user?.avatar || s.user?.image || "",
        videoUrl: s.url,
        thumbnail: s.thumbnailUrl,
        description: s.description || "",
        isBookmarked: Boolean(s.isBookmarked),
        bookmarkId: s.bookmarkId || null,
      };
    });
  }, [artistShorts, resolveArtistTypeLabel, artist.id]);

  const visibleProfileShorts = useMemo(() => {
    const bufferSize = 2;
    const startIndex = Math.max(0, shortsCurrentIndex - bufferSize);
    const endIndex = Math.min(
      profileShorts.length - 1,
      shortsCurrentIndex + bufferSize,
    );

    return profileShorts.slice(startIndex, endIndex + 1).map((short, idx) => ({
      ...short,
      absoluteIndex: startIndex + idx,
    }));
  }, [profileShorts, shortsCurrentIndex]);

  const loadMoreProfileShorts = useCallback(() => {
    if (
      shortsCurrentIndex >= profileShorts.length - 3 &&
      hasMoreShorts &&
      !isLoadingShorts
    ) {
      if (isFetchingShortsRef.current) return;
      isFetchingShortsRef.current = true;
      setShortsPage((prev) => prev + 1);
    }
  }, [shortsCurrentIndex, profileShorts.length, hasMoreShorts, isLoadingShorts]);

  useEffect(() => {
    loadMoreProfileShorts();
  }, [shortsCurrentIndex, loadMoreProfileShorts]);

  const handleProfileShortsScroll = useCallback(
    (direction: "up" | "down") => {
      const now = Date.now();
      if (now - lastScrollTime.current < 120) return;
      lastScrollTime.current = now;

      setShortsCurrentIndex((prev) => {
        if (direction === "down")
          return Math.min(prev + 1, profileShorts.length - 1);
        return Math.max(prev - 1, 0);
      });
    },
    [profileShorts.length],
  );

  useEffect(() => {
    if (activeTab !== "shorts") return;
    const el = shortsContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 8) return;
      e.preventDefault();
      handleProfileShortsScroll(e.deltaY > 0 ? "down" : "up");
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      touchEndY.current = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      const delta = touchStartY.current - touchEndY.current;
      if (Math.abs(delta) < 40) return;
      handleProfileShortsScroll(delta > 0 ? "down" : "up");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleProfileShortsScroll("down");
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleProfileShortsScroll("up");
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: false } as any);

    return () => {
      el.removeEventListener("wheel", onWheel as any);
      el.removeEventListener("touchstart", onTouchStart as any);
      el.removeEventListener("touchmove", onTouchMove as any);
      el.removeEventListener("touchend", onTouchEnd as any);
      window.removeEventListener("keydown", onKeyDown as any);
    };
  }, [activeTab, handleProfileShortsScroll]);

  const handleProfileShortBookmark = useCallback(
    (id: string) => {
      const found = profileShorts.find((s: any) => s.id === id);
      toggleBookmark({
        id,
        bookmarkId: found?.bookmarkId ?? null,
        isBookmarked: Boolean(found?.isBookmarked),
      });
    },
    [profileShorts, toggleBookmark],
  );

  // Check if bio text overflows (more than 2 lines)
  useEffect(() => {
    const checkBioOverflow = () => {
      if (bioRef.current) {
        const lineHeight =
          parseFloat(getComputedStyle(bioRef.current).lineHeight) || 20;
        const maxHeight = lineHeight * 4; // 4 lines
        setShowBioMoreButton(bioRef.current.scrollHeight > maxHeight + 2);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(checkBioOverflow, 100);
    window.addEventListener("resize", checkBioOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkBioOverflow);
    };
  }, [artist.bio, activeTab]);

  const tabs = [
    { id: "about" as TabType, label: "About" },
    { id: "performance" as TabType, label: "Performance" },
    { id: "videos" as TabType, label: "Videos" },
    { id: "shorts" as TabType, label: "Shorts" },
  ];

  const renderAboutContent = () => (
    <div className="space-y-4 max-w-4xl">
      {artist.bio &&
        artist.bio.trim() !== "" &&
        (() => {
          const sanitizedBio = artist.bio
            .replaceAll("\\r\\n", "\n")
            .replaceAll("\\r", "")
            .replaceAll("\\n", "\n")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "");
          return (
            <div
              className="p-4 md:bg-background bg-card border rounded-xl"
              style={{ borderColor: "#232323" }}
            >
              <h3 className="text-text-gray secondary-text mb-2">Bio</h3>
              <p
                ref={bioRef}
                className={`leading-relaxed secondary-grey-text whitespace-pre-line ${isBioExpanded ? "" : "line-clamp-4"}`}
              >
                {sanitizedBio}
              </p>
              {showBioMoreButton && (
                <button
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  className="text-blue hover:text-primary-pink transition-colors font-medium text-sm mt-1"
                >
                  {isBioExpanded ? "less" : "more..."}
                </button>
              )}
            </div>
          );
        })()}
      {/* Years of experience: show only when a positive number is provided */}
      {(() => {
        const label = formatExperienceLabel((artist as any).yearsOfExperience);
        if (!label) return null;

        return (
          <div
            className="p-4 md:bg-background bg-card border rounded-xl"
            style={{ borderColor: "#232323" }}
          >
            <h3 className="text-text-gray secondary-text mb-2">
              Years of experience
            </h3>
            <p className="secondary-grey-text">
              {label} Years
            </p>
          </div>
        );
      })()}

      {/* Sub-artist types: filter out empty / N/A values */}
      {/* Resolve sub-artist types whether provided as array or CSV string */}
      {(() => {
        const a: any = artist as any;
        const rawSubTypes: string[] = Array.isArray(a.subArtistTypes)
          ? a.subArtistTypes
          : typeof a.subArtistType === "string" && a.subArtistType.trim()
            ? [a.subArtistType]
            : [];

        const artistSubTypes = rawSubTypes
          .flatMap((v: string) =>
            `${v}`
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
          )
          .filter((t: string) => t && t.trim() && t.toLowerCase() !== "n/a");

        if (
          artistSubTypes.length === 0
        )
          return null;

        return (
          <div
            className="p-4 md:bg-background bg-card border rounded-xl"
            style={{ borderColor: "#232323" }}
          >
            <h3 className="text-text-gray secondary-text mb-2">
              Sub-Artist Type
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {artistSubTypes.map((type: string, index: number) => (
                <span
                  key={`${type}-${index}`}
                  className="px-3 py-1.5 text-white rounded-full border border-border-color secondary-text font-medium bg-background"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Achievements: filter out empty / N/A values */}
      {Array.isArray(artist.achievements) &&
        artist.achievements.filter(
          (a: string) => a && a.trim() && a.toLowerCase() !== "n/a",
        ).length > 0 && (
          <div
            className="p-4 md:bg-background bg-card border rounded-xl"
            style={{ borderColor: "#232323" }}
          >
            <h3 className="text-text-gray secondary-text mb-2">
              Achievements / Awards
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {artist.achievements
                .filter(
                  (a: string) => a && a.trim() && a.toLowerCase() !== "n/a",
                )
                .map((achievement: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-white rounded-full border border-border-color secondary-text font-medium bg-background"
                  >
                    {achievement}
                  </span>
                ))}
            </div>
          </div>
        )}
    </div>
  );

  const renderPerformanceContent = () => (
    <div className="space-y-4 max-w-4xl">
      {(() => {
        const hasSoloCharges =
          artist.soloChargesFrom !== undefined &&
          artist.soloChargesFrom !== null &&
          `${artist.soloChargesFrom}`.trim() !== "";
        const hasBacklineCharges =
          artist.chargesWithBacklineFrom !== undefined &&
          artist.chargesWithBacklineFrom !== null &&
          `${artist.chargesWithBacklineFrom}`.trim() !== "";
        const hasPricingSection =
          hasSoloCharges ||
          !!artist.soloChargesDescription?.trim() ||
          hasBacklineCharges ||
          !!artist.chargesWithBacklineDescription?.trim();

        const hasDuration =
          !!artist.performingDurationFrom || !!artist.performingDurationTo;
        const hasMembers = !!artist.performingMembers || !!artist.offStageMembers;
        const hasCorePerformanceSection = hasDuration || hasMembers;

        const languages = artist.languages?.length
          ? artist.languages
              .flatMap((lang: string) =>
                lang.split(",").map((l: string) => l.trim()),
              )
              .filter((l: string) => l)
          : [];

        const eventTypes = artist.performingEventType
          ? artist.performingEventType
              .split(",")
              .map((e: string) => e.trim())
              .filter((e: string) => e)
          : [];

        const states = artist.performingStates
          ? artist.performingStates
              .split(",")
              .map((s: string) => s.trim())
              .filter((s: string) => s)
          : [];
        const hasPanIndia = states.some(
          (s: string) => s.toLowerCase() === "pan india",
        );
        const normalizedStates = hasPanIndia ? ["Pan India"] : states;

        return (
          <>
            {hasPricingSection && (
              <div
                className="md:bg-background bg-card border rounded-lg md:p-6 p-4"
                style={{ borderColor: "#232323" }}
              >
                {(hasSoloCharges || !!artist.soloChargesDescription?.trim()) && (
                  <div className={hasBacklineCharges || !!artist.chargesWithBacklineDescription?.trim() ? "mb-6" : ""}>
                    <h3 className="text-text-gray secondary-text mb-1">Solo Charges</h3>
                    {hasSoloCharges && (
                      <div className="text-white mb-1">
                        Starting from ₹ {artist.soloChargesFrom}
                      </div>
                    )}
                    {artist.soloChargesDescription?.trim() ? (
                      <p className="footnote">{artist.soloChargesDescription.trim()}</p>
                    ) : null}
                  </div>
                )}

                {(hasBacklineCharges || !!artist.chargesWithBacklineDescription?.trim()) && (
                  <div>
                    <h3 className="text-text-gray secondary-text mb-1">Charges with backline</h3>
                    {hasBacklineCharges && (
                      <div className="text-white mb-1">
                        Starting from ₹ {artist.chargesWithBacklineFrom}
                      </div>
                    )}
                    {artist.chargesWithBacklineDescription?.trim() ? (
                      <p className="footnote">{artist.chargesWithBacklineDescription.trim()}</p>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {hasCorePerformanceSection && (
              <div
                className="md:bg-background bg-card border rounded-lg p-4"
                style={{ borderColor: "#232323" }}
              >
                {hasDuration && (
                  <div className="mb-4">
                    <h4 className="text-text-gray secondary-text mb-1">Performing duration</h4>
                    <p className="text-white text-sm">
                      {artist.performingDurationFrom || ""}
                      {artist.performingDurationFrom && artist.performingDurationTo ? " - " : ""}
                      {artist.performingDurationTo || ""}
                      {(artist.performingDurationFrom || artist.performingDurationTo) ? " mins" : ""}
                    </p>
                  </div>
                )}

                {artist.performingMembers && (
                  <div className={artist.offStageMembers ? "mb-4" : ""}>
                    <h4 className="text-text-gray secondary-text mb-1">Performing members</h4>
                    <p className="text-white text-sm">{formatMemberRange(artist.performingMembers)} members</p>
                  </div>
                )}

                {artist.offStageMembers && (
                  <div>
                    <h4 className="text-text-gray secondary-text mb-1">Off stage members</h4>
                    <p className="text-white text-sm">{formatMemberRange(artist.offStageMembers)} members</p>
                  </div>
                )}
              </div>
            )}

            {languages.length > 0 && ( 
              <div
                className="md:bg-background bg-card border rounded-lg md:p-6 p-4"
                style={{ borderColor: "#232323" }}
              >
                <h3 className="text-text-gray secondary-text mb-1">Performing language</h3>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((language: string, index: number) => (
                    <span
                      key={index}
                      className="bg-background px-3 py-1.5 border border-border-color text-white rounded-full secondary-grey-text font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {eventTypes.length > 0 && (
              <div
                className="md:bg-background bg-card border rounded-lg md:p-6 p-4"
                style={{ borderColor: "#232323" }}
              >
                <h3 className="text-text-gray secondary-text mb-1">Performing event type</h3>
                <div className="flex flex-wrap gap-1.5">
                  {eventTypes.map((eventType: string, index: number) => (
                    <span
                      key={index}
                      className="bg-background px-3 py-1.5 border border-border-color text-white rounded-full secondary-grey-text font-medium"
                    >
                      {eventType}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {normalizedStates.length > 0 && (
              <div
                className="md:bg-background bg-card border rounded-lg md:p-6 p-4"
                style={{ borderColor: "#232323" }}
              >
                <h3 className="text-text-gray secondary-text mb-1">Performing States</h3>
                <div className="flex flex-wrap gap-1.5">
                  {normalizedStates.map((state: string, index: number) => (
                    <span
                      key={index}
                      className="bg-background px-3 py-1.5 border border-border-color text-white rounded-full secondary-grey-text font-medium"
                    >
                      {state}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );

  const renderVideosContent = () => {
    if (isInitialLoadingVideos) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="animate-pulse">
              <div className="w-full aspect-video rounded-lg bg-[#2a2a2a]" />
              <div className="mt-3 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
                  <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (artistVideos.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">No Videos</h3>
          <p>This artist hasn&apos;t uploaded any videos yet</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {artistVideos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              creator={
                video.user.name ||
                `${video.user.firstName || ""} ${video.user.lastName || ""}`.trim() ||
                "Unknown Artist"
              }
              creatorImage={
                (video.user as any)?.artists?.[0]?.profileImage ||
                (video.user as any)?.artist?.profileImage ||
                video.user?.avatar ||
                video.user?.image ||
                ""
              }
              thumbnail={video.thumbnailUrl}
              videoUrl={video.url}
              isBookmarked={video.isBookmarked}
              bookmarkId={video.bookmarkId}
              onBookmark={(data) => toggleBookmark(data)}
              onShare={() => {}}
              artistId={(video.user as any)?.artist?.id}
              artistType={resolveArtistTypeLabel(
                (video.user as any)?.artists?.[0]?.artistType ||
                  (video.user as any)?.artist?.artistType,
              )}
              enableMobileAutoplay={true}
            />
          ))}
        </div>
        {/* Infinite scroll sentinel */}
        {hasMoreVideos && (
          <div ref={videosObserverRef} className="flex justify-center py-6">
            {isLoadingVideos && (
              <Loader2 className="w-6 h-6 animate-spin text-primary-pink" />
            )}
          </div>
        )}
        {!hasMoreVideos && artistVideos.length > 0 && (
          <p className="text-center text-gray-500 text-sm py-4">
            No more videos
          </p>
        )}
      </>
    );
  };

  const renderShortsContent = () => {
    if (isInitialLoadingShorts) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary-pink" />
        </div>
      );
    }
    if (artistShorts.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">No Shorts</h3>
          <p>This artist hasn&apos;t uploaded any shorts yet</p>
        </div>
      );
    }

    return (
      <div
        ref={shortsContainerRef}
        className="relative w-full bg-black overflow-hidden rounded-2xl"
        style={{ height: "calc(100vh - 14rem)" }}
      >
        <div
          className="relative h-full"
          style={{
            transform: `translateY(-${shortsCurrentIndex * 100}%)`,
            transition: "transform 0.35s cubic-bezier(0.165, 0.84, 0.44, 1)",
            willChange: "transform",
          }}
        >
          {visibleProfileShorts.map((short: any) => (
            <div
              key={`${short.id}-${short.absoluteIndex}`}
              className="absolute inset-0 w-full h-full"
              style={{ top: `${short.absoluteIndex * 100}%` }}
            >
              <ShortsPlayer
                short={short}
                isActive={short.absoluteIndex === shortsCurrentIndex}
                shouldLoad={short.absoluteIndex === shortsCurrentIndex}
                onBookmark={handleProfileShortBookmark}
                onShare={() => {}}
                soundEnabled={shortsSoundEnabled}
                setSoundEnabled={setShortsSoundEnabled}
              />
            </div>
          ))}
        </div>
        {isLoadingShorts ? (
          <div className="absolute top-4 right-4 z-50">
            <Loader2 className="w-5 h-5 animate-spin text-white/80" />
          </div>
        ) : null}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "about":
        return renderAboutContent();
      case "performance":
        return renderPerformanceContent();
      case "videos":
        return renderVideosContent();
      case "shorts":
        return renderShortsContent();
      default:
        return renderAboutContent();
    }
  };

  if (isMobile) {
    return (
      <div className="bg-background min-h-screen">
        <div
          className="sticky top-0 bg-background border-b z-40"
          style={{ borderColor: "#232323" }}
        >
          <div className="flex bg-card overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-4 px-4 text-base font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-text-gray hover:text-gray-300"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-primary-orange to-primary-pink z-50"
                    style={{ bottom: "-1px" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="md:p-6 p-4 pb-32">{renderContent()}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-card rounded-2xl border"
      style={{ borderColor: "#232323" }}
    >
      <div className="border-b border-border-color">
        <div className="flex px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-6 text-base font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "gradient-text"
                  : "text-text-gray hover:text-gray-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-primary-orange to-primary-pink z-50"
                  style={{ bottom: "-1px" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">{renderContent()}</div>
    </div>
  );
};

export default ArtistDetailTabs;
