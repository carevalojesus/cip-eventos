import api from "@/lib/api";

// ============================================
// Profile Types (datos de cuenta)
// ============================================
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  designation?: string;
  description?: string;
  address?: string;
  avatar?: string;
  phoneNumber?: string;
}

export interface CreateProfileDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  designation?: string;
  description?: string;
  address?: string;
  avatar?: string;
}

export interface UpdateProfileDto extends Partial<CreateProfileDto> {}

// ============================================
// Person Types (datos nominales/legales)
// ============================================
export enum DocumentType {
  DNI = "DNI",
  CE = "CE",
  PASSPORT = "PASSPORT",
  OTHER = "OTHER",
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  birthDate?: string | null;
  guardianName?: string | null;
  guardianDocument?: string | null;
  guardianPhone?: string | null;
  guardianAuthorizationUrl?: string | null;
  flagRisk: boolean;
  flagDataObserved: boolean;
  reniecValidationScore?: number | null;
  reniecValidatedAt?: string | null;
  isPseudonymized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonDto {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email: string;
  phone?: string;
  country?: string;
  birthDate?: string;
}

export interface UpdatePersonDto {
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  country?: string;
  birthDate?: string;
}

export interface PersonResponse {
  data: Person | null;
  hasData: boolean;
}

// ============================================
// Profile Service (datos de cuenta)
// ============================================
export const profileService = {
  async getMyProfile(): Promise<Profile> {
    const response = await api.get<Profile>("/profiles/me");
    return response.data;
  },

  async createProfile(data: CreateProfileDto): Promise<Profile> {
    const response = await api.post<Profile>("/profiles", data);
    return response.data;
  },

  async updateProfile(data: UpdateProfileDto): Promise<Profile> {
    const response = await api.patch<Profile>("/profiles/me", data);
    return response.data;
  },
};

// ============================================
// Person Service (datos nominales/legales)
// ============================================
export const personService = {
  async getMyPerson(): Promise<PersonResponse> {
    const response = await api.get<PersonResponse>("/persons/me");
    return response.data;
  },

  async createMyPerson(data: CreatePersonDto): Promise<Person> {
    const response = await api.post<Person>("/persons/me", data);
    return response.data;
  },

  async updateMyPerson(data: UpdatePersonDto): Promise<Person> {
    const response = await api.patch<Person>("/persons/me", data);
    return response.data;
  },

  async revalidateMyPerson(): Promise<Person> {
    const response = await api.post<Person>("/persons/me/revalidate");
    return response.data;
  },
};
