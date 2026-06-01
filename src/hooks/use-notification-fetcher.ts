import api from '@/services/api';
import { useBranchStore } from '@/store/branch.store';
import { useNotificationStore } from '@/store/notification.store';
import { useEffect } from 'react';

export function useNotificationFetcher() {
  const { activeBranch } = useBranchStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!activeBranch) return

    const fetchStockAlerts = async () => {
      try {
        const { data } = await api.get('/admin/stock/inventory', {
          params: { 
            branchId: activeBranch.id, 
            lowStock: 'true' 
          }
        })
        
        if (data.success && Array.isArray(data.data)) {
           data.data.forEach((item: any) => {
             const isZero = item.stock <= 0
             const id = `STOCK_${isZero ? 'ZERO' : 'LOW'}_${item.skuId}_${activeBranch.id}`
             
             addNotification({
               id,
               type: isZero ? 'error' : 'warning',
               title: isZero ? 'Stock Crítico (0)' : 'Stock Bajo',
               message: `${item.productName} (${item.variant || 'Standard'}) - Stock: ${item.stock}`,
               link: `/management/stock-control?search=${item.skuCode}`,
               metadata: { skuId: item.skuId, stock: item.stock }
             })
           })
        }
      } catch (error) {
      }
    }

    const fetchMovements = async () => {
      try {
        const { data } = await api.get('/stock-transfers', {
          params: { branchId: activeBranch.id }
        })
      
        if (data.success && Array.isArray(data.data)) {
           data.data.forEach((transfer: any) => {
             
             if (transfer.destinationBranchId === activeBranch.id && transfer.status === 'IN_TRANSIT') {
                const id = `TRANSFER_IN_${transfer.id}`
                addNotification({
                  id,
                  type: 'info',
                  title: 'Transferencia Entrante',
                  message: `Transferencia #${transfer.id} de ${transfer.originBranch?.name}. Items: ${transfer.items?.length}`,
                  link: `/management/transfers`, 
                  metadata: { transferId: transfer.id }
                })
             }

            
             if (transfer.originBranchId === activeBranch.id && transfer.status === 'PENDING') {
                const id = `TRANSFER_REQ_${transfer.id}`
                addNotification({
                  id,
                  type: 'warning',
                  title: 'Solicitud de Transferencia',
                  message: `Solicitud #${transfer.id} para ${transfer.destinationBranch?.name}. Items: ${transfer.items?.length}`,
                  link: `/management/transfers`,
                  metadata: { transferId: transfer.id }
                })
             }
           })
        }
      } catch (error) {
      }
    }

    fetchStockAlerts()
    fetchMovements()

    const interval = setInterval(() => {
       fetchStockAlerts()
       fetchMovements()
    }, 120000)

    return () => clearInterval(interval)
  }, [activeBranch, addNotification])
}

import { useSocket } from './useSocket';

export function useSocketNotifications() {
    const socket = useSocket();
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (!socket) return;

        socket.on('admin_notification', (data: any) => {
       
            if (data.type === 'new_message') return;

            addNotification({
                id: data.id || `socket_${Date.now()}`,
                type: data.type || 'info', 
                title: data.title,
                message: data.message,
                link: data.data?.saleId ? `/management/sales?saleId=${data.data.saleId}` : 
                      data.data?.skuId ? `/management/stock-control?search=${data.data.skuId}` : undefined,
                metadata: data.data
            });
        });

        return () => {
            socket.off('admin_notification');
        };
    }, [socket, addNotification]);
}


export function useErrorInterceptor() {
    const { addNotification } = useNotificationStore()

    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
               
                if (!error.response || error.response.status >= 500) {
                     const id = `SYS_ERR_${Date.now()}` 
                     addNotification({
                         id,
                         type: 'error',
                         title: 'Error del Sistema',
                         message: error.message || 'Error de conexión con el servidor',
                         link: undefined
                     })
                }
                return Promise.reject(error)
            }
        )
      
        return () => {
             api.interceptors.response.eject(interceptor)
        }
    }, [addNotification])
}
