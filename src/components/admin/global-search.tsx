"use client"

import {
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
   CommandSeparator,
} from "@/components/ui/command"
import { adminNavigation } from "@/config/admin-navigation"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useAuthStore } from "@/store/use-auth-store"
import { useConfigStore } from "@/store/config.store"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { user } = useAuthStore()
  const { config } = useConfigStore()
  const userRole = (user?.role?.name || 'EMPLOYEE') as string

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    setTimeout(() => {
        command()
    }, 150)
  }, [])


  const flatItems = React.useMemo(() => {
    const items: { title: string; href: string; icon: any }[] = []
    
    const traverse = (navItems: typeof adminNavigation) => {
        navItems.forEach(item => {
            if (item.hidden) return;
            if (item.roles && !item.roles.includes(userRole as any)) return;

            // RBAC Check
            if (userRole.toUpperCase() !== 'SUPER_ADMIN' && item.permissionKey) {
                const rolePerms = config?.rolePermissions?.[userRole.toUpperCase()];
                if (rolePerms && rolePerms[item.permissionKey] === false) {
                    return;
                }
            }

            // Plan Modules Check
            if (item.moduleKey && config?.planInfo?.enabledModules) {
                if (!config.planInfo.enabledModules.includes(item.moduleKey)) {
                    return;
                }
            }

            // Custom Condition
            if (item.condition && !item.condition(config)) {
                return;
            }

            if (item.href) {
                items.push({ title: item.title, href: item.href, icon: item.icon })
            }
            if (item.children) {
                traverse(item.children)
            }
        })
    }
    traverse(adminNavigation)
    return items
  }, [userRole, config])


  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative h-10 w-full justify-start rounded-full bg-gray-200/50  dark:bg-secondary/50 text-sm font-medium text-slate-500 dark:text-zinc-400 shadow-sm sm:pr-12 max-md:w-64 max-lg:w-30 max-xl:w-70 max-lg:-ml-4 border-slate-200 dark:border-zinc-700 px-4 py-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-foreground hover:border-slate-400 dark:hover:border-zinc-600 transition-all duration-300 hover:cursor-pointer group "
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500 group-hover:text-primary transition-colors" />
        <span className="hidden max-xl:text-[0.9rem] lg:inline-flex tracking-wide">Buscar en el sistema...</span>
        <span className="inline-flex lg:hidden tracking-wide">Buscar...</span>
      
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Escribe para buscar..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Navegación">
            {flatItems.map((item) => (
                <CommandItem
                key={item.href}
                value={`${item.title} ${item.href}`.toLowerCase()}
               
                onSelect={() => {
                  runCommand(() => router.push(item.href))
                }}
                className="hover:cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span className="text-gray-800">{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </CommandDialog>
    </>
  )
}
