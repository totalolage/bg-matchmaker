import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import * as React from "react"
import type { ComponentProps } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

export const AlertDialogOverlay = (props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...rest}
      ref={ref}
    />
  )
}
export type AlertDialogOverlayProps = ComponentProps<typeof AlertDialogOverlay>

export const AlertDialogContent = (props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Content>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...rest}
      />
    </AlertDialogPortal>
  )
}
export type AlertDialogContentProps = ComponentProps<typeof AlertDialogContent>

export const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
export type AlertDialogHeaderProps = ComponentProps<typeof AlertDialogHeader>

export const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
export type AlertDialogFooterProps = ComponentProps<typeof AlertDialogFooter>

export const AlertDialogTitle = (props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Title>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...rest}
    />
  )
}
export type AlertDialogTitleProps = ComponentProps<typeof AlertDialogTitle>

export const AlertDialogDescription = (props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Description>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...rest}
    />
  )
}
export type AlertDialogDescriptionProps = ComponentProps<typeof AlertDialogDescription>

export const AlertDialogAction = (props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Action>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(buttonVariants(), className)}
      {...rest}
    />
  )
}
export type AlertDialogActionProps = ComponentProps<typeof AlertDialogAction>

export const AlertDialogCancel = (props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & {
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )}
      {...rest}
    />
  )
}
export type AlertDialogCancelProps = ComponentProps<typeof AlertDialogCancel>

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
