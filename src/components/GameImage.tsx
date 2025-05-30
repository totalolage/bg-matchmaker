import { ComponentProps } from "react";
import { cn } from "../lib/utils";

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  full: "w-full",
} as const;

export const GameImage = ({ 
  src, 
  alt, 
  size = "md", 
  className 
}: {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
}) => {
  if (!src) {
    return (
      <div 
        className={cn(
          "bg-gray-200 rounded-lg flex items-center justify-center",
          sizeClasses[size],
          className
        )}
      >
        <span className="text-gray-400 text-2xl">🎲</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "rounded-lg object-cover",
        sizeClasses[size],
        className
      )}
    />
  );
};

export type GameImageProps = ComponentProps<typeof GameImage>;