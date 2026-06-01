"use client";

import { useAuthStore } from "@/store/use-auth-store";
import { UserRole } from "@/types/schema";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook para proteger páginas según el rol del usuario.
 * Redirige a /management si el usuario no tiene el rol requerido.
 * 
 * @param allowedRoles - Roles que tienen acceso a la página
 * @param redirectTo - Ruta a redirigir si no tiene acceso (default: /management)
 * 
 * @example
 * // En una página solo para SUPER_ADMIN y ADMIN:
 * useRequireRole(['SUPER_ADMIN', 'ADMIN'])
 */
export function useRequireRole(
    allowedRoles: UserRole[],
    redirectTo: string = "/management"
) {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const userRole = user?.role?.name as UserRole;
        
        // SUPER_ADMIN siempre tiene acceso
        if (userRole === 'SUPER_ADMIN') return;
        
        if (!allowedRoles.includes(userRole)) {
            router.replace(redirectTo);
        }
    }, [user, isAuthenticated, allowedRoles, redirectTo, router]);

    const userRole = user?.role?.name as UserRole;
    const hasAccess = userRole === 'SUPER_ADMIN' || allowedRoles.includes(userRole);

    return { hasAccess, userRole };
}
