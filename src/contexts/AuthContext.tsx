import { createContext, useContext, useEffect, useState } from 'react';
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

  const logout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string | undefined) => {
      if (!userId) {
        if (isMounted) setProfile(null);
        return;
      }
      try {
        const { data: profileData, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          if (isMounted) setProfile(null);
        } else {
          if (isMounted) setProfile(profileData as Profile | null);
        }
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
        if (isMounted) setProfile(null);
      }
    };

    const fetchVitaColors = async () => {
      if (!isMounted) return;
      setLoadingVitaColors(true);
      try {
        const { data, error } = await supabase
          .from('cores_vita')
          .select('id, nome, hexadecimal')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        if (isMounted) setVitaColors(data || []);
      } catch (error) {
        console.error("Error fetching vita colors in context:", error);
        if (isMounted) setVitaColors([]);
      } finally {
        if (isMounted) setLoadingVitaColors(false);
      }
    };

    const fetchProcedures = async () => {
      if (!isMounted) return;
      setLoadingProcedures(true);
      try {
        const { data, error } = await supabase
          .from('procedimentos')
          .select('id, nome, descricao, webhook_valor')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        if (isMounted) setProcedures(data || []);
      } catch (error) {
        console.error("Error fetching procedures in context:", error);
        if (isMounted) setProcedures([]);
      } finally {
        if (isMounted) setLoadingProcedures(false);
      }
    };

    // Initialize: get current session and other data
    const init = async () => {
      // Fetch colors and procedures as soon as the provider mounts
      fetchVitaColors();
      fetchProcedures();

      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (isMounted) setLoading(false);
      }

      // Now subscribe to auth state changes
      const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!isMounted) return;
        setLoading(true);
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      return data.subscription;
    };

    let subscriptionRef: { unsubscribe?: () => void } | null = null;

    init().then((sub) => {
      // keep reference to subscription so we can unsubscribe in cleanup
      subscriptionRef = sub as any;
    });

    return () => {
      isMounted = false;
      try {
        // unsubscribe if available
        if (subscriptionRef && typeof (subscriptionRef as any).unsubscribe === 'function') {
          (subscriptionRef as any).unsubscribe();
        }
      } catch (err) {
        // ignore
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