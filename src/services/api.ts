import { Product } from '@/types/schema';
import axios from 'axios';
import { toast } from 'sonner';

let lastToastMessage = "";
let lastToastTime = 0;
const TOAST_THROTTLE = 4000; 

function throttledToastError(message: string, description?: string) {
    const now = Date.now();
    
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('insuficiente') || lowerMessage.includes('permiso') || lowerMessage.includes('denegado')) {
        return;
    }

    const isConnectionError = lowerMessage.includes('conectar') || lowerMessage.includes('network');
    
    if (isConnectionError) {
        if (now - lastToastTime < TOAST_THROTTLE) return;
    } else {
        if (message === lastToastMessage && now - lastToastTime < 2000) return;
    }
    
    lastToastMessage = message;
    lastToastTime = now;
    
    toast.error(message, { 
        description, 
        duration: 5000,
        style: { border: '1px solid #7c3aed' } 
    });
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true 
})


api.interceptors.request.use(
    (config) => {
        // 0. Tenant ID - Resolución Dinámica (Multi-Tenant SaaS)
        let tenantId = 'default';
        
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            // Si no estamos en localhost, podemos extraer el subdominio
            // Ej: tienda1.miplataforma.com -> tienda1
            if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                const parts = hostname.split('.');
                const isVercel = hostname.endsWith('.vercel.app') || hostname.includes('vercel.app');
                
                // Asumimos que el primer segmento es el tenant (si el dominio base tiene al menos 2 partes, ej nuba.com)
                if (!isVercel && (parts.length >= 3 || (parts.length === 2 && !hostname.includes('vercel.app')))) {
                    const sub = parts[0].toLowerCase();
                    const systemSubdomains = ['saas', 'www', 'admin', 'panel', 'api'];
                    if (systemSubdomains.includes(sub)) {
                        tenantId = 'default';
                    } else {
                        tenantId = parts[0];
                    }
                }
            }
            
            // Permitir sobrescribir vía localStorage SOLO en entorno de desarrollo local
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                const localTenant = localStorage.getItem('dev-tenant-id');
                if (localTenant) {
                    tenantId = localTenant;
                }
            }
        }
        
        config.headers['x-tenant-id'] = tenantId || 'default';

        // 1. Token de Autenticación y Tenant del Usuario
        if (typeof window !== 'undefined') {
            const storage = sessionStorage.getItem('admin-auth-storage')
            if (storage) {
                const { state } = JSON.parse(storage)
                if (state?.token) {
                     config.headers.Authorization = `Bearer ${state.token}`
                }
                
                // Si estamos en un panel global (tenantId === 'default' u originado del .env) 
                // pero ya tenemos un usuario logueado, inyectamos el tenantId verdadero del usuario.
                if (state?.user?.tenantId && (!tenantId || tenantId === 'default' || tenantId === process.env.NEXT_PUBLIC_TENANT_ID)) {
                    tenantId = state.user.tenantId;
                    config.headers['x-tenant-id'] = tenantId;
                }
            }
        }

       
     
        if (typeof window !== 'undefined') {
            const branchStorage = localStorage.getItem('branch-storage')
            if (branchStorage) {
                try {
                    const parsed = JSON.parse(branchStorage)
                    const activeId = parsed.state?.activeBranch?.id
                    
                    if (activeId) {
                        
                        config.headers['x-branch-id'] = activeId.toString()
                        
                        if (config.method === 'get') {
                             config.params = { ...config.params, branchId: activeId }
                        }
                    }
                } catch (e) {
                }
            }
        }

        return config
    },
    (error) => Promise.reject(error)
)

// Interceptor de Respuesta: Manejar 401 y Toasts Globales
api.interceptors.response.use(
    (response) => {
         
         if (typeof window !== 'undefined') {
             const method = response.config?.method?.toLowerCase();
             if (['post', 'put', 'patch', 'delete'].includes(method || '')) {
                
                 if (!response.config?.headers['x-silence-toast']) {
                      const msg = response.data?.message;
                      if (msg) toast.success(msg);
                 }
             }
         }
         return response;
    },
    (error) => {
        // 1. Manejo de Sesión (401)
        if (error.response?.status === 401) {
            import('@/store/use-auth-store').then(({ useAuthStore }) => {
                useAuthStore.getState().logout()
            })
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                 window.location.href = '/login'
            }
        }
        
        // 2. Disparo de Toast Gráfico (Ignorar si la petición pidió evadirlo explícitamente en el futuro)
        if (typeof window !== 'undefined' && error.response?.status !== 401) {
             // Skip toast if x-silence-toast header was sent
             if (!error.config?.headers?.['x-silence-toast']) {
                 const sanitizeErrorMessage = (msg: string) => {
                    if (!msg) return 'Ocurrió un error inesperado al conectar con el servidor.';
                    
                    // Specific translations
                    if (msg.includes('CURRENCY_NOT_SUPPORTED')) return 'PayPal no soporta esta moneda (e.g. ARS). \nUse otro método como MercadoPago.';
                    if (msg.includes('INSTRUMENT_DECLINED')) return 'El medio de pago fue rechazado. \nVerifique fondos o use otra tarjeta.';
                    
                    // AGGRESSIVE: Detect JSON, technical terms, stack traces or very long strings
                    if (msg.includes('{') || msg.includes('Error:') || msg.length > 180 || msg.includes(' at ')) {
                        if (msg.includes('Venta creada')) {
                            const match = msg.match(/Venta creada \(#.*?\)/);
                            if (match) return `${match[0]} pero hubo un problema con el pago. \nContacte a soporte técnico.`;
                        }
                        return 'Error técnico al procesar su solicitud. \nPor favor intente nuevamente.';
                    }
                    return msg;
                 };

                 const message = sanitizeErrorMessage(error.response?.data?.message || error.message);
                 throttledToastError(
                     message, 
                     error.response?.status >= 500 ? 'Contacte a soporte técnico.' : 'Revise los datos ingresados.'
                 );
             }
        }

        return Promise.reject(error)
    }
)

export const ProductsAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/products', { params })
        return data
    },
    getOne: async (id: number, branchId?: number) => {
        const { data } = await api.get(`/products/${id}`, { params: { branchId } })
        return data.data
    },
    create: async (product: Partial<Product>, branchId?: number) => {
        const { data } = await api.post('/products', product, { params: { branchId } })
        return data.data
    },
    update: async (id: number, product: Partial<Product>, branchId?: number) => {
        const { data } = await api.put(`/products/${id}`, product, { params: { branchId } })
        return data.data
    },
    delete: async (id: number, branchId?: number) => {
        const { data } = await api.delete(`/products/${id}`, { params: { branchId } })
        return data
    },
    updatePrices: async (id: number, prices: any[]) => {
        const { data } = await api.put(`/products/${id}/prices`, { prices })
        return data.data
    },
    getPrices: async (id: number) => {
        const { data } = await api.get(`/products/${id}/prices`)
        return data.data
    },
    exportCodes: async (payload: { type: 'QR' | 'BARCODE', selectAll: boolean, selectedIds: number[], filters: any }) => {
        const response = await api.post('/products/export-codes', payload, { responseType: 'blob' })
        return response
    },
    bulkImport: async (payload: any[]) => {
        const { data } = await api.post('/products/bulk', { products: payload })
        return data
    }
}

export const ConfigAPI = {
    get: async (params?: any) => {
        const { data } = await api.get('/config', { params })
        return data
    },
    update: async (config: any) => {
        const { data } = await api.put('/config', config)
        return data
    },
    downloadBackup: async () => {
        const response = await api.get('/backups/download-manual', { responseType: 'blob' })
        return response
    }
}

export const ShippingAPI = {
    getZones: async (params?: any) => {
        const { data } = await api.get('/shipping', { params })
        return data
    },
    createZone: async (zone: any) => {
        const { data } = await api.post('/shipping', zone)
        return data
    },
    updateZone: async (id: number, zone: any) => {
        const { data } = await api.put(`/shipping/${id}`, zone)
        return data
    },
    deleteZone: async (id: number) => {
        await api.delete(`/shipping/${id}`)
    },
    calculateCost: async (location: any) => {
        const { data } = await api.post('/shipping/calculate-cost', location)
        return data
    }
}

export const CategoriesAPI = {
    getAll: async () => {
        const { data } = await api.get('/categories', { params: { limit: 500 } })
        return data?.data?.data || data?.data || data
    },
    create: async (data: any, branchId?: number) => {
        const { data: res } = await api.post('/categories', data, { params: { branchId } })
        return res
    },
    update: async (id: number, data: any, branchId?: number) => {
        const { data: res } = await api.put(`/categories/${id}`, data, { params: { branchId } })
        return res
    },
    delete: async (id: number, branchId?: number) => {
        await api.delete(`/categories/${id}`, { params: { branchId } })
    }
}

export const UsersAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/users', { params })
        return data
    },
    getOne: async (id: number) => {
        const { data } = await api.get(`/users/${id}`)
        return data.data
    },
    create: async (data: any) => {
        const { data: res } = await api.post('/users', data)
        return res
    },
    update: async (id: number, data: any) => {
        const { data: res } = await api.put(`/users/${id}`, data)
        return res
    },
    delete: async (id: number) => {
        await api.delete(`/users/${id}`)
    }
}

export const SalesAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/sales', { params })
        return data
    },
    getOne: async (id: number) => {
        const { data } = await api.get(`/sales/${id}`)
        return data.data
    },
    create: async (data: any) => {
        const { data: res } = await api.post('/sales/checkout', data)
        return res
    },
    update: async (id: number, data: any) => {
        const { data: res } = await api.put(`/sales/${id}`, data)
        return res.data
    },
    refund: async (id: number, data: { reason: string }) => {
        const { data: res } = await api.post(`/sales/${id}/refund`, data)
        return res.data
    },
    getInvoice: async (id: number) => {
        const response = await api.get(`/sales/${id}/invoice`, { responseType: 'blob' })
        return response.data
    },
    uploadQrImage: async (id: number, file: File) => {
        const formData = new FormData()
        formData.append('image', file)
        const { data } = await api.post(`/sales/${id}/qr-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return data
    },
    deleteQrImage: async (id: number) => {
        const { data } = await api.delete(`/sales/${id}/qr-image`)
        return data
    }
}

export const CouponsAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/coupons', { params })
        return data
    },
    create: async (data: any) => {
        return await api.post('/coupons', data)
    },
    update: async (id: number, data: any) => {
        return await api.put(`/coupons/${id}`, data)
    },
    delete: async (id: number) => {
        await api.delete(`/coupons/${id}`)
    },
    validate: async (code: string, amount: number, userId?: number) => {
        const { data } = await api.post('/coupons/validate', { code, amount, userId })
        return data
    }
}

export const ContentAPI = {
    get: async () => {
        const { data } = await api.get('/admin/content')
        return data
    },
    update: async (data: any) => {
        const { data: res } = await api.put('/admin/content', data)
        return res
    }
}

export const CommentsAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/comments', { params })
        return data
    },
    moderate: async (id: number, approved: boolean) => {
        const { data } = await api.put(`/comments/${id}/moderate`, { approved })
        return data
    },
    delete: async (id: number) => {
        await api.delete(`/comments/${id}`)
    }
}

export const AdminAPI = {
    getStats: async (params?: any) => {
        const { data } = await api.get('/admin/stats', { params })
        return data.data
    },
    getAuditLogs: async (params?: any) => {
        const { data } = await api.get('/admin/audit', { params })
        return data.data 
    }
}

export const PromosAPI = {
    getDiscounts: async () => {
        const { data } = await api.get('/promos/discounts')
        return data
    },
    createDiscount: async (data: any) => {
        const { data: res } = await api.post('/promos/discounts', data)
        return res
    },
    deleteDiscount: async (id: number) => {
        await api.delete(`/promos/discounts/${id}`)
    },
    updateDiscount: async (id: number, data: any) => {
        const { data: res } = await api.put(`/promos/discounts/${id}`, data)
        return res
    },
    getEvents: async () => {
        const { data } = await api.get('/promos/events')
        return data
    },
    createEvent: async (data: any) => {
        const { data: res } = await api.post('/promos/events', data)
        return res
    },
    updateEvent: async (id: number, data: any) => {
        const { data: res } = await api.put(`/promos/events/${id}`, data)
        return res
    },
    deleteEvent: async (id: number) => {
        await api.delete(`/promos/events/${id}`)
    }
}

export const UploadAPI = {
    upload: async (file: File) => {
        const formData = new FormData()
        formData.append('image', file)
        const { data } = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data.data.url
    }
}

export const SkuAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/skus', { params })
        return data.data
    },
    create: async (data: any) => {
        const { data: res } = await api.post('/skus', data)
        return res.data
    },
    update: async (id: number, data: any) => {
        const { data: res } = await api.put(`/skus/${id}`, data)
        return res.data
    },
    delete: async (id: number) => {
        await api.delete(`/skus/${id}`)
    },
    
    updateStock: async (id: number, quantity: number, type: 'increment' | 'decrement' | 'set') => {
        const { data } = await api.put(`/skus/${id}/stock`, { quantity, type })
        return data.data
    }
}

export const TransfersAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/transfers', { params })
        return data?.data?.data || data?.data || data
    },
    updateStatus: async (id: number, status: 'APPROVED' | 'REJECTED') => {
        const { data } = await api.patch(`/transfers/${id}`, { status })
        return data.data
    }
}

export const BlogAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/blog', { params: { ...params, limit: params?.limit || 500 } })
        return data
    },
    getOne: async (slug: string) => {
        const { data } = await api.get(`/blog/${slug}`)
        return data
    },
    create: async (post: any) => {
        const { data } = await api.post('/blog', post)
        return data
    },
    update: async (id: number, post: any) => {
        const { data } = await api.put(`/blog/${id}`, post)
        return data
    },
    delete: async (id: number) => {
        await api.delete(`/blog/${id}`)
    }
}

export const CurrenciesAPI = {
    getAll: async (active?: boolean) => {
        const { data } = await api.get('/currencies', { params: { active, limit: 500 } })
        return data?.data?.data || data?.data || data
    },
    create: async (currency: any) => {
        const { data } = await api.post('/currencies', currency)
        return data.data
    },
    update: async (id: number, currency: any) => {
        const { data } = await api.put(`/currencies/${id}`, currency)
        return data.data
    },
    delete: async (id: number) => {
        await api.delete(`/currencies/${id}`)
    }
}

export const PurchasesAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/purchases', { params })
        return data
    },
    getOne: async (id: number) => {
        const { data } = await api.get(`/purchases/${id}`)
        return data
    },
    create: async (payload: any) => {
        const { data } = await api.post('/purchases', payload)
        return data
    },
    confirm: async (id: number) => {
        const { data } = await api.post(`/purchases/${id}/confirm`)
        return data
    },
    receive: async (id: number) => {
        const { data } = await api.post(`/purchases/${id}/receive`)
        return data
    },
    cancel: async (id: number) => {
        const { data } = await api.post(`/purchases/${id}/cancel`)
        return data
    }
}

export const SuppliersAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/suppliers', { params })
        return data?.data?.data || data?.data || []
    }
}

export const SupplierPaymentsAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/supplier-payments', { params })
        return data
    },
    create: async (payload: any) => {
        const { data } = await api.post('/supplier-payments', payload)
        return data
    }
}

export const AdminStockAPI = {
    getInventory: async (params?: any) => {
        const { data } = await api.get('/admin/stock/inventory', { params })
        return data
    },
    updateStock: async (skuId: number, quantity: number, type: string) => {
        const { data } = await api.put(`/skus/${skuId}/stock`, { quantity, type })
        return data
    }
}

export const AlertsAPI = {
    getAll: async (params?: any) => {
        const { data } = await api.get('/admin/notifications', { params })
        return data
    }
}

export const RubrosAPI = {
    getAll: async () => {
        const { data } = await api.get('/saas/rubros')
        return data?.data || data
    }
}

export default api

