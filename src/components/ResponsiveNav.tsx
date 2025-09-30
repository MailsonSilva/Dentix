import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/simulations", label: "Simulações", icon: LayoutGrid },
  { href: "/profile", label: "Perfil", icon: User },
];

const ResponsiveNav = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-muted-foreground w-full h-full transition-colors",
                  isActive ? "text-primary" : "hover:text-foreground"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r bg-background p-4 fixed h-full">
        <div className="mb-8">
          <Link to="/home" className="flex items-center gap-2">
            <img src="/logo.png" alt="Dentix Logo" className="h-10 w-auto" />
          </Link>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className="justify-start"
                asChild
              >
                <Link to={item.href}>
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>
        <div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            Sair
          </Button>
        </div>
      </nav>
    </>
  );
};

export default ResponsiveNav;