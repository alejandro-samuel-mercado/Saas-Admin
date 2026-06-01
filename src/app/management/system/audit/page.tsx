"use client"

import { ACTION_LABELS, AuditLog, AuditLogTable } from "@/components/management/system/audit-log-table"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { exportToCSV } from "@/lib/export-utils"
import { cn } from "@/lib/utils"
import { AdminAPI } from "@/services/api"
import { useBranchStore } from "@/store/branch.store"
import { useAuthStore } from "@/store/use-auth-store"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    Calendar as CalendarIcon,
    Download,
    Loader2,
    RefreshCw,
    Search,
    Shield,
    X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState("")
  const [entityType, setEntityType] = useState<string>("ALL")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { activeBranch } = useBranchStore()
  const router = useRouter()
  const currentUserRole = (user?.role?.name || 'EMPLOYEE')

  useEffect(() => {
    if (currentUserRole === 'EMPLOYEE') {
      router.push('/management')
    }
  }, [currentUserRole, router])

  const loadAuditLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search.trim()) params.search = search.trim()
      
      if (entityType && entityType !== "ALL") {
        params.entityType = entityType
      }
      
      if (startDate) params.startDate = startDate.toISOString()
      if (endDate) params.endDate = endDate.toISOString()
      
      params.page = page
      params.limit = 20
      
      if (activeBranch) {
        params.branchId = activeBranch.id
      }
      
      const data = await AdminAPI.getAuditLogs(params)
      setLogs(data.logs || [])
      setTotalPages(data.totalPages || 1)
      setTotalItems(data.totalCount || 0)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de auditoría.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [search, entityType, startDate, endDate, page, activeBranch, toast])

  useEffect(() => {
    setPage(1)
  }, [entityType, startDate, endDate])

  useEffect(() => {
    loadAuditLogs()
  }, [entityType, startDate, endDate, page, loadAuditLogs])

  useEffect(() => {
    const timer = setTimeout(() => {
        setPage(1)
        loadAuditLogs()
    }, 500)
    return () => clearTimeout(timer)
  }, [search, loadAuditLogs])

  const clearFilters = () => {
    setSearch("")
    setEntityType("ALL")
    setStartDate(undefined)
    setEndDate(undefined)
  }

  const activeFiltersCount = [
    entityType !== "ALL",
    startDate !== undefined,
    endDate !== undefined
  ].filter(Boolean).length

  const handleExport = () => {
    const dataToExport = logs.map(log => ({
        Fecha: format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
        Admin: log.admin?.name || "System",
        Accion: ACTION_LABELS[log.action] || log.action,
        Entidad: log.entityType,
        ID_Entidad: log.entityId,
        IP: log.ip || "N/A",
        Cambios: log.changes ? JSON.stringify(log.changes) : "Sin cambios"
    }))
    
    exportToCSV(dataToExport, "auditoria")
    
    toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${logs.length} registros.`
    })
  }

  return (
    <div className="sm:p-8 pt-2 space-y-6 pb-40 sm:pb-20">
     
      <Breadcrumb className="px-2">
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink>Sistema</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink>Auditoría</BreadcrumbLink>
            </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center justify-between px-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
             <Shield className="h-6 w-6" />
             Logs de Auditoría
          </h1>
          <p className="text-muted-foreground">Historial detallado de todas las operaciones administrativas.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="outline"
                className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
                onClick={handleExport}
                disabled={loading || logs.length === 0}
            >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => loadAuditLogs()} 
              disabled={loading} 
              className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end  p-4 rounded-2xl sm:px-0 ">
            {/* Search */}
            <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Buscar Acción / ID</label>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Escribe para buscar..."
                        className="pl-10 pr-4 h-10 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="md:col-span-2 space-y-1.5 ">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Entidad</label>
                <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger className="h-10 bg-white dark:bg-zinc-950 border-slate-400 dark:border-zinc-800 ">
                        <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todas las Entidades</SelectItem>
                        <SelectItem value="PRODUCT">Productos</SelectItem>
                        <SelectItem value="USER">Usuarios / Clientes</SelectItem>
                        <SelectItem value="SALE">Ventas / Pedidos</SelectItem>
                        <SelectItem value="CATEGORY">Categorías</SelectItem>
                        <SelectItem value="STOCK">Stock e Inventario</SelectItem>
                        <SelectItem value="STORE_CONFIG">Configuración del Sistema</SelectItem>
                        <SelectItem value="SUPPLIER">Proveedores</SelectItem>
                        <SelectItem value="COUPON">Cupones de Descuento</SelectItem>
                        <SelectItem value="PROMO_EVENT">Eventos y Campañas</SelectItem>
                        <SelectItem value="DISCOUNT">Reglas de Descuento</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Desde</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full h-10 justify-start text-left font-normal bg-white dark:bg-zinc-950 border-slate-400 dark:border-zinc-800 hover:cursor-pointer",
                                !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-secondary" />
                            {startDate ? format(startDate, "dd/MM/yy", { locale: es }) : "Inicio"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-2" align="start">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Hasta</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full h-10 justify-start text-left font-normal bg-white dark:bg-zinc-950 border-slate-400 dark:border-zinc-800 hover:cursor-pointer",
                                !endDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-secondary" />
                            {endDate ? format(endDate, "dd/MM/yy", { locale: es }) : "Fin"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-2" align="start">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Clear Button */}
            <div className="md:col-span-2 flex items-center justify-end">
                {activeFiltersCount > 0 && (
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearFilters} 
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-bold hover:cursor-pointer"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Limpiar
                    </Button>
                )}
            </div>
        </div>
      </div>

    
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            <p className="text-muted-foreground">Sincronizando registros...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
          <AuditLogTable logs={logs} />
          
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 rounded-2xl border-4 border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="flex items-center text-[11px] font-black text-slate-500 uppercase tracking-wider">
             
                <div className="h-4 w-[1px] bg-slate-200 mx-2" />
                <p>Página {page} de {totalPages}</p>
             </div>

             <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="rounded-xl font-bold uppercase text-[10px] h-9 border-2 hover:cursor-pointer"
                >
                    Anterior
                </Button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        
                        let pageNum = i + 1;
                        if (totalPages > 5 && page > 3) {
                            pageNum = page - 2 + i;
                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                        }
                        if (pageNum <= 0) return null;
                        if (pageNum > totalPages) return null;

                        return (
                            <Button
                                key={pageNum}
                                variant={page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className={cn(
                                    "h-9 w-9 p-0 rounded-xl font-bold text-[11px] hover:cursor-pointer",
                                    page === pageNum ? "bg-secondary shadow-lg shadow-secondary/20" : "border-2"
                                )}
                            >
                                {pageNum}
                            </Button>
                        )
                    })}
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="rounded-xl font-bold uppercase text-[10px] h-9 border-2 hover:cursor-pointer"
                >
                    Siguiente
                </Button>
             </div>

             <p className="text-[10px] italic text-muted-foreground hidden md:block">Actualizado: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      )}
    </div>
  )
}
