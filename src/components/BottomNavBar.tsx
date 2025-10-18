import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavBar = () => {
  const location = useLocation();

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
        className={cn(
          'flex flex-col items-center justify-center gap-1 text-muted-foreground w-full',
          isActive && 'text-primary'
        )}
      >
        <Icon className="h-6 w-6" />
        <span className="text-xs font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-10">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
    </footer>
  );
};

export default BottomNavBar;