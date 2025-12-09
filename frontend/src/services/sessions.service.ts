import api from "@/lib/api";
import type { EventSession, CreateSessionDto, UpdateSessionDto } from "@/types/event";

export const sessionsService = {
  async getSessions(eventId: string): Promise<EventSession[]> {
    const response = await api.get<EventSession[]>(`/events/${eventId}/sessions`);
    return response.data;
  },

  async getSession(eventId: string, sessionId: string): Promise<EventSession> {
    const response = await api.get<EventSession>(`/events/${eventId}/sessions/${sessionId}`);
    return response.data;
  },

  async createSession(eventId: string, data: CreateSessionDto): Promise<EventSession> {
    const response = await api.post<EventSession>(`/events/${eventId}/sessions`, data);
    return response.data;
  },

  async updateSession(eventId: string, sessionId: string, data: UpdateSessionDto): Promise<EventSession> {
    const response = await api.patch<EventSession>(`/events/${eventId}/sessions/${sessionId}`, data);
    return response.data;
  },

  async deleteSession(eventId: string, sessionId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/events/${eventId}/sessions/${sessionId}`);
    return response.data;
  },
};
