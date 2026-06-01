import api from './api';

export interface AlertLog {
    id: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    code: string;
    message: string;
    stack?: string;
    context?: any;
    status: 'OPEN' | 'RESOLVED' | 'IGNORED';
    occurrences: number;
    createdAt: string;
    updatedAt: string;
}

export const SystemService = {
    getSystemStatus: async () => {
        const { data } = await api.get('/system/status');
        return data;
    },

    getAlerts: async (params?: { 
        status?: string, 
        severity?: string, 
        page?: number, 
        pageSize?: number,
        sortBy?: string,
        sortOrder?: 'asc' | 'desc',
        startDate?: string,
        endDate?: string
    }) => {
        const { data } = await api.get('/system/alerts', { params });
        return data as { success: boolean, data: AlertLog[], pagination: { total: number, page: number, pageSize: number, totalPages: number } }; 
    },

    resolveAlert: async (id: number) => {
        const { data } = await api.patch(`/system/alerts/${id}/resolve`);
        return data;
    }
};
