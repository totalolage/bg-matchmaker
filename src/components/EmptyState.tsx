import { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

export const EmptyState = ({
  emoji,
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  emoji?: string;
  icon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("text-center py-8", className)}>
      {(emoji || icon) && <div className="text-4xl mb-2">{emoji || icon}</div>}
      <p className="text-gray-500">{title}</p>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export type EmptyStateProps = ComponentProps<typeof EmptyState>;
