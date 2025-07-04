import { ComponentProps } from "react";

import { Doc } from "@convex/_generated/dataModel";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
} as const;

export const UserAvatar = ({
  user,
  size = "md",
  className,
}: {
  user?:
    | Doc<"users">
    | { name: string; profilePic?: string; displayName?: string };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
} = {}) => {
  const currentUser = useCurrentUser();
  const userData = user || currentUser;

  const displayName = userData.displayName || userData.name;
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl =
    userData.profilePic ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`;

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export type UserAvatarProps = ComponentProps<typeof UserAvatar>;
