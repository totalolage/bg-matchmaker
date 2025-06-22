import type { ComponentProps } from "react"
import * as React from "react"

import { cn } from "@/lib/utils"

import { useFormField } from "./hooks"

export const FormDescription = (props: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => {
  const { className, ref, ...rest } = props
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...rest}
    />
  )
}

export type FormDescriptionProps = ComponentProps<typeof FormDescription>