"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { SafeNumericInput } from "@/components/ui/safe-numeric-input"
import { useToast } from "@/components/ui/use-toast"
import { InventoryItem, StockControlService, formatStock, getUnitLabel } from "@/services/stock-control.service"
import { useConfigStore } from "@/store/config.store"
import { Loader2, Minus, Plus, Scale } from "lucide-react"
import { useEffect, useState } from "react"

interface StockAdjustmentDialogProps {
  item: InventoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type AdjustMode = 'set' | 'add' | 'subtract'

export function StockAdjustmentDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [mode, setMode] = useState<AdjustMode>('set')
  const [value, setValue] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { config } = useConfigStore()

  const isFractional = item?.allowFractional ?? false
  const unit = item?.measurementUnit ?? 'UNIDAD'
  const unitLabel = getUnitLabel(unit)
  const step = isFractional ? '0.001' : '1'

  useEffect(() => {
    if (item && open) {
      setMode('set')
      setValue(String(item.stock))
    }
  }, [item, open])

  const computeResult = (): number | null => {
    const v = parseFloat(value)
    if (isNaN(v) || v < 0) return null
    const current = item?.stock ?? 0
    if (mode === 'set') return v
    if (mode === 'add') return current + v
    if (mode === 'subtract') return Math.max(0, current - v)
    return null
  }

  const resultStock = computeResult()

  const handleAdjust = async () => {
    if (!item) return

    if (config?.enableManualStock === false) {
        toast({
            title: "Acción no permitida",
            description: "La edición manual de stock está desactivada en la configuración globlal.",
            variant: "destructive",
        })
        return
    }

    const newStock = computeResult()
    if (newStock === null || newStock < 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa una cantidad válida (mínimo 0).",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await StockControlService.updateInventory(item.id as number, { stock: newStock })
      toast({
        title: "Stock actualizado",
        description: `${item.productName}: ${formatStock(newStock, unit)}`,
      })
      onSuccess()
      onOpenChange(false)
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar el stock.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] border-4 border-secondary/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-secondary" />
            Ajuste de Stock
          </DialogTitle>
          <DialogDescription>
            <strong>{item?.productName}</strong>
            {item?.variant ? ` · ${item.variant}` : ''} — SKU: {item?.skuCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
        
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Unidad de medida:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {unit} ({unitLabel})
            </Badge>
            {isFractional && (
              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                Fraccionable
              </Badge>
            )}
          </div>

          {/* Stock actual */}
          <div className="bg-muted/40 rounded-xl p-4 flex items-center justify-between border border-border">
            <span className="text-sm font-medium text-muted-foreground">Stock actual</span>
            <span className="text-2xl font-bold text-foreground">
              {item ? formatStock(item.stock, unit) : '-'}
            </span>
          </div>

          {/* Selector de tipo de ajuste */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Tipo de ajuste
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'set', label: 'Establecer', icon: null },
                { key: 'add', label: 'Agregar', icon: <Plus className="h-3.5 w-3.5" /> },
                { key: 'subtract', label: 'Reducir', icon: <Minus className="h-3.5 w-3.5" /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setMode(key); setValue('') }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all hover:cursor-pointer  ${
                    mode === key
                      ? 'bg-secondary text-secondary-foreground border-secondary shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:border-secondary/50 hover:text-foreground'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="stock-value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              {mode === 'set' ? 'Nuevo stock' : mode === 'add' ? 'Cantidad a agregar' : 'Cantidad a reducir'}
            </Label>
            <div className="relative">
              <SafeNumericInput
                id="stock-value"
                value={parseFloat(value) || 0}
                onChange={(val) => setValue(String(val))}
                onStringChange={setValue}
                className="pr-14 text-lg font-semibold rounded-xl"
                placeholder={isFractional ? 'Ej: 2.500' : 'Ej: 50'}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                {unitLabel}
              </span>
            </div>
            {isFractional && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Podés ingresar hasta 3 decimales. Ej: 1.250 = 1 kg 250 g
              </p>
            )}
          </div>

          {/* Previsualización del resultado */}
          {resultStock !== null && (
            <div className={`rounded-xl p-3 border flex items-center justify-between ${
              resultStock === 0
                ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                : resultStock < (item?.minStock ?? 0)
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'
                  : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'
            }`}>
              <span className="text-sm font-medium text-muted-foreground">Stock resultante</span>
              <div className="text-right">
                <span className={`text-xl font-bold ${
                  resultStock === 0 ? 'text-red-600 dark:text-red-400'
                  : resultStock < (item?.minStock ?? 0) ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {formatStock(resultStock, unit)}
                </span>
                {resultStock < (item?.minStock ?? 0) && resultStock > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Por debajo del mínimo ({formatStock(item!.minStock, unit)})
                  </p>
                )}
                {resultStock === 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400">Stock agotado</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="hover:cursor-pointer">
            Cancelar
          </Button>
          <Button onClick={handleAdjust} disabled={loading || value === '' || resultStock === null} className="hover:cursor-pointer">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
