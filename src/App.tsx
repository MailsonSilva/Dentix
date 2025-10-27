import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import ResponsiveNav from './components/ResponsiveNav';
import Home from './pages/Home';
import Upload from './pages/Upload';
import SelectProcedure from './pages/SelectProcedure';
import SimulationResult from './pages/SimulationResult';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import Simulations from './pages/Simulations';
import Profile from './pages/Profile';
import Processing from './pages/Processing';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from "@/components/ui/sonner";
import { cn } from './lib/utils';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import BottomNavBar from './components/BottomNavBar';
import ApprovalGate from './components/ApprovalGate';

const ProtectedLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <div className="flex min-h-[100dvh] bg-muted/40">
      <ResponsiveNav 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(prev => !prev)} 
      />
      <main className={cn(
        "flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300 overflow-y-auto pb-20 md:pb-8",
        isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
      )}>
        <ApprovalGate>
          <Outlet />
        </ApprovalGate>
      </main>
      <BottomNavBar />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          
          <Route path="/update-password" element={<UpdatePassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/simulations" element={<Simulations />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/select-procedure" element={<SelectProcedure />} />
              <Route path="/processing" element={<Processing />} />
              <Route path="/simulation-result" element={<SimulationResult />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;