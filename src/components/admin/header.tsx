"use client"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useConfigStore } from "@/store/config.store"
import { useAuthStore } from "@/store/use-auth-store"
import { LogOut, Menu, ShieldCheck, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { BranchSelector } from "./branch-selector"
import { GlobalSearch } from "./global-search"
import { NotificationBell } from "./notifications/notification-bell"
import { Sidebar } from "./sidebar"
import { SystemHealth } from "./system-health"

export function Header() {
    const { user, logout } = useAuthStore()
    const { config } = useConfigStore()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

    const handleLogout = () => {
        logout()
        router.push('/login')
    }
    
    const userRole = (user?.role?.name || 'EMPLOYEE') as string
    const enabledModules = config?.planInfo?.enabledModules || []
    const maxBranches = config?.planInfo?.usage?.maxBranches ?? 1

    const showBranches = enabledModules.includes('branches') && maxBranches > 1 && (config?.enableBranches ?? true)
    const showAlerts = enabledModules.includes('alerts') && config?.rolePermissions?.[userRole.toUpperCase()]?.alerts !== false
    const showAudit = enabledModules.includes('audit') && userRole.toUpperCase() !== 'EMPLOYEE' && config?.rolePermissions?.[userRole.toUpperCase()]?.audit !== false

    return (
        <header className="h-20 md:h-24 bg-transparent sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between gap-4 shrink-0">
        
             <div className="flex items-center gap-4 flex-1">
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="     p-0
    border-none
    w-72
    bg-primary
">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Navegación del Panel de Administración</SheetTitle>
                        </SheetHeader>
                        <Sidebar className="flex w-full h-full" onClose={() => setIsSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>
                <div className="flex-1 max-w-xl hidden md:block">
                    <GlobalSearch />
                </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-6 text-white max-lg:gap-4 ">
                {showBranches && (
                     <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Sucursal Actual</span>
                        <div className="scale-90 origin-right text-white [&_button]:text-white">
                             <BranchSelector />
                        </div>
                    </div>
                )}
                {showAlerts && (
                    <div className="hidden min-[500px]:flex flex-col items-center">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Alertas</span>
                        <div className="scale-90 origin-right text-white [&_button]:text-white">
                        <SystemHealth />
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-1 sm:gap-2">
                     {showAudit && (
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white/70 hover:cursor-pointer hover:text-white hover:bg-white/10 rounded-full"
                            onClick={() => router.push('/management/system/audit')}
                            title="Logs de Auditoría"
                         >
                            <ShieldCheck className="h-5 w-5" />
                         </Button>
                     )}
                     <ModeToggle title="Temas" />
                     <NotificationBell title="Notificaciones" />
                </div>
                
                <div className="flex items-center gap-4 pl-4 md:pl-0 xl:pl-6 ml-2 xl:-ml-2 border-l border-gray-700">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-white leading-none">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-gray-300 mt-1 font-medium">{userRole==="SUPER_ADMIN"?"SUPER ADMIN":userRole==="ADMIN"?"ADMINISTRADOR":userRole==="EMPLOYEE"?"EMPLEADO":userRole===""}</p>
                    </div>
                     <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 ring-2 ring-white/10">
                        {user?.name?.substring(0,2).toUpperCase() || <User className="h-5 w-5"/>}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-400 hover:cursor-pointer hover:text-white hover:bg-white/10 rounded-full"
                        title="Cerrar Sesión"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
