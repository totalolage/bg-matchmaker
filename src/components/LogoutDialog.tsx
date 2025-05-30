import { forwardRef, useImperativeHandle, useState, ComponentProps } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export interface LogoutDialogRef {
  state: "open" | "closed";
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const LogoutDialog = forwardRef<LogoutDialogRef>((_, ref) => {
  const { signOut } = useAuthActions();
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    state: isOpen ? "open" : "closed" as "open" | "closed",
    toggle: () => setIsOpen(prev => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }), [isOpen]);

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to log out?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You will be redirected to the sign in page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void handleLogout()}>
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

LogoutDialog.displayName = "LogoutDialog";

export type LogoutDialogProps = ComponentProps<typeof LogoutDialog>;