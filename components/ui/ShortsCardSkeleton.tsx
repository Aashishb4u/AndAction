export default function ShortsCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Shorts Thumbnail Skeleton (portrait aspect ratio) */}
      <div
        className="relative w-full aspect-[9/16] rounded-xl overflow-hidden"
        style={{ backgroundColor: '#1B1B1B' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom right, #1B1B1B, #222222)' }}
        />

        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Info Skeleton */}
      <div className="mt-2 space-y-2">
        {/* Title */}
        <div className="h-4 rounded w-full" style={{ backgroundColor: '#7F7F7F' }} />
        {/* Creator */}
        <div className="h-3 rounded w-2/3" style={{ backgroundColor: '#7F7F7F' }} />
      </div>
    </div>
  );
}
