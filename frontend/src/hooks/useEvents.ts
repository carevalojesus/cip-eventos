import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events.service";
import type { Event } from "@/types/event";

export const useEvents = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: () => eventsService.findAll(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    events: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
};
