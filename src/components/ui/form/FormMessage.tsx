import type { ComponentProps } from "react"
import * as React from "react"

import { cn } from "@/lib/utils"

import { useFormField } from "./hooks"

export const FormMessage = (props: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => {
  const { className, children, ref, ...rest } = props
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...rest}
    >
      {body}
    </p>
  )
}

export type FormMessageProps = ComponentProps<typeof FormMessage>