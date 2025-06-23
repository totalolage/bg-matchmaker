import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Card = (
  props: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const { className, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        className
      )}
      {...rest}
    />
  );
};
export type CardProps = ComponentProps<typeof Card>;

export const CardHeader = (
  props: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const { className, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...rest}
    />
  );
};
export type CardHeaderProps = ComponentProps<typeof CardHeader>;

export const CardTitle = (
  props: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const { className, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...rest}
    />
  );
};
export type CardTitleProps = ComponentProps<typeof CardTitle>;

export const CardDescription = (
  props: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const { className, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...rest}
    />
  );
};
export type CardDescriptionProps = ComponentProps<typeof CardDescription>;

export const CardContent = (
  props: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const { className, ref, ...rest } = props;
  return <div ref={ref} className={cn("p-6 pt-0", className)} {...rest} />;
};
export type CardContentProps = ComponentProps<typeof CardContent>;

export const CardFooter = (
  props: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const { className, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...rest}
    />
  );
};
export type CardFooterProps = ComponentProps<typeof CardFooter>;
