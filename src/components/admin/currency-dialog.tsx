"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { CurrenciesAPI } from "@/services/api"
import { Currency } from "@/types/schema"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface CurrencyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currency: Currency | null
    onSuccess: () => void
}

export function CurrencyDialog({ open, onOpenChange, currency, onSuccess }: CurrencyDialogProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        code: "",
        symbol: "",
        exchangeRateToBase: 1,
        isActive: true,
    })

    useEffect(() => {
        if (currency) {
            setFormData({
                code: currency.code,
                symbol: currency.symbol,
                exchangeRateToBase: currency.exchangeRateToBase,
                isActive: currency.isActive,
            })
        } else {
            setFormData({
                code: "",
                symbol: "",
                exchangeRateToBase: 1,
                isActive: true,
            })
        }
    }, [currency, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (currency) {
                await CurrenciesAPI.update(currency.id, formData)
                toast({ title: "Moneda actualizada" })
            } else {
                await CurrenciesAPI.create(formData)
                toast({ title: "Moneda creada" })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast({ 
                title: "Error", 
                description: error.response?.data?.message || "No se pudo guardar la moneda", 
                variant: "destructive" 
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]  border-4 border-secondary/60">
                <DialogHeader>
                    <DialogTitle>{currency ? 'Editar Moneda' : 'Nueva Moneda'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">Código</Label>
                        <Input
                            id="code"
                            className="col-span-3"
                            placeholder="Ej: USD"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            disabled={!!currency}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="symbol" className="text-right">Símbolo</Label>
                        <Input
                            id="symbol"
                            className="col-span-3"
                            placeholder="Ej: $"
                            value={formData.symbol}
                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rate" className="text-right">Tasa de Cambio</Label>
                        <div className="col-span-3 space-y-2">
                            <Input
                                id="rate"
                                type="number"
                                step="0.00000001"
                                value={formData.exchangeRateToBase}
                                onChange={(e) => setFormData({ ...formData, exchangeRateToBase: parseFloat(e.target.value) })}
                                required
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                Cuántas unidades de {formData.code || 'esta moneda'} equivalen a 1 unidad de la moneda base.
                                {formData.exchangeRateToBase === 1 && " (Esta es la Moneda Base)"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="active">Activa</Label>
                        <Switch
                            id="active"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                    </div>
                    <DialogFooter>
                        <Button className="hover:cursor-pointer" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
