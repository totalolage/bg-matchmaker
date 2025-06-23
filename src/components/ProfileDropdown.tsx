import { Link } from "@tanstack/react-router";
import { Calendar, ChevronDown, LogOut, User } from "lucide-react";
import { ComponentProps, useRef } from "react";

import { useCurrentUser } from "../hooks/useCurrentUser";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogoutDialog, LogoutDialogRef } from "./LogoutDialog";
import { UserAvatar } from "./UserAvatar";

export const ProfileDropdown = () => {
  const user = useCurrentUser();
  const logoutDialogRef = useRef<LogoutDialogRef>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none">
          <UserAvatar size="sm" />
          <span className="text-sm font-medium text-gray-700">
            {user.displayName || user.name}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/proposals" className="flex items-center cursor-pointer">
              <Calendar className="mr-2 h-4 w-4" />
              <span>My Proposals</span>
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
