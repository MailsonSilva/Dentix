import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import SupabaseImage from "@/components/SupabaseImage";
import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";
import { DeleteSimulationDialog } from "@/components/DeleteSimulationDialog";
import { Input } from "@/components/ui/input";

interface Simulation {
  id: string;
  nome_paciente: string;
  imagem_original_url: string;
  imagem_simulada_url: string;
  criado_em: string;
  procedimentos: { nome: string }[] | null;
}

const Simulations = () => {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState<Simulation | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search state
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchSimulations = async () => {
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("simulacoes")
        .select(`
                    id,
                    nome_paciente,
                    imagem_original_url,
                    imagem_simulada_url,
                    criado_em,
                    procedimentos ( nome )
                `)
        .eq("usuario_id", user.id)
        .order("criado_em", { ascending: false });

      if (error) {
        console.error("Error fetching simulations:", error);
        showError("Não foi possível carregar as simulações.");
      } else {
        setSimulations(data as Simulation[]);
      }
      setLoading(false);
    };

    fetchSimulations();
  }, [user]);

  // Filtered list computed from simulations + query
  const filteredSimulations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return simulations;
    return simulations.filter((sim) => {
      const patient = (sim.nome_paciente || "").toLowerCase();
      const procedure = (sim.procedimentos?.[0]?.nome || "").toLowerCase();
      return patient.includes(q) || procedure.includes(q);
    });
  }, [simulations, query]);

  const handleDeleteClick = (simulation: Simulation) => {
    setSimulationToDelete(simulation);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!simulationToDelete) return;

    setDeleting(true);
    try {
      const urls = [simulationToDelete.imagem_original_url, simulationToDelete.imagem_simulada_url];
      const pathsToDelete = urls
        .map((url) => {
          try {
            const urlObject = new URL(url);
            const pathParts = urlObject.pathname.split(`/simulacoes/`);
            return pathParts.length > 1 ? pathParts[1] : null;
          } catch (e) {
            console.warn(`Invalid URL found: ${url}`);
            return null;
          }
        })
        .filter(Boolean) as string[];

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from("simulacoes").remove(pathsToDelete);
        if (storageError) throw storageError;
      }

      const { error: dbError } = await supabase.from("simulacoes").delete().eq("id", simulationToDelete.id);

      if (dbError) throw dbError;

      setSimulations((prev) => prev.filter((s) => s.id !== simulationToDelete.id));
      showSuccess("Simulação excluída com sucesso!");
    } catch (error) {
      console.error("Error deleting simulation:", error);
      showError("Não foi possível excluir a simulação.");
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setSimulationToDelete(null);
    }
  };

  return (
    <>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Minhas Simulações</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {simulations.length} simulacões no total
            </p>
          </div>

          {/* Search input */}
          <div className="w-full sm:w-80">
            <label className="relative block">
              <span className="sr-only">Pesquisar simulações</span>
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <Input
                className="pl-9"
                placeholder="Pesquisar por paciente ou procedimento..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSimulations.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">Nenhuma simulação encontrada</h3>
            <p className="text-muted-foreground mt-2">
              Tente buscar por outro nome de paciente ou procedimento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSimulations.map((sim) => (
              <Card key={sim.id}>
                <CardHeader>
                  <CardTitle>{sim.nome_paciente}</CardTitle>
                  <p className="text-sm text-muted-foreground">{sim.procedimentos?.[0]?.nome}</p>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-center">Antes</h4>
                    <SupabaseImage
                      bucket="simulacoes"
                      url={sim.imagem_original_url}
                      alt="Original"
                      className="rounded-md aspect-square object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-center">Depois</h4>
                    <SupabaseImage
                      bucket="simulacoes"
                      url={sim.imagem_simulada_url}
                      alt="Simulada"
                      className="rounded-md aspect-square object-cover"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Criado em: {format(new Date(sim.criado_em), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(sim)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DeleteSimulationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </>
  );
};

export default Simulations;