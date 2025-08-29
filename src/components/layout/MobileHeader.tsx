import { Bell, User, LogIn, ShoppingCart, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { SearchModal } from "@/components/SearchModal";

export function MobileHeader() {
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
      className={`fixed top-0 left-0 right-0 z-50  border-b border-border h-12 flex items-center justify-between px-3  ${
        scrolled
          ? "backdrop-blur-md  dark:bg-neutral-900/70 border-border/50 shadow-sm"
          : "bg-transparent border-transparent"
      }`}
    >
      <Link to="/" className="flex items-center space-x-2">
        <img
          src="/icons/persiraja-logo.png"
          alt="Persiraja"
          className="w-6 h-6"
        />
        <div className="text-sm font-bold text-primary">PERSIRAJA</div>
      </Link>

      <div className="flex items-center space-x-1">
        {/* Mobile Search */}
        <div className="lg:hidden">
          <SearchModal 
            triggerClassName="h-7 w-7 p-0 border-none"
            showShortcut={false}
            iconOnly={true}
          />
        </div>
        
        {user ? (
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              toast.info("Silakan login untuk mengakses keranjang")
            }
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </Button>
        )}
        <NotificationDropdown />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="w-full">
                  <User className="h-3.5 w-3.5 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <LogIn className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
