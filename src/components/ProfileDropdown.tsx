import { useRef, ComponentProps } from "react";
import { Link } from "@tanstack/react-router";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ChevronDown, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { UserAvatar } from "./UserAvatar";
import { LogoutDialog, LogoutDialogRef } from "./LogoutDialog";

export const ProfileDropdown = () => {
  const user = useCurrentUser();
  const logoutDialogRef = useRef<LogoutDialogRef>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none">
          <UserAvatar size="sm" />
          <span className="text-sm font-medium text-gray-700">{user.displayName || user.name}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logoutDialogRef.current?.open()}
            className="text-red-600 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutDialog ref={logoutDialogRef} />
    </>
  );
};

export type ProfileDropdownProps = ComponentProps<typeof ProfileDropdown>;