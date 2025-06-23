import { Card } from "@/components/ui/card";

export function SessionHistorySkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Game Image Skeleton */}
        <div className="w-16 h-16 rounded-lg bg-gray-200" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-gray-200 rounded" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Interaction Badge Skeleton */}
            <div className="h-6 w-20 rounded-full bg-gray-200" />
          </div>

          {/* Session Details */}
          <div className="space-y-1">
            <div className="h-4 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="h-5 w-16 rounded-full bg-gray-200" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </Card>
  );
}
