import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { LogOut, MoreHorizontal, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const MoreMenuDrawer = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNewSimulation = () => {
    navigate('/upload');
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-full">
          <MoreHorizontal className="h-6 w-6" />
          <span className="text-xs font-medium">Mais</span>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Opções</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex flex-col space-y-2">
              <Button variant="outline" className="justify-start gap-3" onClick={handleNewSimulation}>
                <Upload className="h-5 w-5" />
                <span>Nova Simulação</span>
              </Button>
              <Button variant="ghost" className="justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};