import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return user && profile?.ativo ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;