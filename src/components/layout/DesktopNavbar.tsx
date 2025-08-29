import { Bell, User, ShoppingCart, LogOut, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { SearchModal } from "@/components/SearchModal";

interface DesktopNavbarProps {
  currentPath: string;
}

const navItems = [
  { label: "Home", path: "/" },
  { label: "News", path: "/news" },
  { label: "Matches", path: "/matches" },
  { label: "Tickets", path: "/tickets" },
  { label: "My Club", path: "/my-club" },
  { label: "Shop", path: "/shop" },
  { label: "About", path: "/about" },
];

export function DesktopNavbar({ currentPath }: DesktopNavbarProps) {
  const { getTotalItems } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil logout");
      window.location.replace("/");
    } catch (error) {
      toast.error("Gagal logout");
    }
  };
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50  border-b border-border h-16 ${
        scrolled
          ? "backdrop-blur-md  dark:bg-neutral-900/70 border-border/50 shadow-sm"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className=" mx-auto flex items-center justify-between h-full px-6">
        <Link to="/" className="flex items-center space-x-3">
          <img
            src="/icons/persiraja-logo.png"
            alt="Persiraja"
            className="w-10 h-10"
          />
          <div className="flex flex-col">
            <div className="text-xl font-bold text-primary">PERSIRAJA</div>
            <span className="text-xs text-secondary font-semibold">
              OFFICIAL TICKETING
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "font-medium transition-colors relative",
                  isActive
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                {item.label}
                {isActive && (
                  <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Global Search */}
          <div className="hidden lg:block">
            <SearchModal />
          </div>
          
          <ThemeToggle />
          <NotificationDropdown />
          {user ? (
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <ShoppingCart className="h-4 w-4" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() =>
                toast.info("Silakan login untuk mengakses keranjang")
              }
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
