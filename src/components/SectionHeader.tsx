import { ReactNode, ComponentProps } from "react";
import { cn } from "../lib/utils";

export const SectionHeader = ({ 
  title, 
  action, 
  className 
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
};

export type SectionHeaderProps = ComponentProps<typeof SectionHeader>;