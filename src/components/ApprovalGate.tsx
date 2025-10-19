import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const ApprovalGate = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return null; // A rota protegida já exibe um loader de página inteira.
  }

  // Exibe o diálogo se o perfil não existir ou estiver inativo.
  if (!profile || !profile.ativo) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acesso Pendente</AlertDialogTitle>
            <AlertDialogDescription>
              Sua conta foi criada e está aguardando aprovação. Para agilizar a liberação do seu acesso, entre em contato conosco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between items-center gap-2">
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">Sair</Button>
            <AlertDialogAction asChild className="w-full sm:w-auto">
              <a href="https://wa.me/5598933005102?text=Quero%20meu%20acesso%20de%207%20dias." target="_blank" rel="noopener noreferrer">
                Liberar Acesso
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return <>{children}</>;
};

export default ApprovalGate;