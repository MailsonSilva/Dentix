import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LayoutGrid, LogOut, Home, User, Menu } from "lucide-react";

const Header = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const userInitial =
    profile?.nome_completo?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    "?";

  const navLinks = (
    <>
      <Button variant="ghost" asChild>
        <Link to="/home" className="flex items-center justify-start gap-2">
          <Home className="h-4 w-4" />
          Home
        </Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link to="/simulations" className="flex items-center justify-start gap-2">
          <LayoutGrid className="h-4 w-4" />
          Minhas Simulações
        </Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link to="/profile" className="flex items-center justify-start gap-2">
          <User className="h-4 w-4" />
          Perfil
        </Link>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/home" className="flex items-center gap-2">
          <img src="/logo.png" alt="Dentix Logo" className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link to="/home">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/simulations">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Minhas Simulações
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={profile?.logo_url || undefined}
                    alt="Logo do usuário"
                  />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.nome_completo || user?.user_metadata?.full_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="w-full flex cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-8">
                <SheetClose asChild>{navLinks}</SheetClose>
                <Button variant="ghost" onClick={handleLogout} className="flex items-center justify-start gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;