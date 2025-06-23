export function GameSearchSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 p-2 bg-white rounded border animate-pulse"
        >
          {/* Game image skeleton */}
          <div className="w-12 h-12 bg-gray-200 rounded" />

          {/* Game info skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>

          {/* Select button skeleton */}
          <div className="w-32 h-9 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
