"use client"

import { cn } from "@/lib/utils"
import { useCartStore } from "@/store/cart-store"
import { useAuthStore } from "@/store/use-auth-store"
import { LayoutDashboard, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useConfigStore, useRubro } from "@/store/config.store"

export function FloatingNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  const { isProcessing } = useCartStore()
  const { config } = useConfigStore()
  const rubro = useRubro()
  
  const isSales = pathname?.startsWith("/sales")
  const isAdmin = pathname?.includes("/management")

  const allowPOS = (config?.planInfo?.features?.allowPOS ?? true) && (rubro?.posEnabled ?? true)

  if (!allowPOS) return null

  return (
    <div className={cn(
        "fixed bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center p-1.5 rounded-full bg-white dark:bg-zinc-900 border-3 border-gray-600 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-secondary/50", 
        (isSales || isAdmin) && !isProcessing ? "" : (isProcessing ? "opacity-50 pointer-events-none cursor-not-allowed" : "hidden")
    )}>
      <div className="flex items-center gap-1 relative">
        <Link
          href={isProcessing ? "#" : "/sales"} 
          className={cn(
            "relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300",
            isSales 
              ? "text-white bg-gray-600 shadow-lg ring-2 ring-secondary/20" 
              : "text-zinc-600 hover:text-secondary dark:text-zinc-400 dark:hover:text-secondary-foreground hover:bg-secondary/5 dark:hover:bg-secondary/10"
          )}
          onClick={(e) => isProcessing && e.preventDefault()}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Venta</span>
        </Link>
        <Link
          href={isProcessing ? "#" : "/management"}
          className={cn(
            "relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300",
            isAdmin
              ? "text-white bg-gray-600 shadow-lg ring-2 ring-secondary/20"
              : "text-zinc-600 hover:text-secondary dark:text-zinc-400 dark:hover:text-secondary-foreground hover:bg-secondary/5 dark:hover:bg-secondary/10"
          )}
          onClick={(e) => isProcessing && e.preventDefault()}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Gestión</span>
        </Link>
       
      </div>
    </div>
  )
}
