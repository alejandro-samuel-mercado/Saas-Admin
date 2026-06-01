"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    Activity,
    ArrowRightCircle,
    Calendar,
    Database,
    ExternalLink,
    Layers,
    Package,
    Percent,
    Settings,
    ShoppingCart,
    Tag,
    Terminal,
    Truck,
    User,
    UserCircle
} from "lucide-react"
import { useState } from "react"

export interface AuditLog {
  id: number
  adminId: number
  action: string
  entityType: string
  entityId: string
  changes: any
  ip: string | null
  createdAt: string
  admin: {
    name: string
    email: string
  }
}

interface AuditLogTableProps {
  logs: AuditLog[]
}

export const ACTION_LABELS: Record<string, string> = {
  // Productos
  CREATE_PRODUCT: "Crear Producto",
  UPDATE_PRODUCT: "Actualizar Producto",
  DELETE_PRODUCT: "Eliminar Producto",

  // Usuarios
  UPDATE_USER_PROFILE: "Actualizar Perfil",
  DELETE_USER: "Eliminar Usuario",
  CHANGE_STATUS: "Cambiar Estado",
  VERIFY_IDENTITY: "Verificar Identidad",
  ADJUST_POINTS: "Ajustar Puntos",

  // Categorías
  CREATE_CATEGORY: "Crear Categoría",
  UPDATE_CATEGORY: "Actualizar Categoría",
  DELETE_CATEGORY: "Eliminar Categoría",

  // Ventas
  CREATE_SALE: "Crear Venta",
  CREATE_SALE_POS: "Venta Cliente (POS)",
  UPDATE_DELIVERY_STATUS: "Actualizar Entrega",
  UPDATE_PAYMENT_STATUS: "Actualizar Pago",
  REFUND_SALE: "Reembolsar Venta",
  AUTO_CANCEL_EXPIRED_SALE: "Cancelación Automática",

  // Marketing
  CREATE_EVENT: "Crear Evento",
  UPDATE_EVENT: "Actualizar Evento",
  DELETE_EVENT: "Eliminar Evento",
  CREATE_DISCOUNT: "Crear Descuento",
  UPDATE_DISCOUNT: "Actualizar Descuento",
  DELETE_DISCOUNT: "Eliminar Descuento",
  CREATE_COUPON: "Crear Cupón",
  UPDATE_COUPON: "Actualizar Cupón",
  DELETE_COUPON: "Eliminar Cupón",

  // Stock y Proveedores
  UPDATE_INVENTORY: "Actualizar Stock",
  CREATE_SUPPLIER: "Crear Proveedor",
  UPDATE_SUPPLIER: "Actualizar Proveedor",
  DELETE_SUPPLIER: "Eliminar Proveedor",
  LINK_SKU_SUPPLIER: "Vincular SKU",
  UNLINK_SKU_SUPPLIER: "Desvincular SKU",

  // Configuración
  UPDATE_CONFIG: "Actualizar Configuración",
};

const ENTITY_LABELS: Record<string, string> = {
  PRODUCT: "Producto",
  USER: "Usuario",
  SALE: "Venta",
  CATEGORY: "Categoría",
  STOCK: "Stock",
  STORE_CONFIG: "Configuración",
  SUPPLIER: "Proveedor",
  COUPON: "Cupón",
  PROMO_EVENT: "Evento",
  DISCOUNT: "Descuento",
  PURCHASE: "Compra",
};

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const getActionLabel = (action: string) => ACTION_LABELS[action] || action;
  const getEntityLabel = (type: string) => ENTITY_LABELS[type] || type;

  const getActionColor = (action: string) => {
    if (action.includes("CREATE"))
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (action.includes("DELETE"))
      return "bg-rose-100 text-rose-800 border-rose-200";
    if (action.includes("UPDATE"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getEntityIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PRODUCT': return <Package className="h-4 w-4" />
      case 'USER': return <UserCircle className="h-4 w-4" />
      case 'SALE': return <ShoppingCart className="h-4 w-4" />
      case 'COUPON': return <Tag className="h-4 w-4" />
      case 'STORE_CONFIG': return <Settings className="h-4 w-4" />
      case 'CATEGORY': return <Layers className="h-4 w-4" />
      case 'STOCK': return <Database className="h-4 w-4" />
      case 'SUPPLIER': return <Truck className="h-4 w-4" />
      case 'PROMO_EVENT': return <Calendar className="h-4 w-4" />
      case 'DISCOUNT': return <Percent className="h-4 w-4" />
      case 'PURCHASE': return <ExternalLink className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  return (
    <>
      <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-zinc-900/50">
            <TableRow className="border-b-2 hover:bg-transparent">
              <TableHead className="w-[100px] font-black uppercase text-[11px] tracking-wider py-4 px-6 text-slate-500">ID</TableHead>
              <TableHead className="w-[200px] font-black uppercase text-[11px] tracking-wider text-slate-500">Fecha y Hora</TableHead>
              <TableHead className="w-[220px] font-black uppercase text-[11px] tracking-wider text-slate-500">Usuario Responsable</TableHead>
              <TableHead className="w-[220px] font-black uppercase text-[11px] tracking-wider text-slate-500">Entidad Afectada</TableHead>
              <TableHead className="w-[200px] font-black uppercase text-[11px] tracking-wider text-slate-500">Actividad</TableHead>
              <TableHead className="text-right font-black uppercase text-[11px] tracking-wider py-4 px-6 text-slate-500"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-72 text-center">
                  <div className="flex flex-col items-center justify-center gap-4 opacity-25">
                    <Activity className="h-16 w-16" />
                    <p className="text-xl font-bold uppercase tracking-widest text-slate-400">Sin historial de auditoría</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="group hover:bg-gray-200   hover:cursor-pointer dark:hover:bg-zinc-800/40 transition-all duration-300 border-b border-border  dark:border-zinc-800/50"
                >
                  <TableCell className="px-6 font-black text-slate-400 group-hover:text-secondary transition-colors">
                    #{log.id}
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {log.createdAt ? format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss", { locale: es }) : "N/A"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                           IP: {log.ip || "Interno"}
                        </span>
                     </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-slate-200 dark:border-zinc-700 shadow-sm group-hover:scale-110 transition-transform">
                          <User className="h-4 w-4 text-slate-500" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-none">{log.admin?.name || "SISTEMA"}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-1 lowercase">{log.admin?.email || "system_proc"}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-500 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                          {getEntityIcon(log.entityType)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight leading-none">
                            {getEntityLabel(log.entityType)}
                          </span>
                          <span className="text-[10px] font-black text-secondary mt-1">
                            ID: #{log.entityId}
                          </span>
                        </div>
                      </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`px-3 py-1 text-[11px] font-black rounded-lg border-2 shadow-sm transition-all group-hover:shadow-md ${getActionColor(log.action)} uppercase tracking-tight`}>
                      <Terminal className="h-3.5 w-3.5 mr-2" />
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                     <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedLog(log)}
                        className="h-9 px-4 rounded-xl border-2 border-slate-200 hover:border-secondary hover:bg-secondary/5 hover:text-secondary transition-all font-black text-[11px] uppercase tracking-wider gap-2 shadow-sm hover:cursor-pointer"
                     >
                        Ver Detalles
                        <ArrowRightCircle className="h-4 w-4" />
                     </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

     <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
  <DialogContent
    className="
      w-[95vw]
      max-w-lg
      md:max-w-3xl
      max-h-[90vh]
      overflow-y-auto
      rounded-2xl
      md:rounded-[2.5rem]
      border-4 border-slate-200 dark:border-zinc-800
      p-0
      bg-white dark:bg-zinc-950
    "
  >
    <div className="p-4 md:p-8 border-b-2 bg-slate-50 dark:bg-zinc-900/50">
      <DialogHeader>
        <div className="flex items-start md:items-center gap-4">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center border-2 border-indigo-200 shadow-lg shadow-indigo-500/10 shrink-0">
            <Activity className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-lg md:text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-zinc-100">
              Explorador de Auditoría
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400 tracking-tighter uppercase text-[10px] md:text-[11px] truncate">
              Registro ID #{selectedLog?.id} •{" "}
              {selectedLog?.createdAt
                ? format(
                    new Date(selectedLog?.createdAt),
                    "PPPP 'a las' HH:mm:ss",
                    { locale: es }
                  )
                : ""}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
    </div>

    {selectedLog && (
      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 md:p-5 bg-slate-50 dark:bg-zinc-900 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Acción Realizada
            </p>
            <Badge
              className={`px-4 py-1.5 text-xs font-black rounded-xl border-2 ${getActionColor(
                selectedLog.action
              )}`}
            >
              {getActionLabel(selectedLog.action)}
            </Badge>
          </div>

          <div className="p-4 md:p-5 bg-slate-50 dark:bg-zinc-900 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Referencia de Entidad
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                {getEntityIcon(selectedLog.entityType)}
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase break-words">
                {getEntityLabel(selectedLog.entityType)}{" "}
                <span className="text-secondary">
                  #{selectedLog.entityId}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-1">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-secondary" />
              Datos y Cambios Detectados
            </p>
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase tracking-tighter bg-indigo-50 text-indigo-600 border-indigo-100 w-fit"
            >
              Formato JSON
            </Badge>
          </div>

          <div className="rounded-2xl md:rounded-3xl bg-slate-950 p-4 md:p-6 border-4 border-slate-100 dark:border-zinc-800 shadow-inner max-h-[50vh] md:max-h-[400px] overflow-auto">
            <pre className="text-xs font-medium text-emerald-400 leading-relaxed font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(
                typeof selectedLog.changes === "string"
                  ? JSON.parse(selectedLog.changes)
                  : selectedLog.changes,
                null,
                2
              )}
            </pre>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-slate-200 shrink-0">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Ejecutado por
              </p>
              <p className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase break-words">
                {selectedLog.admin?.name || "Automatización"}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setSelectedLog(null)}
            className="rounded-2xl px-6 md:px-8 font-black uppercase text-xs h-11 md:h-12 shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95 w-full md:w-auto"
          >
            Entendido, Cerrar
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </>
  )
}
