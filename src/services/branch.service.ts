import { Branch, User } from '../types/schema';
import api from './api';

const branchService = {
  getAll: async (params?: any): Promise<Branch[]> => {
    const { data } = await api.get<{ success: boolean; data: Branch[] }>('/branches', { params });
    return data.data;
  },

  getById: async (id: number): Promise<Branch> => {
    const { data } = await api.get<{ success: boolean; data: Branch }>(`/branches/${id}`);
    return data.data;
  },

  create: async (data: Partial<Branch>): Promise<Branch> => {
    const { data: res } = await api.post<{ success: boolean; data: Branch }>('/branches', data);
    return res.data;
  },
  
  update: async (id: number, data: Partial<Branch>): Promise<Branch> => {
    const { data: res } = await api.put<{ success: boolean; data: Branch }>(`/branches/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/branches/${id}`);
  },

  getUsers: async (branchId: number): Promise<User[]> => {
    const { data } = await api.get<{ success: boolean; data: User[] }>(`/branches/${branchId}/users`);
    return data.data;
  },

  addUser: async (branchId: number, userId: number): Promise<void> => {
    await api.post(`/branches/${branchId}/users`, { userId });
  },

  removeUser: async (branchId: number, userId: number): Promise<void> => {
    await api.delete(`/branches/${branchId}/users/${userId}`);
  }
};

export default branchService;
