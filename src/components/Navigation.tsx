import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Plus, User } from "lucide-react";

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/discover", icon: Search, label: "Discover" },
    { to: "/create", icon: Plus, label: "Create" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="sticky bottom-0 bg-white border-t border-gray-200" style={{ viewTransitionName: 'navigation' }}>
      <div className="flex">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center py-2 px-1 ${
                isActive
                  ? "text-purple-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
