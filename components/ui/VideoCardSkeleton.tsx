export default function VideoCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Video Thumbnail Skeleton */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800"></div>
      </div>

      {/* Info Skeleton */}
      <div className="mt-3 px-1 flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-800"></div>

        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          {/* Creator */}
          <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}
