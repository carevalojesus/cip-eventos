import api from "@/lib/api";
import type { EventTicket, CreateTicketDto, UpdateTicketDto } from "@/types/event";

export const ticketsService = {
  async getTickets(eventId: string): Promise<EventTicket[]> {
    const response = await api.get<EventTicket[]>(`/events/${eventId}/tickets`);
    return response.data;
  },

  async getTicket(eventId: string, ticketId: string): Promise<EventTicket> {
    const response = await api.get<EventTicket>(`/events/${eventId}/tickets/${ticketId}`);
    return response.data;
  },

  async createTicket(eventId: string, data: CreateTicketDto): Promise<EventTicket> {
    const response = await api.post<EventTicket>(`/events/${eventId}/tickets`, data);
    return response.data;
  },

  async updateTicket(eventId: string, ticketId: string, data: UpdateTicketDto): Promise<EventTicket> {
    const response = await api.patch<EventTicket>(`/events/${eventId}/tickets/${ticketId}`, data);
    return response.data;
  },

  async deleteTicket(eventId: string, ticketId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/events/${eventId}/tickets/${ticketId}`);
    return response.data;
  },
};
