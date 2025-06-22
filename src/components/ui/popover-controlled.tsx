import { ReactNode, Ref,useImperativeHandle, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface PopoverControlledRef {
  state: "open" | "closed";
  set: (state: "open" | "closed") => void;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

interface PopoverControlledProps {
  ref?: Ref<PopoverControlledRef>;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}

export const PopoverControlled = ({
  ref,
  trigger,
  children,
  align = "center",
  side,
  sideOffset,
  className,
}: PopoverControlledProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      state: isOpen ? "open" : ("closed" as "open" | "closed"),
      set: (state: "open" | "closed") =>
        setIsOpen(
          {
            open: true,
            closed: false,
          }[state],
        ),
      toggle: () => setIsOpen((prev) => !prev),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={className}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};