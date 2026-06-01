import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type NotificationType = 'warning' | 'error' | 'info' | 'success'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  read: boolean
  link?: string
  metadata?: any
}

interface NotificationState {
  notifications: AppNotification[]
  dismissedIds: Record<string, number> 

  addNotification: (notification: Omit<AppNotification, 'timestamp' | 'read'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
  
  // Lógica para evitar volver a mostrar alertas descartadas durante un período (ej. 24h)
  cleanupDismissed: () => void 
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      dismissedIds: {},

      addNotification: (notification) => {
        const { notifications, dismissedIds } = get()
        
       
        if (notifications.some(n => n.id === notification.id)) return

        // Verificar si se descartó recientemente (regla opcional para evitar duplicados)
        if (dismissedIds[notification.id]) {
          
           return 
        }

        set({
          notifications: [
            {
              ...notification,
              timestamp: Date.now(),
              read: false,
            },
            ...notifications,
          ],
        })
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          dismissedIds: { ...state.dismissedIds, [id]: Date.now() }
        }))
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },

      clearAll: () => {
        
        const { notifications } = get()
        const newDismissed = { ...get().dismissedIds }
        notifications.forEach(n => newDismissed[n.id] = Date.now())
        
        set({ notifications: [], dismissedIds: newDismissed })
      },
      
      cleanupDismissed: () => {
         // Opcional: Limpiar el historial de descartes más viejo que X días si es necesario
      }
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
    }
  )
)
