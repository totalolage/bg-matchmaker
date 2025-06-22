import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { getVisibleNavigationItems } from "../lib/navigation";

export function Navigation() {
  const location = useLocation();
  const { data: user } = useQuery(convexQuery(api.auth.loggedInUser, {}));
  
  const isAdmin = user?.role === "Admin";
  const navItems = getVisibleNavigationItems(isAdmin);

  return (
    <nav className="sticky bottom-0 bg-white border-t border-gray-200" style={{ viewTransitionName: 'navigation' }}>
      <div className="flex">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          
          if (isActive) {
            // Render a div instead of Link for the active page
            return (
              <div
                key={to}
                className="flex-1 flex flex-col items-center py-2 px-1 text-purple-600 cursor-default"
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{label}</span>
              </div>
            );
          }
          
          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center py-2 px-1 text-gray-400 hover:text-gray-600"
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
