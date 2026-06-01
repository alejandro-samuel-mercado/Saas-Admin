import { ConfigAPI } from '@/services/api';
import { Rubro } from '@/types/schema';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { StoreConfig } from '../types/extended';

interface ConfigState {
  config: Partial<StoreConfig> | null;
  isLoading: boolean;
  
  setConfig: (config: Partial<StoreConfig>) => void;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: Partial<StoreConfig>) => Promise<void>;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      config: null,
      isLoading: false,

      setConfig: (config) => set({ config }),
      
      fetchConfig: async () => {
        set({ isLoading: true });
        try {
          const data = await ConfigAPI.get({ t: Date.now() });
          set({ config: data, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      updateConfig: async (newConfig) => {
        try {
            
            const current = get().config;
            set({ config: { ...current, ...newConfig } });
            
            await ConfigAPI.update(newConfig);
           
        } catch (error) {
           
            get().fetchConfig(); 
            throw error;
        }
      }
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
    }
  )
);

/** Hook derivado: accede al rubro actual del tenant */
export const useRubro = (): Rubro | null | undefined =>
  useConfigStore((s) => s.config?.rubro);

/** Helper: verifica si un módulo está deshabilitado para el rubro actual */
export const useIsModuleDisabled = (moduleKey: string): boolean => {
  const rubro = useRubro();
  return rubro?.disabledModules?.includes(moduleKey) ?? false;
};

