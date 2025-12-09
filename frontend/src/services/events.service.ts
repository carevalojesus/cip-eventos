import api from "@/lib/api";
import type { Event, EventType, EventCategory, EventModality, EventLocation, CreateEventDto } from "@/types/event";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const eventsService = {
  async findAll(page = 1, limit = 100): Promise<Event[]> {
    const response = await api.get<PaginatedResponse<Event>>("/events", {
      params: { page, limit },
    });
    return response.data.data;
  },

  async findById(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  // Para gestión de eventos (incluye virtualAccess y todos los estados)
  async findByIdFull(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}/full`);
    return response.data;
  },

  async update(id: string, data: Partial<CreateEventDto>): Promise<Event> {
    const response = await api.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  async updateWithImage(id: string, formData: FormData): Promise<Event> {
    const response = await api.patch<Event>(`/events/${id}/with-image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async publish(id: string): Promise<Event> {
    const response = await api.patch<Event>(`/events/${id}/publish`);
    return response.data;
  },

  async findAllPaginated(page = 1, limit = 10): Promise<PaginatedResponse<Event>> {
    const response = await api.get<PaginatedResponse<Event>>("/events", {
      params: { page, limit },
    });
    return response.data;
  },

  async getTypes(): Promise<EventType[]> {
    const response = await api.get<EventType[]>("/events/types");
    return response.data;
  },

  async getCategories(): Promise<EventCategory[]> {
    const response = await api.get<EventCategory[]>("/events/categories");
    return response.data;
  },

  async getModalities(): Promise<EventModality[]> {
    const response = await api.get<EventModality[]>("/events/modalities");
    return response.data;
  },

  async createEvent(data: CreateEventDto): Promise<Event> {
    const response = await api.post<Event>("/events", data);
    return response.data;
  },

  async createEventWithImage(formData: FormData): Promise<Event> {
    const response = await api.post<Event>("/events/with-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getUniqueLocations(): Promise<EventLocation[]> {
    const response = await api.get<EventLocation[]>("/events/locations");
    return response.data;
  },
};
