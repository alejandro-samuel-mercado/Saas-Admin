
"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import shippingService from "@/services/shipping.service"
import { useConfigStore } from "@/store/config.store"
import { ShippingZone } from "@/types/schema"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface ShippingZoneDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    zone: ShippingZone | null
    onSuccess: () => void
}

export function ShippingZoneDialog({ open, onOpenChange, zone, onSuccess }: ShippingZoneDialogProps) {
    const { toast } = useToast()
    const { config } = useConfigStore()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<ShippingZone>>({
        country: 'Argentina',
        province: '',
        city: '',
        cost: 0,
        active: true
    })

    useEffect(() => {
        if (zone) {
            setFormData({
                country: zone.country || '',
                province: zone.province || '',
                city: zone.city || '',
                cost: zone.cost,
                active: zone.active
            })
        } else {
            setFormData({
                country: 'Argentina',
                province: '',
                city: '',
                cost: 0,
                active: true
            })
        }
    }, [zone, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const dataToSubmit = {
                ...formData,
                country: formData.country?.trim() || null,
                province: formData.province?.trim() || null,
                city: formData.city?.trim() || null,
                cost: Number(formData.cost)
            }

            if (zone) {
                await shippingService.update(zone.id, dataToSubmit)
                toast({ title: "Zona actualizada correctamente" })
            } else {
                await shippingService.create(dataToSubmit)
                toast({ title: "Zona creada correctamente" })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            const msg = error.response?.data?.error || "Error al guardar la zona"
            toast({ 
                title: "Error", 
                description: msg, 
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
                    <DialogTitle>{zone ? 'Editar Zona de Envío' : 'Nueva Zona de Envío'}</DialogTitle>
                    <DialogDescription>
                        Configura el costo de envío para una ubicación específica.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input
                            id="country"
                            value={formData.country || ''}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            placeholder="Argentina"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="province">Provincia / Estado</Label>
                        <Input
                            id="province"
                            value={formData.province || ''}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            placeholder="Ej: Buenos Aires"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city">Ciudad / Localidad</Label>
                        <Input
                            id="city"
                            value={formData.city || ''}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Ej: Mar del Plata"
                        />
                        <p className="text-xs text-muted-foreground">Deja vacío para aplicar a toda la provincia.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cost">Costo de Envío</Label>
                            <div className="relative">
                                <Input
                                    id="cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className=""
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2 flex flex-col justify-end pb-3">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                />
                                <Label htmlFor="active">Activo</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
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
