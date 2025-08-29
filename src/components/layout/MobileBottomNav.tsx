import { Home, Newspaper, Ticket, Users, ShoppingBag, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface MobileBottomNavProps {
  currentPath: string;
}

export function MobileBottomNav({ currentPath }: MobileBottomNavProps) {
  const { isAuthenticated } = useAuth();

  const navItems = [{
    icon: Home,
    label: "Home",
    path: "/"
  }, {
    icon: Newspaper,
    label: "News",
    path: "/news"
  }, {
    icon: Ticket,
    label: "Tickets",
    path: "/tickets",
    requiresAuth: true
  }, {
    icon: Users,
    label: "My Club",
    path: "/my-club"
  }, {
    icon: MoreHorizontal,
    label: "More",
    path: "/more"
  }];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex items-center justify-around px-2 z-50 md:hidden">
      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;
        
        // Show login prompt for protected routes when not authenticated
        if (item.requiresAuth && !isAuthenticated) {
          return (
            <Link
              key={item.path}
              to="/login"
              state={{ from: { pathname: item.path } }}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 px-3 py-2 h-14 min-w-0 flex-1 rounded-lg transition-colors",
                "text-muted-foreground hover:text-foreground opacity-60"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[11px] font-medium truncate leading-tight">{item.label}</span>
            </Link>
          );
        }
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 px-3 py-2 h-14 min-w-0 flex-1 rounded-lg transition-colors",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-[11px] font-medium truncate leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}