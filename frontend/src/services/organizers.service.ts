import api from "@/lib/api";

export interface Organizer {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  // Datos fiscales
  ruc?: string;
  businessName?: string;
  fiscalAddress?: string;
  baseCurrency: string;
  emitsFiscalDocuments: boolean;
  // Textos legales
  termsText?: string;
  privacyText?: string;
  // Estado
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizerDto {
  name: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  ruc?: string;
  businessName?: string;
  fiscalAddress?: string;
  baseCurrency?: string;
  emitsFiscalDocuments?: boolean;
  termsText?: string;
  privacyText?: string;
}

export interface UpdateOrganizerDto extends Partial<CreateOrganizerDto> {
  isActive?: boolean;
}

export const organizersService = {
  async findAll(includeInactive: boolean = false): Promise<Organizer[]> {
    const response = await api.get<Organizer[]>("/organizers");
    // El backend actualmente solo devuelve activos, filtramos manualmente si se requiere
    if (includeInactive) {
      return response.data;
    }
    return response.data.filter(org => org.isActive);
  },

  async findById(id: string): Promise<Organizer> {
    const response = await api.get<Organizer>(`/organizers/${id}`);
    return response.data;
  },

  async create(data: CreateOrganizerDto): Promise<Organizer> {
    const response = await api.post<Organizer>("/organizers", data);
    return response.data;
  },

  async update(id: string, data: UpdateOrganizerDto): Promise<Organizer> {
    const response = await api.patch<Organizer>(`/organizers/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/organizers/${id}`);
  },
};
