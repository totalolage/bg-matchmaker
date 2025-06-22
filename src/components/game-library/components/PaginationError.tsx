import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationErrorProps {
  onRetry: () => void;
  message?: string;
}

export function PaginationError({
  onRetry,
  message = "Failed to load results",
}: PaginationErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-gray-700 text-center mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Try Again
      </Button>
    </div>
  );
}