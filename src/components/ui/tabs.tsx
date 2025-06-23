import * as TabsPrimitive from "@radix-ui/react-tabs";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementRef,
  Ref,
} from "react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

export const TabsList = (
  props: ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    ref?: Ref<ElementRef<typeof TabsPrimitive.List>>;
  },
) => {
  const { className, ref, ...rest } = props;
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...rest}
    />
  );
};
export type TabsListProps = ComponentProps<typeof TabsList>;

export const TabsTrigger = (
  props: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    ref?: Ref<ElementRef<typeof TabsPrimitive.Trigger>>;
  },
) => {
  const { className, ref, ...rest } = props;
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        className,
      )}
      {...rest}
    />
  );
};
export type TabsTriggerProps = ComponentProps<typeof TabsTrigger>;

export const TabsContent = (
  props: ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    ref?: Ref<ElementRef<typeof TabsPrimitive.Content>>;
  },
) => {
  const { className, ref, ...rest } = props;
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...rest}
    />
  );
};
export type TabsContentProps = ComponentProps<typeof TabsContent>;

export { Tabs };
