import { Slot } from "@radix-ui/react-slot"
import type { ComponentProps } from "react"
import * as React from "react"

import { useFormField } from "./hooks"

export const FormControl = (props: React.ComponentPropsWithoutRef<typeof Slot> & { ref?: React.Ref<React.ElementRef<typeof Slot>> }) => {
  const { ref, ...rest } = props
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...rest}
    />
  )
}

export type FormControlProps = ComponentProps<typeof FormControl>