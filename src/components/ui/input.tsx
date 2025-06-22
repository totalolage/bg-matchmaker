import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export const Input = (props: React.ComponentProps<"input"> & {
  before?: React.ReactNode
  after?: React.ReactNode
  ref?: React.Ref<HTMLInputElement>
}) => {
  const { className, type, before, after, ref, ...rest } = props
  
  if (before || after) {
    return (
      <div className="relative flex items-center">
        {before && (
          <div className="pointer-events-none absolute left-3 flex items-center">
            {before}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            before && "pl-10",
            after && "pr-10",
            className
          )}
          ref={ref}
          {...rest}
        />
        {after && (
          <div className="pointer-events-none absolute right-3 flex items-center">
            {after}
          </div>
        )}
      </div>
    )
  }

  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...rest}
    />
  )
}

export type InputProps = ComponentProps<typeof Input>

