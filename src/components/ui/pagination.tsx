import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { type ComponentProps, type Ref } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Pagination = ({ className, ...props }: ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = ({
  className,
  ref,
  ...props
}: ComponentProps<"ul"> & { ref?: Ref<HTMLUListElement> }) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = ({
  className,
  ref,
  ...props
}: ComponentProps<"li"> & { ref?: Ref<HTMLLIElement> }) => (
  <li ref={ref} className={cn("", className)} {...props} />
);
PaginationItem.displayName = "PaginationItem";

type PaginationButtonProps = {
  isActive?: boolean;
} & ButtonProps;

const PaginationButton = ({
  className,
  isActive,
  size = "icon",
  children,
  ...props
}: PaginationButtonProps) => (
  <Button
    aria-current={isActive ? "page" : undefined}
    variant={isActive ? "outline" : "ghost"}
    size={size}
    className={cn(isActive && "border-gray-300 bg-gray-50", className)}
    {...props}
  >
    {children}
  </Button>
);
PaginationButton.displayName = "PaginationButton";

const PaginationPrevious = ({
  className,
  ...props
}: ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    aria-label="Go to previous page"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationButton>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  ...props
}: ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    aria-label="Go to next page"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationButton>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
};
