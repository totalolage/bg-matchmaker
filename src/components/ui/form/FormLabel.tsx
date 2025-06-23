import * as LabelPrimitive from "@radix-ui/react-label";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementRef,
  Ref,
} from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useFormField } from "./hooks";

export const FormLabel = (
  props: ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    ref?: Ref<ElementRef<typeof LabelPrimitive.Root>>;
  },
) => {
  const { className, ref, ...rest } = props;
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...rest}
    />
  );
};

export type FormLabelProps = ComponentProps<typeof FormLabel>;
