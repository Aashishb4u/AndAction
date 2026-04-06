export default function VideoCardSkeleton() {
  return (
    <div className="relative animate-pulse">
      {/* Video Thumbnail Skeleton */}
      <div
        className="relative w-full aspect-video rounded-lg overflow-hidden"
        style={{ backgroundColor: '#1B1B1B' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom right, #1B1B1B, #222222)' }}
        />

        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Info Skeleton */}
      <div className="mt-3 px-1 flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#7F7F7F' }} />

        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#7F7F7F' }} />
          {/* Creator */}
          <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#7F7F7F' }} />
        </div>
      </div>
    </div>
  );
}
