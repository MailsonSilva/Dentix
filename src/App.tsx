import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ResponsiveNav from './components/ResponsiveNav';
import Home from './pages/Home';
import Upload from './pages/Upload';
import SelectProcedure from './pages/SelectProcedure';
import SimulationResult from './pages/SimulationResult';
import Login from './pages/Login';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster"
import { cn } from './lib/utils';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div className="flex min-h-screen bg-muted/40">
                  <ResponsiveNav 
                    isCollapsed={isSidebarCollapsed} 
                    onToggle={() => setSidebarCollapsed(prev => !prev)} 
                  />
                  <main className={cn(
                    "flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300",
                    isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
                  )}>
                    <Routes>
                      <Route path="/home" element={<Home />} />
                      <Route path="/upload" element={<Upload />} />
                      <Route path="/select-procedure" element={<SelectProcedure />} />
                      <Route path="/simulation-result" element={<SimulationResult />} />
                      <Route path="/" element={<Navigate to="/home" />} />
                    </Routes>
                  </main>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;