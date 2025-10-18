import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, User, LogOut, Menu, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ResponsiveNavProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ResponsiveNav = ({ isCollapsed, onToggle }: ResponsiveNavProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/simulations', label: 'Simulações', icon: LayoutGrid },
    { href: '/profile', label: 'Perfil', icon: User },
  ];

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = location.pathname === href;
    return (
      <Link
        to={href}
        title={label}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          isActive && 'bg-muted text-primary',
          isCollapsed && 'justify-center'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className={cn('truncate', isCollapsed && 'hidden')}>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
        <Link to="/home" className="flex items-center gap-2">
          <img src="/logo.png" alt="Dentix Logo" className="h-8 w-auto" />
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Mobile Menu (Overlay) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-background z-20 p-4">
          <div className="flex justify-between items-center mb-8">
            <Link to="/home" className="flex items-center gap-2">
              <img src="/logo.png" alt="Dentix Logo" className="h-8 w-auto" />
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <nav className={cn(
        "hidden md:flex flex-col border-r bg-background p-4 fixed h-full transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("flex items-center mb-8 h-10", isCollapsed ? "justify-center" : "justify-between")}>
          <Link to="/home" className={cn("flex items-center gap-2", isCollapsed ? "hidden" : "flex")}>
            <img src="/logo.png" alt="Dentix Logo" className="h-10 w-auto" />
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle}
            title={isCollapsed ? "Expandir" : "Retrair"}
          >
            {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button 
            variant="ghost" 
            className={cn("w-full justify-start gap-3", isCollapsed && "justify-center")} 
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className={cn(isCollapsed && "hidden")}>Sair</span>
          </Button>
        </div>
      </nav>
    </>
  );
};

export default ResponsiveNav;