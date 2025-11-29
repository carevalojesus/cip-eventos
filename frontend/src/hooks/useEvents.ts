import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events.service";

export const useEvents = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: () => eventsService.findAll(),
    staleTime: 1000 * 30, // 30 segundos - para que refresque más rápido
    refetchOnMount: "always", // Siempre refrescar al montar el componente
  });

  return {
    events: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
};
