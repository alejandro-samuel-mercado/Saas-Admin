import { Purchase } from "../types/schema"
import api from "./api"

export type { Purchase }

export const purchaseService = {
    getAll: async (params?: any): Promise<any> => {
        const { data } = await api.get('/purchases', { params })
        return data?.data?.data || data?.data || data
    },

    getById: async (id: number): Promise<Purchase> => {
        const { data } = await api.get(`/purchases/${id}`)
        return data.data
    },

    create: async (purchaseData: any): Promise<Purchase> => {
        const { data } = await api.post('/purchases', purchaseData)
        return data.data
    },

    confirm: async (id: number): Promise<Purchase> => {
        const { data } = await api.post(`/purchases/${id}/confirm`)
        return data.data
    },

    receive: async (id: number): Promise<Purchase> => {
        const { data } = await api.post(`/purchases/${id}/receive`)
        return data.data
    },

    cancel: async (id: number): Promise<Purchase> => {
        const { data } = await api.post(`/purchases/${id}/cancel`)
        return data.data
    }
}
