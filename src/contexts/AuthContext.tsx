import { createContext, useContext, useEffect, useState, useRef } from 'react';
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

  // Mantém o último user id para evitar refetchs redundantes
  const prevUserIdRef = useRef<string | null>(null);

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

  // Função auxiliar para unificar atualização de estado de auth/profile
  const handleAuthState = async (currentSession: Session | null) => {
    const currentUser = currentSession?.user ?? null;
    let profileData: Profile | null = null;

    if (currentUser) {
      profileData = await fetchProfile(currentUser.id);
    }

    setSession(currentSession);
    setUser(currentUser);
    setProfile(profileData);
    setLoading(false);
  };

  // Efeito principal para inicializar sessão + listener (evitando loops por eventos redundantes)
  useEffect(() => {
    let isMounted = true;
    // Inicializa a sessão uma única vez ao montar
    const initialize = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const initialSession = data?.session ?? null;

        if (!isMounted) return;

        // Guarda o id atual
        prevUserIdRef.current = initialSession?.user?.id ?? null;

        await handleAuthState(initialSession);
      } catch (err) {
        console.error('Error during auth initialization:', err);
        if (isMounted) {
          setLoading(false); // fallback para não travar a aplicação
        }
      }
    };

    initialize();

    // Listener para mudanças de autenticação; somente reage quando o user id muda
    const { data: listenerData } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      try {
        const newUserId = newSession?.user?.id ?? null;

        // Se o user id não mudou, ignoramos (evita refetch ao trocar aba / refresh de token)
        if (newUserId === prevUserIdRef.current) {
          // Atualiza session object, mas não dispara fetch de profile nem toggle de loading
          setSession(newSession);
          setUser(newSession?.user ?? null);
          return;
        }

        // Houve mudança de usuário (login/logout), atualizamos e buscamos profile
        prevUserIdRef.current = newUserId;
        setLoading(true);
        await handleAuthState(newSession);
      } catch (err) {
        console.error('Error handling auth state change:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      try {
        const sub: any = listenerData;
        if (sub?.subscription?.unsubscribe) {
          sub.subscription.unsubscribe();
        } else if (typeof sub?.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      } catch (e) {
        console.warn('Failed to cleanup auth listener:', e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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