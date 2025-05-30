import { useImperativeHandle, useState, ReactNode, Ref } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export interface AlertDialogControlledRef {
  state: "open" | "closed";
  set: (state: "open" | "closed") => void;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

interface AlertDialogControlledProps {
  ref?: Ref<AlertDialogControlledRef>;
  title: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  onAction?: () => void | Promise<void>;
  variant?: "default" | "destructive";
  children?: ReactNode;
}

export const AlertDialogControlled = ({
  ref,
  title,
  description,
  actionLabel = "Continue",
  cancelLabel = "Cancel",
  onAction,
  variant = "default",
  children,
}: AlertDialogControlledProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      state: isOpen ? "open" : ("closed" as "open" | "closed"),
      set: (state: "open" | "closed") =>
        setIsOpen(
          {
            open: true,
            closed: false,
          }[state],
        ),
      toggle: () => setIsOpen((prev) => !prev),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen],
  );

  const handleAction = async () => {
    if (onAction) {
      await onAction();
    }
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children && <div className="py-4">{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleAction()}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};