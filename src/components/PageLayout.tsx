import { ComponentProps, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export const PageLayout = ({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) => (
  <div className={cn("h-full bg-white flex flex-col", className)}>
    {children}
  </div>
);

export const PageHeader = ({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) => (
  <header
    className={cn(
      "bg-white border-b border-gray-200 p-4 sticky top-0 z-10 safe-top",
      className,
    )}
  >
    {children}
  </header>
);

export const PageContent = ({
  children,
  className,
  noPadding,
}: PropsWithChildren<{
  className?: string;
  noPadding?: boolean;
}>) => (
  <main
    className={cn(
      "flex-1 overflow-y-auto scroll-smooth-mobile overscroll-contain",
      !noPadding && "p-4",
      className,
    )}
  >
    {children}
  </main>
);

export type PageLayoutProps = ComponentProps<typeof PageLayout>;
export type PageHeaderProps = ComponentProps<typeof PageHeader>;
export type PageContentProps = ComponentProps<typeof PageContent>;
