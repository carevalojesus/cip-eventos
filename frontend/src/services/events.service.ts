import api from "@/lib/api";
import type { Event, EventType, EventCategory, EventModality, EventLocation, CreateEventDto } from "@/types/event";

export const eventsService = {
  async findAll(): Promise<Event[]> {
    const response = await api.get<Event[]>("/events");
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

  async getUniqueLocations(): Promise<EventLocation[]> {
    const events = await this.findAll();
    const locationsMap = new Map<string, EventLocation>();

    events.forEach(event => {
      if (event.location) {
        // Manejar ubicaciones antiguas sin campo name
        const locationWithName = {
          ...event.location,
          name: event.location.name || event.location.address.split('-')[0].trim(),
        };
        const key = locationWithName.address.toLowerCase();
        if (!locationsMap.has(key)) {
          locationsMap.set(key, locationWithName);
        }
      }
    });

    return Array.from(locationsMap.values());
  },
};
