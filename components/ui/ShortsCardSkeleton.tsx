export default function ShortsCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Shorts Thumbnail Skeleton (portrait aspect ratio) */}
      <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800"></div>
      </div>

      {/* Info Skeleton */}
      <div className="mt-2 space-y-2">
        {/* Title */}
        <div className="h-4 bg-gray-800 rounded w-full"></div>
        {/* Creator */}
        <div className="h-3 bg-gray-800 rounded w-2/3"></div>
      </div>
    </div>
  );
}
