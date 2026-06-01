import api from './api';

export interface ChatAutoResponse {
    id: number;
    trigger: string;
    response: string;
    isActive: boolean;
}

export const chatBotService = {
    getAll: async (): Promise<ChatAutoResponse[]> => {
        const { data } = await api.get('/chat/auto-responses');
        return data;
    },

    create: async (payload: Omit<ChatAutoResponse, 'id'>): Promise<ChatAutoResponse> => {
        const { data } = await api.post('/chat/auto-responses', payload);
        return data;
    },

    update: async (id: number, payload: Partial<ChatAutoResponse>): Promise<ChatAutoResponse> => {
        const { data } = await api.put(`/chat/auto-responses/${id}`, payload);
        return data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/chat/auto-responses/${id}`);
    }
};
