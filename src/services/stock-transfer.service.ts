
import { StockTransfer } from '../types/schema';
import api from './api';

const stockTransferService = {
  getAll: async (params?: any): Promise<any> => {
    const { data } = await api.get<{ success: boolean; data: any }>('/stock-transfers', { params });
    return data?.data?.data || data?.data || data || [];
  },

  getById: async (id: number): Promise<StockTransfer> => {
    const { data } = await api.get<{ success: boolean; data: StockTransfer }>(`/stock-transfers/${id}`);
    return data.data;
  },

  create: async (data: any): Promise<StockTransfer> => {
    
    const { data: res } = await api.post<{ success: boolean; data: StockTransfer }>('/stock-transfers', data);
    return res.data;
  },
  
  ship: async (id: number): Promise<StockTransfer> => {
    const { data } = await api.put<{ success: boolean; data: StockTransfer }>(`/stock-transfers/${id}/ship`);
    return data.data;
  },

  receive: async (id: number): Promise<StockTransfer> => {
    const { data } = await api.put<{ success: boolean; data: StockTransfer }>(`/stock-transfers/${id}/receive`);
    return data.data;
  },

  cancel: async (id: number): Promise<StockTransfer> => {
    const { data } = await api.put<{ success: boolean; data: StockTransfer }>(`/stock-transfers/${id}/cancel`);
    return data.data;
  },

  downloadPdf: async (id: number): Promise<void> => {
    const response = await api.get(`/stock-transfers/${id}/pdf`, {
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transferencia-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default stockTransferService;
