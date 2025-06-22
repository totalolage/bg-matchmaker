import * as LabelPrimitive from "@radix-ui/react-label"
import type { ComponentProps } from "react"
import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { useFormField } from "./hooks"

export const FormLabel = (props: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { ref?: React.Ref<React.ElementRef<typeof LabelPrimitive.Root>> }) => {
  const { className, ref, ...rest } = props
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...rest}
    />
  )
}

export type FormLabelProps = ComponentProps<typeof FormLabel>