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
  // Proteção temporal para evitar chamadas repetidas em curto espaço de tempo
  const lastHandledRef = useRef<number | null>(null);
  // Armazena a inscrição para cleanup correto
  const authSubscriptionRef = useRef<any>(null);

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

    // Listener para mudanças de autenticação.
    // Estratégia:
    // - Ignorar INITIAL_SESSION (já tratado pela inicialização).
    // - Tratar TOKEN_REFRESHED / USER_UPDATED como atualização de sessão sem refetch.
    // - Apenas SIGNED_IN e SIGNED_OUT disparam refetch de profile.
    const { data: listenerData } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      // Debug log para inspecionar o que está acontecendo no reload/mobile
      // Por favor cole esses logs se o problema persistir
      // eslint-disable-next-line no-console
      console.debug('[supabase auth event]', { event, prevUserId: prevUserIdRef.current, newUserId: newSession?.user?.id ?? null, time: new Date().toISOString() });

      const now = Date.now();
      const last = lastHandledRef.current ?? 0;
      // Se estamos recebendo eventos muito rapidamente, ignoramos para evitar loops
      if (now - last < 700) {
        // atualiza a session local se necessário, mas evita trabalho pesado
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user ?? null);
        }
        return;
      }
      lastHandledRef.current = now;

      if (event === 'INITIAL_SESSION') {
        // Já tratado por getSession() na inicialização; ignorar
        return;
      }

      // Eventos que apenas atualizam o token/usuário — NÃO refetch do perfil
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        return;
      }

      // Para SIGNED_IN / SIGNED_OUT, refetch de profile (mudança real de usuário)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const newUserId = newSession?.user?.id ?? null;

        // Se o user id não mudou, atualiza sessão e segue sem refetch
        if (newUserId === prevUserIdRef.current) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          return;
        }

        prevUserIdRef.current = newUserId;
        setLoading(true);
        // não await aqui para não bloquear o listener
        handleAuthState(newSession).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Error in handleAuthState from auth listener:', err);
          if (isMounted) setLoading(false);
        });
        return;
      }

      // Para qualquer outro evento inesperado, apenas atualize a session para manter estado consistente
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // store subscription for cleanup
    authSubscriptionRef.current = listenerData;

    return () => {
      isMounted = false;
      try {
        const sub: any = authSubscriptionRef.current;
        if (sub?.subscription?.unsubscribe) {
          sub.subscription.unsubscribe();
        } else if (typeof sub?.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      } catch (e) {
        // eslint-disable-next-line no-console
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