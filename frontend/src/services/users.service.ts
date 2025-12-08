import api from "@/lib/api";

export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

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

export interface User {
  id: string;
  email: string;
  name?: string; // computed field for backwards compatibility
  isActive: boolean;
  isVerified: boolean;
  role: Role;
  profile?: Profile;
  lastLoginAt: string | null;
  verificationEmailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  roleId: number;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  roleId?: number;
  isActive?: boolean;
}

export const usersService = {
  async findAll(includeInactive: boolean = false): Promise<User[]> {
    const params = includeInactive ? { includeInactive: 'true' } : {};
    const response = await api.get<User[]>("/users", { params });
    return response.data;
  },

  async findById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async create(data: CreateUserDto): Promise<User> {
    const response = await api.post<User>("/users", data);
    return response.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<User> {
    const response = await api.delete<User>(`/users/${id}`);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>("/users/profile");
    return response.data;
  },

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/resend-verification", { email });
    return response.data;
  },

  async adminResetPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/admin-reset-password", { email });
    return response.data;
  },

  async adminSetPassword(email: string, password: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/admin-set-password", { email, password });
    return response.data;
  },
};

export const rolesService = {
  async findAll(): Promise<Role[]> {
    const response = await api.get<Role[]>("/roles");
    return response.data;
  },

  async findById(id: number): Promise<Role> {
    const response = await api.get<Role>(`/roles/${id}`);
    return response.data;
  },
};
