import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketsService } from "@/services/tickets.service";
import type { CreateTicketDto, UpdateTicketDto } from "@/types/event";

export const useTickets = (eventId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ["tickets", eventId];

  const {
    data: tickets = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => ticketsService.getTickets(eventId),
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTicketDto) => ticketsService.createTicket(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: UpdateTicketDto }) =>
      ticketsService.updateTicket(eventId, ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsService.deleteTicket(eventId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    tickets,
    isLoading,
    error,
    refetch,
    createTicket: createMutation.mutateAsync,
    updateTicket: updateMutation.mutateAsync,
    deleteTicket: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
