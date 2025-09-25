import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Login = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate('/home');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <img src="/logo.png" alt="Dentix Logo" className="w-40 mx-auto" />
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
            view="sign_in"
            showLinks={false} // Vamos controlar os links manualmente
            passwordToggle={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Seu e-mail',
                  password_label: 'Sua senha',
                  button_label: 'Entrar',
                  email_input_placeholder: 'seu@email.com',
                },
                forgotten_password: {
                    email_label: 'Seu e-mail',
                    button_label: 'Enviar instruções',
                    link_text: 'Esqueceu sua senha?',
                }
              },
            }}
          />
           <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <a href="/signup" className="underline">
              Cadastre-se
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;