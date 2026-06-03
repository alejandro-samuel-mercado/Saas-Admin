"use client"

import { Button } from "@/components/ui/button"
import { adminNavigation } from "@/config/admin-navigation"
import { useErrorInterceptor, useNotificationFetcher, useSocketNotifications } from "@/hooks/use-notification-fetcher"
import { cn, getDynamicLabel } from "@/lib/utils"
import { useConfigStore, useRubro } from "@/store/config.store"
import { useAuthStore } from "@/store/use-auth-store"
import { UserRole } from "@/types/schema"
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BranchSelector } from "./branch-selector"
import { GlobalSearch } from "./global-search"
import { SystemHealth } from "./system-health"

interface SidebarProps {
    className?: string
    onClose?: () => void
}

export function Sidebar({ className, onClose }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const { config, fetchConfig } = useConfigStore()
    const rubro = useRubro()
    const [collapsed, setCollapsed] = useState(false)
    const [openMenus, setOpenMenus] = useState<string[]>([]) 
    const userRole = (user?.role?.name || 'EMPLOYEE') as UserRole

    useEffect(() => {
        fetchConfig()
    }, [fetchConfig])

  
    useNotificationFetcher()
    useSocketNotifications()
    useErrorInterceptor()

    const toggleMenu = (title: string) => {
        if (collapsed) return;
        setOpenMenus(prev => 
            prev.includes(title) 
                ? prev.filter(t => t !== title) 
                : [...prev, title]
        )
    }

    const filteredMenu = adminNavigation.map(item => {
        const clonedItem = { ...item };
        if (clonedItem.children) {
            clonedItem.children = [...clonedItem.children];
        }
        return clonedItem;
    }).filter(item => {
        if (item.hidden) return false;
        if (item.roles && !item.roles.includes(userRole as any)) return false;
        
        // RBAC Check
        if (userRole !== 'SUPER_ADMIN' && item.permissionKey) {
            const rolePerms = config?.rolePermissions?.[userRole.toUpperCase()];
            if (rolePerms && rolePerms[item.permissionKey] === false) {
                return false;
            }
        }

        // Plan Modules Check
        if (item.moduleKey && config?.planInfo?.enabledModules) {
            if (!config.planInfo.enabledModules.includes(item.moduleKey)) {
                return false;
            }
        }

        // Rubro Modules Check — ocultar módulos deshabilitados para este rubro
        if (item.moduleKey && rubro?.disabledModules?.length) {
            if (rubro.disabledModules.includes(item.moduleKey)) {
                return false;
            }
        }

        if (item.condition && !item.condition(config)) {
            return false;
        }

        // Filter children if they exist
        if (item.children) {
            item.children = item.children.filter(child => {
                if (child.hidden) return false;
                if (child.roles && !child.roles.includes(userRole as any)) return false;
                
                if (userRole !== 'SUPER_ADMIN' && child.permissionKey) {
                    const rolePerms = config?.rolePermissions?.[userRole.toUpperCase()];
                    if (rolePerms && rolePerms[child.permissionKey] === false) {
                        return false;
                    }
                }
                
                if (child.moduleKey && config?.planInfo?.enabledModules) {
                    if (!config.planInfo.enabledModules.includes(child.moduleKey)) {
                        return false;
                    }
                }

                // Rubro Modules Check for children
                if (child.moduleKey && rubro?.disabledModules?.length) {
                    if (rubro.disabledModules.includes(child.moduleKey)) {
                        return false;
                    }
                }

                if (child.condition && !child.condition(config)) {
                    return false;
                }
                
                return true;
            });
            
            // If all children were filtered out and it's just a grouping item (no href of its own), hide it
            if (item.children.length === 0 && !item.href) {
                return false;
            }
        }

        return true;
    });

    return (
        <aside className={cn(
            "h-[100dvh] flex flex-col transition-all duration-300 ease-linear z-50 relative",
            "bg-primary text-white", 
            collapsed ? "w-20" : "w-72",
            className
        )}>
            {/* Header */}
            <div className={cn(
                "h-20 flex items-center justify-between px-6 transition-all duration-300 ease-linear relative",
                "bg-primary", 
                collapsed && "justify-center px-2"
            )}>
                {!collapsed ? (
                    <div className="flex items-center gap-2 max-w-[calc(100%-2.5rem)]">
                        {config?.logoUrl ? (
                            <img src={config.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded-lg bg-white p-0.5 shrink-0" />
                        ) : (
                            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg text-white shrink-0">
                                {config?.storeName?.charAt(0) || 'A'}
                            </div>
                        )}
                        <span className="font-bold text-xl tracking-tight text-white truncate">{config?.storeName || 'AdminPanel'}</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center">
                        {config?.logoUrl ? (
                            <img src={config.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-lg bg-white p-0.5 shrink-0" />
                        ) : (
                            <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl text-white shrink-0">
                                {config?.storeName?.charAt(0) || 'A'}
                            </div>
                        )}
                    </div>
                )}
                
                <div className={cn(
                    "flex items-center transition-all",
                    collapsed 
                        ? "absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 bg-primary border border-white/20 rounded-full shadow-lg h-7 w-7 justify-center" 
                        : "ml-auto"
                )}>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "text-white/70 hover:cursor-pointer hover:text-white hover:bg-white/10 rounded-full",
                            collapsed ? "h-6 w-6" : "h-8 w-8"
                        )}
                        onClick={() => {
                            if (onClose) {
                                onClose()
                            } else {
                                setCollapsed(!collapsed)
                            }
                        }}
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto overflow-x-hidden px-4 custom-scrollbar">
                <div className="md:hidden w-[80%] pl-4 pb-4">
                    <GlobalSearch />
                </div>
                {(config?.enableBranches ?? true) && (
                    <div className="md:hidden w-full flex flex-col items-start pb-4">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 pb-1">Sucursal Actual</span>
                        <div className="scale-90 origin-left text-white [&_button]:text-white w-full">
                            <BranchSelector />
                        </div>
                    </div>
                )}
                {config?.rolePermissions?.[userRole]?.alerts !== false && (
                    <div className="min-[500px]:hidden w-full flex flex-col items-start pb-4">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 pb-1">Alertas</span>
                        <div className="scale-90 origin-left text-white [&_button]:text-white">
                            <SystemHealth />
                        </div>
                    </div>
                )}
                {filteredMenu.map((item) => {
                    const isChildrenActive = item.children?.some(child => pathname === child.href);
                    const isActive = pathname === item.href || isChildrenActive;
                    const isOpen = openMenus.includes(item.title);

                    if (item.children && !collapsed) {
                        return (
                            <div key={item.title} className="space-y-1">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-between font-medium px-3 h-10  text-[0.95rem] rounded-xl    transition-all",
                                        "hover:bg-white/10 hover:cursor-pointer hover:text-white", 
                                        "text-white/70", 
                                        isActive && "text-white bg-white/10" 
                                    )}
                                    onClick={() => toggleMenu(item.title)}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/70")} />
                                        <span>{getDynamicLabel(item.title, rubro?.slug)}</span>
                                    </div>
                                    {isOpen ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
                                </Button>
                                
                                {isOpen && (
                                    <div className="space-y-1 relative before:absolute before:left-[1.65rem] before:top-0 before:bottom-0 before:w-[1px] before:bg-white/10 ml-2">
                                        {item.children.filter(child => {
                                            if (child.hidden) return false;
                                            if (child.roles && !child.roles.includes(userRole as any)) return false;

                                            // RBAC Check for children
                                            if (userRole.toUpperCase() !== 'SUPER_ADMIN' && child.permissionKey) {
                                                const rolePerms = config?.rolePermissions?.[userRole.toUpperCase()];
                                                if (rolePerms && rolePerms[child.permissionKey] === false) {
                                                    return false;
                                                }
                                            }

                                            return true;
                                        }).map(child => {
                                            const isChildActive = pathname === child.href;
                                            return (
                                            <Link key={child.title} href={child.href!} className="block pl-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "w-full justify-start font-normal h-12 pl-8 hover:cursor-pointer rounded-lg relative overflow-hidden",
                                                        "hover:bg-white/5 hover:text-white text-white/60",
                                                        isChildActive && "text-white font-medium bg-none" 
                                                    )}
                                                >
                                                    
                                                    {isChildActive && (
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white"></span>
                                                    )}
                                                    <span className={cn("transition-transform", isChildActive && "translate-x-1")}>{getDynamicLabel(child.title, rubro?.slug)}</span>
                                                </Button>
                                            </Link>
                                        )})}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <Link 
                            key={item.title}
                            href={item.href || '#'}
                            className={cn(
                                "flex items-center gap-3  px-3 h-16 py-4 rounded-xl transition-all text-[0.95rem] font-medium group relative overflow-hidden ",
                                "hover:bg-white/10 hover:text-white",
                                isActive 
                                    ? "bg-white/20 text-white shadow-sm" 
                                    : "text-white/70",
                                collapsed && "justify-center px-0 h-12"
                            )}
                            title={collapsed ? item.title : undefined}
                        >
                            <item.icon className={cn(
                                "shrink-0 transition-all duration-300 ease-linear", 
                                collapsed ? "w-6 h-6" : "w-5 h-5",
                                isActive ? "text-white" : "text-white/70 group-hover:text-white"
                            )} />
                            {!collapsed && <span>{getDynamicLabel(item.title, rubro?.slug)}</span>}
                            
                            {collapsed && isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white rounded-r-md"></div>
                            )}
                        </Link>
                    )
                })}
            </nav>


        </aside>
    )
}
