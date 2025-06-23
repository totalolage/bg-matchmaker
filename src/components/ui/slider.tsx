import * as SliderPrimitive from "@radix-ui/react-slider";
import { ComponentPropsWithoutRef, ElementRef } from "react";

import { cn } from "@/lib/utils";

interface SliderProps
  extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  ref?: React.Ref<ElementRef<typeof SliderPrimitive.Root>>;
}

function Slider({ className, ref, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {props.value?.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
