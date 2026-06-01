import api from './api'

export interface InventoryItem {
    id: number | string
    skuId: number
    skuCode: string
    productName: string
    categoryName: string
    image: string | null
    variant: string
    stock: number
    minStock: number
    totalStock?: number
    branchStocks?: { branchId: number; branchName: string; isActive: boolean; stock: number; minStock: number }[]
    price: string
    measurementUnit: string   
    allowFractional: boolean  
    updatedAt: string
}


export function getUnitLabel(unit: string): string {
    const map: Record<string, string> = {
        UNIDAD: 'unidades',
        KG: 'kilogramos',
        LITRO: 'litros',
        METRO: 'metros',
        GRAMO: 'gramos',
        MILILITRO: 'mililitros',
    }
    return map[unit] ?? unit.toLowerCase()
}

export function formatStock(stock: number, unit: string): string {
    const label = getUnitLabel(unit)
    if (unit === 'UNIDAD') return `${stock} ${label}`
    const formatted = parseFloat(stock.toFixed(3)).toString()
    return `${formatted} ${label}`
}


export function formatPrice(price: number | string, unit: string, currencyCode: string = 'USD', currencySymbol?: string): string {
    const amount = typeof price === 'string' ? parseFloat(price) : price
    const formatted = isNaN(amount) ? '0' : amount.toFixed(2).replace(/\.00$/, '')
    const symbol = currencySymbol || '$';
    if (!unit || unit === 'UNIDAD') return `${symbol}${formatted}`
    return `${symbol}${formatted}/${getUnitLabel(unit)}`
}

const CONVERSION: Record<string, { factor: number; baseUnit: string }> = {
    GRAMO: { factor: 0.001, baseUnit: 'KG' },
    MILILITRO: { factor: 0.001, baseUnit: 'LITRO' },
    CENTIMETRO: { factor: 0.01, baseUnit: 'METRO' },
    KG: { factor: 1, baseUnit: 'KG' },
    LITRO: { factor: 1, baseUnit: 'LITRO' },
    METRO: { factor: 1, baseUnit: 'METRO' },
    UNIDAD: { factor: 1, baseUnit: 'UNIDAD' },
}

export function convertToBaseUnit(qty: number, displayUnit: string): number {
    const conv = CONVERSION[displayUnit]
    if (!conv) return qty
    return qty * conv.factor
}

export const StockControlService = {
   
    getInventory: async (branchId: number | null, params?: { search?: string, categoryId?: number, supplierId?: number, brand?: string, stockLevel?: string, page?: number, limit?: number }) => {
        const { data } = await api.get('/admin/stock/inventory', {
            params: { ...params, branchId }
        })
        return {
            data: (data.data?.data || []) as InventoryItem[],
            total: data.data?.total || 0,
            totalPages: data.data?.totalPages || 1,
            page: data.data?.page || 1
        }
    },

    
    updateInventory: async (id: number, updates: { stock?: number, minStock?: number, price?: number }, branchId?: number) => {
        const { data } = await api.put(`/admin/stock/inventory/${id}`, updates, { params: { branchId } })
        return data.data
    }
}
