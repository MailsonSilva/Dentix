import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const [vitaColors, setVitaColors] = useState<VitaColor[]>([]);
  const [loadingVitaColors, setLoadingVitaColors] = useState(true);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(true);

  // Garante que tratemos a inicialização apenas uma vez
  const initializedRef = useRef(false);
  // Guarda o timeout para fallback
  const initTimeoutRef = useRef<number | null>(null);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
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

    // Fallback: se a inicialização travar, removemos o loading após 5s para não bloquear a UI indefinidamente
    const startInitFallback = () => {
      // window.setTimeout returns a number; guardamos no ref para limpar depois
      initTimeoutRef.current = window.setTimeout(() => {
        if (!initializedRef.current) {
          initializedRef.current = true;
          setLoading(false);
          console.warn('Auth initialization fallback triggered: forcing loading=false');
        }
      }, 5000);
    };

    // 1. carregar dados estáticos (cores/procedimentos) em background
    fetchVitaColors();
    fetchProcedures();

    // 2. inicialização da sessão (uma vez)
    const initializeSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          const profileData = await fetchProfile(initialSession.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error('Error initializing session:', e);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        initializedRef.current = true;
        setLoading(false);
      }
    };

    // start fallback timer and initialize
    startInitFallback();
    initializeSession();

    // 3. listener para mudanças de autenticação
    const { data: listenerData } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error handling auth state change:', err);
      } finally {
        if (!initializedRef.current) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    });

    // Cleanup: cancelar timeout e unsubscribes
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }

      // listenerData pode ser { subscription } ou conter método unsubscribe dependendo da versão
      try {
        const maybeSub: any = listenerData;
        if (maybeSub?.subscription?.unsubscribe) {
          maybeSub.subscription.unsubscribe();
        } else if (typeof maybeSub?.unsubscribe === 'function') {
          maybeSub.unsubscribe();
        }
      } catch (e) {
        // Não bloquear o unmount por erros aqui
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