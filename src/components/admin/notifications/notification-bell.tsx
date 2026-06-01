"use client"

import { AlertOctagon, AlertTriangle, Bell, CheckCircle, Info, X } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
 
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { AppNotification, useNotificationStore } from "@/store/notification.store"

export function NotificationBell({ title }: { title?: string }) {
  const { notifications, removeNotification, markAsRead, clearAll } = useNotificationStore()
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  const unreadCount = notifications.length 
  
  const handleItemClick = (notification: AppNotification) => {
     if (notification.link) {
         setOpen(false)
         router.push(notification.link)
     }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild title={title}>
        <Button variant="ghost" size="icon" className="relative text-white/70  hover:text-white px-2 hover:cursor-pointer hover:bg-white/10 rounded-full h-10 w-10">
          <Bell className="h-7 w-7" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-zinc-950" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 border-zinc-700 bg-zinc-700 text-zinc-100" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h4 className="font-semibold text-sm">Notificaciones ({unreadCount})</h4>
          {unreadCount > 0 && (
             <Button variant="ghost" size="sm" onClick={() => clearAll()} className="hover:cursor-pointer h-auto px-2 text-xs text-zinc-400 hover:text-white">
                 Limpiar todo
             </Button>
          )}
        </div>
      <div className="h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div 
                   key={n.id} 
                   className={cn(
                       "relative flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer group",
                       n.type === 'error' && "border-l-2 border-l-red-500",
                       n.type === 'warning' && "border-l-2 border-l-yellow-500",
                       n.type === 'info' && "border-l-2 border-l-blue-500"
                   )}
                   onClick={() => handleItemClick(n)}
                >
                    <div className="mt-0.5 shrink-0">
                       {n.type === 'error' && <AlertOctagon className="h-4 w-4 text-red-500" />}
                       {n.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                       {n.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                       {n.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{n.title}</p>
                        <p className="text-xs text-zinc-400 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-zinc-600">
                            {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-zinc-500 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(n.id)
                        }}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
