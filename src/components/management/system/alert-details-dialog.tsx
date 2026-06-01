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
import { AlertLog } from "@/services/system-service"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Activity, Bug, Clock, Hash, Terminal } from "lucide-react"

interface AlertDetailsDialogProps {
  alert: AlertLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AlertDetailsDialog({ alert, open, onOpenChange }: AlertDetailsDialogProps) {
  if (!alert) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "destructive"
      case "HIGH": return "orange" 
      case "MEDIUM": return "secondary"
      case "LOW": return "outline"
      default: return "default"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0 border-4 border-secondary/60 dark:border-zinc-800 shadow-2xl rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-950">
        <DialogHeader className="p-8 pb-4 bg-muted/30 border-b-2 border-gray-300 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <Terminal className="h-6 w-6 text-secondary" />
              Caja Negra: Alerta
            </DialogTitle>
            <Badge variant={getSeverityColor(alert.severity) as any} className="px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-lg mr-8">
              {alert.severity}
            </Badge>
          </div>
          <DialogDescription className="mt-2 font-bold text-muted-foreground/70 uppercase text-[10px] tracking-tighter">
            Análisis técnico completo del incidente #{alert.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="space-y-8">
            {/* Cabecera de Datos Rápidos */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Hash className="h-3.5 w-3.5" />
                  ID de Rastreo
                </div>
                <div className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">{alert.code}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Activity className="h-3.5 w-3.5" />
                  Estado Actual
                </div>
                <Badge variant={alert.status === 'OPEN' ? 'destructive' : 'default'} className="font-black text-[10px] uppercase rounded-lg px-2.5">
                  {alert.status === 'OPEN' ? 'Pendiente Crucial' : 'Resuelto'}
                </Badge>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Clock className="h-3.5 w-3.5" />
                  Última Detección
                </div>
                <div className="text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-tighter">{format(new Date(alert.updatedAt), "PPP p", { locale: es })}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Bug className="h-3.5 w-3.5" />
                  Frecuencia de Ocurrencia
                </div>
                <div className="text-xs font-black text-slate-700 dark:text-zinc-200">
                   {alert.occurrences} {alert.occurrences === 1 ? 'REPORTE ÚNICO' : 'REPORTES ACUMULADOS'}
                </div>
              </div>
            </div>

            {/* Mensaje Principal */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 Resumen del Incidente
              </h4>
              <div className="p-6 rounded-[1.5rem] bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-2 border-rose-300 dark:border-rose-900/40 text-sm font-bold leading-relaxed shadow-sm">
                {alert.message}
              </div>
            </div>

            {/* Contexto Técnico (JSON) */}
            {alert.context && Object.keys(alert.context).length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Contexto de Datos (JSON)</h4>
                <div className="p-6 rounded-[1.5rem] bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto shadow-2xl border-2 border-zinc-900">
                  <pre>{JSON.stringify(alert.context, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Seguimiento de Ejecución (Stack Trace) */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 Flujo de Ejecución (Stack Trace)
              </h4>
              {alert.stack ? (
                <div className="p-6 rounded-[1.5rem] bg-slate-900 text-slate-300 font-mono text-[10px] items-start text-left overflow-x-auto border-2 border-slate-800 shadow-inner">
                  <pre className="whitespace-pre-wrap leading-relaxed">{alert.stack}</pre>
                </div>
              ) : (
                <div className="p-8 rounded-[1.5rem] bg-slate-50 dark:bg-zinc-900 text-slate-400 font-black text-[10px] uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-zinc-800 flex items-center justify-center text-center">
                  No se ha capturado información de traza para este registro técnico.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t-2 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 flex justify-end">
           <Button onClick={() => onOpenChange(false)} className="rounded-xl px-10 font-bold uppercase text-xs tracking-widest hover:cursor-pointer">
              Entendido, Cerrar
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
