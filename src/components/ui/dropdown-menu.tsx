import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import type { ComponentProps, ComponentPropsWithoutRef, ElementRef, HTMLAttributes, Ref } from "react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

export const DropdownMenuSubTrigger = (props: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.SubTrigger>>
}) => {
  const { className, inset, children, ref, ...rest } = props
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-8",
        className
      )}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}
export type DropdownMenuSubTriggerProps = ComponentProps<typeof DropdownMenuSubTrigger>

export const DropdownMenuSubContent = (props: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.SubContent>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        className
      )}
      {...rest}
    />
  )
}
export type DropdownMenuSubContentProps = ComponentProps<typeof DropdownMenuSubContent>

export const DropdownMenuContent = (props: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.Content>>
}) => {
  const { className, sideOffset = 4, ref, ...rest } = props
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
          className
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  )
}
export type DropdownMenuContentProps = ComponentProps<typeof DropdownMenuContent>

export const DropdownMenuItem = (props: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.Item>>
}) => {
  const { className, inset, ref, ...rest } = props
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
        inset && "pl-8",
        className
      )}
      {...rest}
    />
  )
}
export type DropdownMenuItemProps = ComponentProps<typeof DropdownMenuItem>

export const DropdownMenuCheckboxItem = (props: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>>
}) => {
  const { className, children, checked, ref, ...rest } = props
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}
export type DropdownMenuCheckboxItemProps = ComponentProps<typeof DropdownMenuCheckboxItem>

export const DropdownMenuRadioItem = (props: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.RadioItem>>
}) => {
  const { className, children, ref, ...rest } = props
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}
export type DropdownMenuRadioItemProps = ComponentProps<typeof DropdownMenuRadioItem>

export const DropdownMenuLabel = (props: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.Label>>
}) => {
  const { className, inset, ref, ...rest } = props
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...rest}
    />
  )
}
export type DropdownMenuLabelProps = ComponentProps<typeof DropdownMenuLabel>

export const DropdownMenuSeparator = (props: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & {
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.Separator>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...rest}
    />
  )
}
export type DropdownMenuSeparatorProps = ComponentProps<typeof DropdownMenuSeparator>

export const DropdownMenuShortcut = ({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
export type DropdownMenuShortcutProps = ComponentProps<typeof DropdownMenuShortcut>

export {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
  DropdownMenuTrigger,
}
