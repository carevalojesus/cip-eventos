import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsService } from "@/services/sessions.service";
import type { CreateSessionDto, UpdateSessionDto } from "@/types/event";

export const useSessions = (eventId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ["sessions", eventId];

  const {
    data: sessions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => sessionsService.getSessions(eventId),
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSessionDto) => sessionsService.createSession(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: UpdateSessionDto }) =>
      sessionsService.updateSession(eventId, sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsService.deleteSession(eventId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    sessions,
    isLoading,
    error,
    refetch,
    createSession: createMutation.mutateAsync,
    updateSession: updateMutation.mutateAsync,
    deleteSession: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
