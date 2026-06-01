"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { SafeNumericInput } from "@/components/ui/safe-numeric-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InventoryItem, StockControlService } from "@/services/stock-control.service"
import { useConfigStore } from "@/store/config.store"
import { Loader2, Package } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface BulkEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedItems: InventoryItem[]
    onSuccess: () => void
}

type EditMode = 'stock_set' | 'stock_add' | 'stock_subtract' | 'price_set' | 'price_percent'

export function BulkEditDialog({ open, onOpenChange, selectedItems, onSuccess }: BulkEditDialogProps) {
    const [editMode, setEditMode] = useState<EditMode>('stock_add')
    const [value, setValue] = useState('')
    const [loading, setLoading] = useState(false)
    const { config } = useConfigStore()

    const modeLabels: Record<EditMode, string> = {
        stock_set: 'Establecer stock exacto',
        stock_add: 'Agregar al stock',
        stock_subtract: 'Reducir del stock',
        price_set: 'Establecer precio exacto',
        price_percent: 'Ajustar precio (%)',
    }

    const handleApply = async () => {
        if (config?.enableManualStock === false && (editMode.startsWith('stock_'))) {
            toast.error('La edición manual de stock está desactivada')
            return
        }

        const numValue = parseFloat(value)
        if (isNaN(numValue) || value === '') {
            toast.error('Ingresa un valor válido')
            return
        }

        setLoading(true)
        let successCount = 0
        let errorCount = 0

        for (const item of selectedItems) {
            try {
                let updates: { stock?: number; price?: number } = {}

                switch (editMode) {
                    case 'stock_set':
                        updates.stock = Math.max(0, Math.round(numValue))
                        break
                    case 'stock_add':
                        updates.stock = Math.max(0, item.stock + Math.round(numValue))
                        break
                    case 'stock_subtract':
                        updates.stock = Math.max(0, item.stock - Math.round(numValue))
                        break
                    case 'price_set':
                        updates.price = Math.max(0, numValue)
                        break
                    case 'price_percent':
                        const currentPrice = parseFloat(String(item.price))
                        updates.price = Math.max(0, currentPrice * (1 + numValue / 100))
                        break
                }

                await StockControlService.updateInventory(item.id as number, updates)
                successCount++
            } catch {
                errorCount++
            }
        }

        setLoading(false)

        if (successCount > 0) {
            toast.success(`${successCount} producto(s) actualizados correctamente`)
            onSuccess()
            onOpenChange(false)
            setValue('')
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} producto(s) no pudieron actualizarse`)
        }
    }

    const getPlaceholder = () => {
        switch (editMode) {
            case 'stock_set': return 'Ej: 50'
            case 'stock_add': return 'Ej: 10 (suma al stock actual)'
            case 'stock_subtract': return 'Ej: 5 (resta del stock actual)'
            case 'price_set': return 'Ej: 1500.00'
            case 'price_percent': return 'Ej: 10 (sube 10%) o -5 (baja 5%)'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] border-4 border-secondary/60">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-secondary" />
                        Edición Masiva
                    </DialogTitle>
                    <DialogDescription>
                        Aplicar cambios a <strong>{selectedItems.length}</strong> producto(s) seleccionado(s).
                    </DialogDescription>
                </DialogHeader>

                {/* Previsualización de productos seleccionados */}
                <div className="max-h-32 overflow-y-auto rounded-xl border bg-muted/30 p-3 space-y-1">
                    {selectedItems.map(item => (
                        <div key={item.id} className="flex justify-between text-xs">
                            <span className="font-medium truncate max-w-[60%]">{item.productName}</span>
                            <span className="text-muted-foreground font-mono">
                                Stock: {item.stock} | ${item.price}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Tipo de ajuste</Label>
                        <Select value={editMode} onValueChange={(v) => setEditMode(v as EditMode)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stock_add">➕ Agregar al stock</SelectItem>
                                <SelectItem value="stock_subtract">➖ Reducir del stock</SelectItem>
                                <SelectItem value="stock_set">📦 Establecer stock exacto</SelectItem>
                                <SelectItem value="price_set">💰 Establecer precio exacto</SelectItem>
                                <SelectItem value="price_percent">📊 Ajustar precio por %</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Valor — <span className="text-muted-foreground font-normal">{modeLabels[editMode]}</span></Label>
                        <SafeNumericInput
                            placeholder={getPlaceholder()}
                            value={parseFloat(value) || 0}
                            onChange={(val) => setValue(String(val))}
                            onStringChange={setValue}
                            className="text-lg font-mono"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="hover:cursor-pointer">
                        Cancelar
                    </Button>
                    <Button onClick={handleApply} disabled={loading || !value || selectedItems.length === 0} className="hover:cursor-pointer">
                        {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aplicando...</>
                        ) : (
                            `Aplicar a ${selectedItems.length} producto(s)`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
