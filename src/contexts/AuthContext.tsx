import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Tipos de perfil (simplificados com as colunas usadas)
interface Profile {
  id: string;
  nome_completo: string | null;
  telefone: string | null;
  email: string | null;
  empresa: string | null;
  cpf_cnpj: string | null;
  logo_url: string | null;
  atualizado_em: string | null;
  ativo: boolean;
}

interface VitaColor {
  id: string;
  nome: string;
  hexadecimal: string;
}

interface Procedure {
  id: string;
  nome: string;
  descricao: string | null;
  webhook_valor: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean; // Indica se a sessão E o perfil foram carregados
  vitaColors: VitaColor[];
  loadingVitaColors: boolean;
  procedures: Procedure[];
  loadingProcedures: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  vitaColors: [],
  loadingVitaColors: true,
  procedures: [],
  loadingProcedures: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento principal
  const [vitaColors, setVitaColors] = useState<VitaColor[]>([]);
  const [loadingVitaColors, setLoadingVitaColors] = useState(true);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(true);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Função para buscar o perfil do usuário
  const fetchProfile = async (userId: string | undefined): Promise<Profile | null> => {
    if (!userId) return null;
    try {
      const { data: profileData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }
      return profileData as Profile | null;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  // Efeito para carregar dados estáticos (cores/procedimentos)
  useEffect(() => {
    const fetchVitaColors = async () => {
      setLoadingVitaColors(true);
      try {
        const { data, error } = await supabase
          .from('cores_vita')
          .select('id, nome, hexadecimal')
          .eq('ativo', true)
          .order('nome');
        if (error) throw error;
        setVitaColors(data || []);
      } catch (error) {
        console.error('Error fetching vita colors in context:', error);
        setVitaColors([]);
      } finally {
        setLoadingVitaColors(false);
      }
    };

    const fetchProcedures = async () => {
      setLoadingProcedures(true);
      try {
        const { data, error } = await supabase
          .from('procedimentos')
          .select('id, nome, descricao, webhook_valor')
          .eq('ativo', true)
          .order('nome');
        if (error) throw error;
        setProcedures(data || []);
      } catch (error) {
        console.error('Error fetching procedures in context:', error);
        setProcedures([]);
      } finally {
        setLoadingProcedures(false);
      }
    };

    fetchVitaColors();
    fetchProcedures();
  }, []);

  // Efeito principal para gerenciar a sessão e o perfil
  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (currentSession: Session | null) => {
      const currentUser = currentSession?.user ?? null;
      
      let profileData: Profile | null = null;

      if (currentUser) {
        // Se houver usuário, carregamos o perfil
        profileData = await fetchProfile(currentUser.id);
      }
      
      if (isMounted) {
        setSession(currentSession);
        setUser(currentUser);
        setProfile(profileData);
        setLoading(false); // Define loading como false APENAS após a sessão e o perfil serem resolvidos
        console.log('Auth state resolved. Loading set to false.');
      }
    };

    // 1. Listener para mudanças de autenticação, incluindo INITIAL_SESSION
    const { data: listenerData } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      
      console.log('Auth State Change Event:', event);
      
      // Se for um evento de mudança de estado (incluindo a inicialização), definimos loading como true
      // para garantir que os componentes esperem a resolução do perfil.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        setLoading(true);
      }
      
      // Usamos try/catch aqui para garantir que setLoading(false) seja chamado
      try {
        await handleAuthChange(newSession);
      } catch (e) {
        console.error('Error during auth state change processing:', e);
        if (isMounted) {
          setLoading(false); // Fallback para garantir que o carregamento termine
        }
      }
    });

    // Cleanup
    return () => {
      isMounted = false;
      try {
        const maybeSub: any = listenerData;
        if (maybeSub?.subscription?.unsubscribe) {
          maybeSub.subscription.unsubscribe();
        } else if (typeof maybeSub?.unsubscribe === 'function') {
          maybeSub.unsubscribe();
        }
      } catch (e) {
        console.warn('Failed to cleanup auth listener:', e);
      }
    };
  }, []);

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    vitaColors,
    loadingVitaColors,
    procedures,
    loadingProcedures,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};