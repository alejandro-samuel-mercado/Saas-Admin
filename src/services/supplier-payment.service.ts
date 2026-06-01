import { SupplierPayment } from '../types/schema';
import api from './api';

interface CreatePaymentDto {
    supplierId: number;
    purchaseId?: number;
    amount: number;
    method: string;
    description?: string;
    reference?: string;
    paymentDate: string;
}

const supplierPaymentService = {
  getAll: async (params?: any): Promise<any> => {
    const { data } = await api.get<{ success: boolean; data: any }>('/supplier-payments', { params });
    return data.data;
  },

  getById: async (id: number): Promise<SupplierPayment> => {
    const { data } = await api.get<{ success: boolean; data: SupplierPayment }>(`/supplier-payments/${id}`);
    return data.data;
  },

  create: async (payload: CreatePaymentDto): Promise<SupplierPayment> => {
    const { data } = await api.post<{ success: boolean; data: SupplierPayment }>('/supplier-payments', payload);
    return data.data;
  }
};

export default supplierPaymentService;
