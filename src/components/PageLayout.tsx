import { ReactNode, ComponentProps } from "react";
import { cn } from "../lib/utils";

export const PageLayout = ({ 
  children, 
  className 
}: { 
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("h-full bg-white flex flex-col", className)}>
      {children}
    </div>
  );
};

export const PageHeader = ({ 
  children, 
  className 
}: { 
  children: ReactNode;
  className?: string;
}) => {
  return (
    <header className={cn("bg-white border-b border-gray-200 p-4", className)}>
      {children}
    </header>
  );
};

export const PageContent = ({ 
  children, 
  className, 
  noPadding 
}: { 
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) => {
  return (
    <main className={cn(
      "flex-1 overflow-y-auto",
      !noPadding && "p-4",
      className
    )}>
      {children}
    </main>
  );
};

export type PageLayoutProps = ComponentProps<typeof PageLayout>;
export type PageHeaderProps = ComponentProps<typeof PageHeader>;
export type PageContentProps = ComponentProps<typeof PageContent>;