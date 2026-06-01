import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Branch } from '../types/schema';

interface BranchState {
  branches: Branch[];
  activeBranch: Branch | null;
  isLoading: boolean;
  
  setBranches: (branches: Branch[]) => void;
  setActiveBranch: (branch: Branch | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      branches: [],
      activeBranch: null,
      isLoading: false,

      setBranches: (branches) => set({ branches }),
      setActiveBranch: (branch) => set({ activeBranch: branch }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'branch-storage', 
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
      partialize: (state) => ({ activeBranch: state.activeBranch }), 
    }
  )
);
