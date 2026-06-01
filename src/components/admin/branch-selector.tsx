"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import branchService from "@/services/branch.service"
import { useBranchStore } from "@/store/branch.store"
import { useAuthStore } from "@/store/use-auth-store"

interface BranchSelectorProps {
  trigger?: React.ReactNode
}

export function BranchSelector({ trigger }: BranchSelectorProps) {
  const { branches, activeBranch, setBranches, setActiveBranch } = useBranchStore()
  const { isAuthenticated, user } = useAuthStore()
  const [open, setOpen] = React.useState(false)
  const [hasHydrated, setHasHydrated] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = useBranchStore.persist.onFinishHydration(() => {
      setHasHydrated(true)
    })
    
    if (useBranchStore.persist.hasHydrated()) {
      setHasHydrated(true)
    }
    
    return unsubscribe
  }, [])

  React.useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      return
    }
    
    const fetchBranches = async () => {
      try {
        const allBranches = await branchService.getAll()
        
        let visibleBranches = allBranches

        if (user?.role?.name === 'ADMIN') {
            const adminIds = user.adminBranches?.map((as: any) => String(as.branchId)) || []
            visibleBranches = allBranches.filter(b => adminIds.includes(String(b.id)))
        } else if (user?.role?.name === 'EMPLOYEE') {
            if (user.branchId) {
               
                visibleBranches = allBranches.filter(b => b.id == user.branchId)
            } else {
                visibleBranches = []
            }
        }
        
        setBranches(visibleBranches)
        
   
        const isValid = activeBranch && visibleBranches.some(b => b.id == activeBranch.id)

        if (!activeBranch || !isValid) {
           if (visibleBranches.length > 0) {
               setActiveBranch(visibleBranches[0])
           } else {
               setActiveBranch(null)
           }
        }
      } catch (error) {
      }
    }
    
    fetchBranches()
  
  }, [hasHydrated, isAuthenticated]) 

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ? trigger : (
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-auto justify-between bg-white/20 text-white border-white hover:bg-white/10 hover:text-white shadow-none h-8 rounded-full text-xs font-medium px-3 hover:cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="truncate max-w-[120px]">
               {activeBranch ? activeBranch.name : (hasHydrated ? "Todas las sucursales" : "Cargando...")}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[230px] p-0 z-[100] border-slate-200 dark:border-slate-800 dark:bg-slate-950">
        <Command className=" dark:bg-slate-950">
          <CommandInput placeholder="Buscar branch..." className="h-9" />
          <CommandList>  
            <CommandEmpty>No se encontraron branches.</CommandEmpty>
            <CommandGroup>
              {user?.role?.name === 'SUPER_ADMIN' && (
                <CommandItem
                  value="all-branches"
                  className="!opacity-100 !pointer-events-auto cursor-pointer dark:aria-selected:bg-slate-900 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-900"
                  onSelect={() => {
                    setActiveBranch(null)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeBranch === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>Todas las sucursales</span>
                </CommandItem>
              )}
              {(Array.isArray(branches) ? branches : []).map((branch) => (
                <CommandItem
                  key={branch.id}
                  value={branch.name}
                  className="!opacity-100 !pointer-events-auto cursor-pointer  dark:aria-selected:bg-slate-900 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-900"
                  onSelect={(currentValue) => {
                    setActiveBranch(branch)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeBranch?.id === branch.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                      <span>{branch.name}</span>
                      {branch.isHeadquarters && <span className="text-[10px] text-muted-foreground">Sede Central</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
