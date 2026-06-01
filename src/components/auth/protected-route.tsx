"use client"

import { useAuthStore } from "@/store/use-auth-store"
import { ArrowLeft, LayoutDashboard, Loader2, ShieldAlert } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useConfigStore } from "@/store/config.store"
import { adminNavigation } from "@/config/admin-navigation"

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRoles?: string[]
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        setTimeout(() => setHydrated(true), 0)
    }, [])

    const userRole = user?.role?.name || ''
    const { config } = useConfigStore()


    const isRBACAuthorized = () => {
        if (!userRole || userRole === 'SUPER_ADMIN') return true;


        let permissionKey: string | undefined;
        const isPathMatch = (href?: string) => {
            if (!href) return false;

            const targetPath = href.split('?')[0];
            if (targetPath === '/management') return pathname === '/management';
            return pathname === targetPath || pathname.startsWith(targetPath + '/');
        };

        for (const item of adminNavigation) {
            if (isPathMatch(item.href)) {
                permissionKey = item.permissionKey;
                break;
            }
            if (item.children) {
                const child = item.children.find(c => isPathMatch(c.href));
                if (child) {
                    permissionKey = child.permissionKey || item.permissionKey;
                    break;
                }
            }
        }

        if (permissionKey) {
            const rolePerms = config?.rolePermissions?.[userRole.toUpperCase()];
            if (rolePerms && rolePerms[permissionKey] === false) {
                return false;
            }
        }

        return true;
    };

    const isPlanAuthorized = () => {
        if (!config?.planInfo?.enabledModules) return true; // Si no hay info del plan, permite el acceso por defecto o delega en RBAC

        let moduleKey: string | undefined;
        const isPathMatch = (href?: string) => {
            if (!href) return false;

            const targetPath = href.split('?')[0];
            if (targetPath === '/management') return pathname === '/management';
            return pathname === targetPath || pathname.startsWith(targetPath + '/');
        };

        for (const item of adminNavigation) {
            if (isPathMatch(item.href)) {
                moduleKey = item.moduleKey;
                break;
            }
            if (item.children) {
                const child = item.children.find(c => isPathMatch(c.href));
                if (child) {
                    moduleKey = child.moduleKey || item.moduleKey;
                    break;
                }
            }
        }

        // Explicit POS check for the /sales application route
        if (pathname === '/sales' || pathname.startsWith('/sales/')) {
            if (config?.planInfo && config.planInfo.features?.allowPOS === false) {
                return false;
            }
        }

        if (moduleKey) {
            if (moduleKey === 'pos') {
                if (config?.planInfo && config.planInfo.features?.allowPOS === false) {
                    return false;
                }
            } else if (!config.planInfo.enabledModules.includes(moduleKey)) {
                return false;
            }
        }

        return true;
    };

    const isAuthorized = (!requiredRoles || (userRole && requiredRoles.includes(userRole))) && isRBACAuthorized() && isPlanAuthorized();

    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            const returnUrl = encodeURIComponent(pathname)
            router.replace(`/login?returnUrl=${returnUrl}`)
        }
    }, [isAuthenticated, hydrated, router, pathname])

    // 1. Estado de Carga Inicial (Antes de la Hidratación)
    if (!hydrated) {
        return (
            <div className="fixed inset-0 w-full flex flex-col items-center justify-center bg-background text-foreground gap-4 z-[100] overflow-hidden">
                <Loader2 className="h-12 w-12 animate-spin text-secondary" />
                <p className="text-muted-foreground font-medium animate-pulse">Verificando sesión...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    if (!isAuthorized) {
        return (
            <div className="fixed inset-0 w-full flex flex-col items-center justify-center bg-background text-foreground gap-1 z-[100] px-4">
                <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4 animate-bounce">
                    <ShieldAlert className="w-16 h-16" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Acceso Denegado</h1>
                <p className="text-muted-foreground text-center max-w-md text-lg mb-6">
                    No tienes los permisos configurados para acceder a esta sección del panel administrativo, o el módulo no está incluido en tu plan actual.
                    <br />
                    <span className="text-sm opacity-80 mt-2 block italic">
                        Rol asignado: <span className="font-mono bg-muted px-2 py-0.5 rounded border">{userRole == "EMPLOYEE" ? "EMPLEADO" : userRole == "ADMIN" ? "ADMINISTRADOR" : userRole == "SUPER_ADMIN" ? "SUPER ADMINISTRADOR" : "USUARIO"}</span>
                    </span>
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver Atrás
                    </button>


                </div>

                <p className="mt-12 text-xs text-gray-600 opacity-80">
                    Si crees que esto es un error, contacta con el Super Administrador.
                </p>
            </div>
        )
    }

    return <>{children}</>
}
