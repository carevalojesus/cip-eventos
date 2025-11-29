export type EventStatus = 'PUBLISHED' | 'DRAFT' | 'COMPLETED' | 'CANCELLED';
export type EventStatusLower = 'published' | 'draft' | 'completed' | 'cancelled';

export interface EventModality {
  id: number;
  name: string;
  description?: string;
}

export interface EventLocation {
  id: string;
  name?: string;
  address: string;
  reference?: string;
  city: string;
  mapLink?: string;
}

export interface EventVirtualAccess {
  id: string;
  platform: string;
  meetingUrl: string;
  meetingPassword?: string;
  instructions?: string;
}

export interface EventType {
  id: number;
  name: string;
}

export interface EventCategory {
  id: number;
  name: string;
}

export interface Speaker {
  id: string;
  firstName: string;
  lastName: string;
  profession: string;
  bio?: string;
  photoUrl?: string;
  knowledge?: string;
  companyName?: string;
}

export interface Organizer {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
}

export interface EventTicket {
  id: string;
  name: string;
  price: number;
  stock: number;
  requiresCipValidation: boolean;
  isActive: boolean;
}

export interface EventSession {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  room?: string;
  meetingUrl?: string;
  speakers?: Speaker[];
}

export interface Signer {
  id: string;
  name: string;
  title: string;
  signatureUrl?: string;
}

export interface EventCreatedBy {
  id: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  description: string;
  startAt: string;
  endAt: string;
  timezone?: string;
  imageUrl?: string;
  status: EventStatus;
  type: EventType;
  category: EventCategory;
  modality: EventModality;
  location?: EventLocation;
  virtualAccess?: EventVirtualAccess;
  // Relaciones
  speakers?: Speaker[];
  organizers?: Organizer[];
  tickets?: EventTicket[];
  sessions?: EventSession[];
  signers?: Signer[];
  // Certificado
  hasCertificate?: boolean;
  certificateHours?: number;
  // Estadísticas
  enrolledCount?: number;
  // Auditoría
  isActive?: boolean;
  createdBy?: EventCreatedBy;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketDto {
  name: string;
  price: number;
  stock: number;
  requiresCipValidation?: boolean;
}

export interface UpdateTicketDto extends Partial<CreateTicketDto> {
  isActive?: boolean;
}

export interface CreateEventDto {
  title: string;
  slug?: string;
  summary?: string;
  description: string;
  typeId: number;
  categoryId: number;
  modalityId: number;
  startAt: string;
  endAt: string;
  timezone?: string;
  imageUrl?: string;
  status?: EventStatus;
  location?: {
    name?: string;
    address: string;
    reference?: string;
    city: string;
    mapLink?: string;
  };
  virtualAccess?: {
    platform: string;
    meetingUrl: string;
    meetingPassword?: string;
    instructions?: string;
  };
  hasCertificate?: boolean;
  certificateHours?: number;
  speakersIds?: number[];
  organizersIds?: number[];
}
