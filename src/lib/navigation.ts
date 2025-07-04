import { Home, LucideIcon, Plus, Search, Shield, User } from "lucide-react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  requiresAdmin?: boolean;
}

export const navigationItems: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/discover", icon: Search, label: "Discover" },
  { to: "/sessions/create", icon: Plus, label: "Create" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/admin", icon: Shield, label: "Admin", requiresAdmin: true },
];

// Get the ordered paths for router transitions
export const getNavigationOrder = (): string[] =>
  navigationItems.map(item => item.to);

// Get navigation items filtered by user role
export const getVisibleNavigationItems = (isAdmin: boolean): NavItem[] =>
  navigationItems.filter(item => !item.requiresAdmin || isAdmin);
