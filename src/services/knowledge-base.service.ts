import { useAuthStore } from "@/store/use-auth-store";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface AutoResponse {
  id: number;
  keywords: string[];
  answer: string;
  isActive: boolean;
}

const getToken = () => useAuthStore.getState().token;

export const knowledgeBaseService = {
  getAll: async () => {
    const token = getToken();
    const response = await axios.get<AutoResponse[]>(`${API_URL}/chat/auto-responses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  create: async (data: { keywords: string[], answer: string }) => {
    const token = getToken();
    const response = await axios.post(`${API_URL}/chat/auto-responses`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  delete: async (id: number) => {
    const token = getToken();
    await axios.delete(`${API_URL}/chat/auto-responses/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
