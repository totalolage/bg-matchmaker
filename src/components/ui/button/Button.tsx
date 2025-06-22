import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

import { buttonVariants } from "./variants"

export const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & 
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    ref?: React.Ref<HTMLButtonElement>
  }) => {
  const { className, variant, size, asChild = false, ref, ...rest } = props
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...rest}
    />
  )
}

export type ButtonProps = ComponentProps<typeof Button>
