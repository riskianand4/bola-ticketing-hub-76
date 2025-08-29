import { useState } from "react";
import { 
  Home, 
  Newspaper, 
  Calendar, 
  Ticket, 
  ShoppingBag, 
  Info, 
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TabletSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentPath: string;
}

const mainNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "Matches", path: "/matches" },
  { icon: Ticket, label: "Tickets", path: "/tickets" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: Info, label: "About", path: "/about" },
];

const newsSubItems = [
  { label: "All News", path: "/news" },
  { label: "Liga Domestik", path: "/news/domestic" },
  { label: "Internasional", path: "/news/international" },
];

export function TabletSidebar({ collapsed, onToggle, currentPath }: TabletSidebarProps) {
  const [newsExpanded, setNewsExpanded] = useState(false);

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <img src="/icons/persiraja-logo.png" alt="Persiraja" className="w-8 h-8" />
            {!collapsed && (
              <div className="text-lg font-bold text-primary">PERSIRAJA</div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {mainNavItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}

          {/* News Section with Submenu */}
          <Collapsible open={newsExpanded} onOpenChange={setNewsExpanded}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors",
                  currentPath.startsWith('/news')
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Newspaper className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">News</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={cn("h-4 w-4 transition-transform", newsExpanded && "rotate-180")} />
                )}
              </button>
            </CollapsibleTrigger>
            
            {!collapsed && (
              <CollapsibleContent className="ml-8 mt-1 space-y-1">
                {newsSubItems.map((item) => {
                  const isActive = currentPath === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "block px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            )}
          </Collapsible>
        </nav>
      </div>
    </aside>
  );
}