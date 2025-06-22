import * as AvatarPrimitive from "@radix-ui/react-avatar"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export const Avatar = (props: React.ComponentPropsWithRef<typeof AvatarPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...rest}
    />
  )
}
export type AvatarProps = ComponentProps<typeof Avatar>

export const AvatarImage = (props: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...rest}
    />
  )
}
export type AvatarImageProps = ComponentProps<typeof AvatarImage>

export const AvatarFallback = (props: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback>>
}) => {
  const { className, ref, ...rest } = props
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...rest}
    />
  )
}
export type AvatarFallbackProps = ComponentProps<typeof AvatarFallback>
