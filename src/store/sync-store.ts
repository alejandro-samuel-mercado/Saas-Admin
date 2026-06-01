import { Category, Product, Sale, User } from '@/types/schema';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DataState {
  products: Product[]; 
  categories: Category[];
  users: User[];
  lastSync: string | null;
  
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setUsers: (users: User[]) => void;
  setLastSync: (date: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      products: [],
      categories: [],
      users: [],
      lastSync: null,
      
      setProducts: (products:any) => set({ products: Array.isArray(products) ? products : [] }),
      setCategories: (categories:any) => set({ categories: Array.isArray(categories) ? categories : [] }),
      setUsers: (users:any) => set({ users: Array.isArray(users) ? users : [] }),
      setLastSync: (lastSync:any) => set({ lastSync }),
    }),
    {
      name: 'offline-data-storage',
      version: 1,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
    }
  ) as any
)

interface SyncState {
  pendingSales: Sale[]; 
  isOnline: boolean;
  
  addPendingSale: (sale: Sale) => void;
  removePendingSale: (tempId: string) => void; 
  setOnlineStatus: (status: boolean) => void;
  clearPendingSales: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      pendingSales: [],
      isOnline: true,
      
      addPendingSale: (sale:any) => set((state:any) => ({ 
        pendingSales: [...state.pendingSales, sale] 
      })),
      
      removePendingSale: (uuid:any) => set((state:any) => ({
        pendingSales: state.pendingSales.filter((s:any) => s.uuid !== uuid)
      })),
      
      setOnlineStatus: (isOnline:any) => set({ isOnline }),
      
      clearPendingSales: () => set({ pendingSales: [] }),
    }),
    {
      name: 'sync-queue-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
    }
  ) as any
)
