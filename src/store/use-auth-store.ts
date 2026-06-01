import { User, UserRole } from '@/types/schema'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    login: (user: User, token: string) => void
    logout: () => void
    hasRole: (roles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            hasRole: (roles) => {
                const currentUser = get().user
                const currentRole = currentUser?.role?.name as UserRole
                if (!currentUser) return false
                if (currentRole === 'SUPER_ADMIN') return true
                return roles.includes(currentRole)
            }
        }),
        {
            name: 'admin-auth-storage',
            storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
            })),
        }
    )
)
