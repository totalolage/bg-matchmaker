import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Progress = (
  props: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    ref?: React.Ref<React.ElementRef<typeof ProgressPrimitive.Root>>;
  }
) => {
  const { className, value, ref, ...rest } = props;
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...rest}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
};

export type ProgressProps = ComponentProps<typeof Progress>;
