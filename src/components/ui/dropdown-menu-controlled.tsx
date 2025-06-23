import {
  PropsWithChildren,
  ReactNode,
  Ref,
  useImperativeHandle,
  useState,
} from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DropdownMenuControlledRef {
  state: "open" | "closed";
  set: (state: "open" | "closed") => void;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

type DropdownMenuControlledProps = PropsWithChildren<{
  ref?: Ref<DropdownMenuControlledRef>;
  trigger: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}>;

export const DropdownMenuControlled = ({
  ref,
  trigger,
  children,
  align = "end",
  side,
  sideOffset = 4,
  className,
}: DropdownMenuControlledProps) => {
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
          }[state]
        ),
      toggle: () => setIsOpen(prev => !prev),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen]
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={className}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
