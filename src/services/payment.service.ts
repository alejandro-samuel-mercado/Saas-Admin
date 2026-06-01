import { GatewayCurrencySupport, PaymentGateway } from '@/types/payment';
import api from './api';

export const PaymentGatewaysAPI = {
    getAll: async () => {
        const { data } = await api.get('/payments/admin/gateways');
        return data.data as PaymentGateway[];
    },
    
    update: async (id: number, data: Partial<PaymentGateway>) => {
        const { data: res } = await api.put(`/payments/admin/gateways/${id}`, data);
        return res.data;
    },

    getCurrencySupport: async () => {
        const { data } = await api.get('/payments/admin/gateways/currency-support');
        return data.data as GatewayCurrencySupport[];
    },

    updateCurrencySupport: async (payload: { 
        currencyCode: string; 
        gatewayId: number; 
        isPrimary?: boolean; 
        isSecondary?: boolean; 
    }) => {
        const { data } = await api.post('/payments/admin/gateways/currency-support', payload);
        return data.data;
    }
};
