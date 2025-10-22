import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Define um tipo para os dados do perfil
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

// Define um tipo para as cores Vita
interface VitaColor {
  id: string;
  nome: string;
  hexadecimal: string;
}

// Define um tipo para os procedimentos
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

  // Ref used to ensure we only treat the very first auth event as the "initialization"
  const initializedRef = useRef(false);

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

        if (error && error.code !== 'PGRST116') {
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
        console.error("Error fetching vita colors in context:", error);
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
        console.error("Error fetching procedures in context:", error);
        setProcedures([]);
      } finally {
        setLoadingProcedures(false);
      }
    };

    // 1. Fetch static data first
    fetchVitaColors();
    fetchProcedures();

    // 2. Handle session initialization (one-time)
    const initializeSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          const profileData = await fetchProfile(initialSession.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error("Error initializing session:", e);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        // mark initialization as done and clear loading
        initializedRef.current = true;
        setLoading(false);
      }
    };

    initializeSession();

    // 3. Listen for auth state changes and only treat the first callback specially
    const { data: listenerData } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      try {
        // Update session and user immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // If we have a user, fetch their profile
        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error handling auth state change:", err);
      } finally {
        // If this is the first auth callback we process, mark initialization done.
        // Subsequent auth events shouldn't re-enable the global loading spinner.
        if (!initializedRef.current) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    });

    // 4. Cleanup subscription on unmount
    return () => {
      if (listenerData && typeof (listenerData as any).subscription?.unsubscribe === 'function') {
        (listenerData as any).subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
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