import type { ComponentProps } from "react"
import * as React from "react"

import { cn } from "@/lib/utils"

import { FormItemContext } from "./types"

export const FormItem = (props: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => {
  const { className, ref, ...rest } = props
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...rest} />
    </FormItemContext.Provider>
  )
}

export type FormItemProps = ComponentProps<typeof FormItem>