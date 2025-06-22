import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as React from "react"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

export const PopoverContent = (props: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof PopoverPrimitive.Content>>
}) => {
  const { className, align = "center", sideOffset = 4, ref, ...rest } = props
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
          className
        )}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  )
}
export type PopoverContentProps = ComponentProps<typeof PopoverContent>

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
