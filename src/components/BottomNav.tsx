import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/simulations", label: "Simulações", icon: LayoutGrid },
  { href: "/profile", label: "Perfil", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
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
  );
};

export default BottomNav;