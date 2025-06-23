import type { ComponentProps, HTMLAttributes, Ref } from "react";

import { cn } from "@/lib/utils";

import { useFormField } from "./hooks";

export const FormDescription = (
  props: HTMLAttributes<HTMLParagraphElement> & {
    ref?: Ref<HTMLParagraphElement>;
  },
) => {
  const { className, ref, ...rest } = props;
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...rest}
    />
  );
};

export type FormDescriptionProps = ComponentProps<typeof FormDescription>;
