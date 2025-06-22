import { ComponentProps,ReactNode } from "react";

import { cn } from "../lib/utils";

export const IconText = ({ 
  icon, 
  text, 
  className, 
  iconClassName 
}: {
  icon: ReactNode;
  text: string | ReactNode;
  className?: string;
  iconClassName?: string;
}) => {
  return (
    <div className={cn("flex items-center text-muted-foreground", className)}>
      <span className={cn("mr-2 text-purple-500", iconClassName)}>
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
};

export type IconTextProps = ComponentProps<typeof IconText>;