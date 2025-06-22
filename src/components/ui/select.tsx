import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import type { ComponentProps, ComponentPropsWithoutRef, ElementRef,Ref } from "react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

export const SelectTrigger = (props: ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
  ref?: Ref<ElementRef<typeof SelectPrimitive.Trigger>>
}) => {
  const { className, children, ref, ...rest } = props
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...rest}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}
export type SelectTriggerProps = ComponentProps<typeof SelectTrigger>

export const SelectScrollUpButton = (props: ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & {
  ref?: Ref<ElementRef<typeof SelectPrimitive.ScrollUpButton>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...rest}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}
export type SelectScrollUpButtonProps = ComponentProps<typeof SelectScrollUpButton>

export const SelectScrollDownButton = (props: ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> & {
  ref?: Ref<ElementRef<typeof SelectPrimitive.ScrollDownButton>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...rest}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}
export type SelectScrollDownButtonProps = ComponentProps<typeof SelectScrollDownButton>

export const SelectContent = (props: ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
  ref?: Ref<ElementRef<typeof SelectPrimitive.Content>>
}) => {
  const { className, children, position = "popper", ref, ...rest } = props
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...rest}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}
export type SelectContentProps = ComponentProps<typeof SelectContent>

export const SelectLabel = (props: ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & {
  ref?: Ref<ElementRef<typeof SelectPrimitive.Label>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...rest}
    />
  )
}
export type SelectLabelProps = ComponentProps<typeof SelectLabel>

export const SelectItem = (props: ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  ref?: Ref<ElementRef<typeof SelectPrimitive.Item>>
}) => {
  const { className, children, ref, ...rest } = props
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...rest}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
export type SelectItemProps = ComponentProps<typeof SelectItem>

export const SelectSeparator = (props: ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & {
  ref?: Ref<ElementRef<typeof SelectPrimitive.Separator>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...rest}
    />
  )
}
export type SelectSeparatorProps = ComponentProps<typeof SelectSeparator>

export {
  Select,
  SelectGroup,
  SelectValue,
}
