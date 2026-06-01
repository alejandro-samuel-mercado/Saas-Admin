import api from "./api"

export interface Supplier {
    id: number
    tradeName: string
    legalName: string
    taxId: string
    taxStatus: string
    email: string
    phone: string
    billingAddress: string
    isActive: boolean
}

export interface SupplierSKU {
    id: number
    supplierId: number
    skuId: number
    sku_proveedor?: string
    precio_compra_base: number
    moneda: string
    plazo_entrega_estimado?: number
    activo: boolean
    sku: {
        id: number
        code: string
        product: {
            name: string
        }
        variantOptions?: {
            name: string
            value: string
        }[]
    }
}

export const supplierService = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/suppliers', { params })
        return data.data
    },

    getById: async (id: number) => {
        const { data } = await api.get(`/suppliers/${id}`)
        return data.data
    },

    create: async (supplier: Partial<Supplier>) => {
        const { data } = await api.post('/suppliers', supplier)
        return data.data
    },

    update: async (id: number, supplier: Partial<Supplier>) => {
        const { data } = await api.put(`/suppliers/${id}`, supplier)
        return data.data
    },

    addSku: async (supplierId: number, skuData: any) => {
        const { data } = await api.post(`/suppliers/${supplierId}/skus`, skuData)
        return data.data
    },

    removeSku: async (supplierId: number, skuId: number) => {
        const { data } = await api.delete(`/suppliers/${supplierId}/skus/${skuId}`)
        return data
    }
}
