import type { ComponentProps, HTMLAttributes, Ref } from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";

import { FormItemContext } from "./types";

export const FormItem = (
  props: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }
) => {
  const { className, ref, ...rest } = props;
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...rest} />
    </FormItemContext.Provider>
  );
};

export type FormItemProps = ComponentProps<typeof FormItem>;
