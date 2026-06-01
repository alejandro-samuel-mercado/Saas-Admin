"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { CategoriesAPI, ProductsAPI, PromosAPI } from "@/services/api"
import { BannerSlide, Event } from "@/types/extended"
import { Loader2, Plus, Search, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { BannerCarouselManager, MarqueeItemManager, SecondaryAdsManager } from "../content/web-content-managers"

interface EventFormProps {
    initialData?: Partial<Event & { discounts: any[] }>
    onSuccess: () => void
    onCancel: () => void
}

export function EventForm({ initialData, onSuccess, onCancel }: EventFormProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    
    const [name, setName] = useState(initialData?.name || "")
    const [startDate, setStartDate] = useState(initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 10) : "")
    const [endDate, setEndDate] = useState(initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 10) : "")
    const [active, setActive] = useState(initialData?.active ?? true)

    const [shippingType, setShippingType] = useState(initialData?.shippingConfig?.type || 'NORMAL')
    const [shippingValue, setShippingValue] = useState(initialData?.shippingConfig?.value || 0)
    const [shippingEnabled, setShippingEnabled] = useState(initialData?.shippingEnabled ?? true)

    const [couponsEnabled, setCouponsEnabled] = useState(initialData?.couponsEnabled ?? true)
    const [pointsEnabled, setPointsEnabled] = useState(initialData?.pointsEnabled ?? true)
    
    const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData?.paymentMethods || [])
    const [deliveryMethods, setDeliveryMethods] = useState<string[]>(initialData?.deliveryMethods || [])
    
    const [heroBanners, setHeroBanners] = useState<BannerSlide[]>(initialData?.heroBanners || [])
    const [marqueeText, setMarqueeText] = useState<string[]>(initialData?.marqueeText || [])
    const [secondaryAds, setSecondaryAds] = useState<{ url: string, link?: string }[]>(initialData?.secondaryAds || [])

    const [eventDiscounts, setEventDiscounts] = useState<any[]>(
        (initialData?.discounts || []).map(d => ({ ...d, q: '', results: [], searching: false }))
    )
    
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [hasAnotherActiveEvent, setHasAnotherActiveEvent] = useState(false)
    const searchTimeouts = useRef<Record<number, NodeJS.Timeout>>({})

    useEffect(() => {
        loadDependencies()
    }, [])

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "")
            setStartDate(initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 10) : "")
            setEndDate(initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 10) : "")
            setActive(initialData.active ?? true)
            
            setShippingType(initialData.shippingConfig?.type || 'NORMAL')
            setShippingValue(initialData.shippingConfig?.value || 0)
            setShippingEnabled(initialData.shippingEnabled ?? true)
            
            setCouponsEnabled(initialData.couponsEnabled ?? true)
            setPointsEnabled(initialData.pointsEnabled ?? true)
            
            setPaymentMethods(initialData.paymentMethods || [])
            setDeliveryMethods(initialData.deliveryMethods || [])
 
            setHeroBanners(initialData.heroBanners || [])
            setMarqueeText(initialData.marqueeText || [])
            setSecondaryAds(initialData.secondaryAds || [])
            setEventDiscounts((initialData.discounts || []).map(d => ({ ...d, q: '', results: [], searching: false })))
        }
    }, [initialData])

    const loadDependencies = useCallback(async () => {
        try {
            const [prods, cats, eventsRes] = await Promise.all([
                ProductsAPI.getAll({ limit: 100, adminView: true }), 
                CategoriesAPI.getAll(),
                PromosAPI.getEvents()
            ])
            const pData = prods.data?.data || prods.data || [];
            setProducts(Array.isArray(pData) ? pData : [])
            setCategories(cats.data || cats || [])
            
            const events = eventsRes.data || eventsRes || []
            const anotherActive = events.some((e: any) => e.active && e.id !== initialData?.id)
            setHasAnotherActiveEvent(anotherActive)
        } catch (error) {
        }
    }, [initialData?.id])

    useEffect(() => {
        loadDependencies()
    }, [loadDependencies])

    const handleSearch = (idx: number, query: string) => {
        setEventDiscounts(prev => {
            const newDiscs = [...prev]
            if (newDiscs[idx]) {
                newDiscs[idx] = { ...newDiscs[idx], q: query, searching: query.length > 0 }
            }
            return newDiscs
        })

        if (searchTimeouts.current[idx]) clearTimeout(searchTimeouts.current[idx])

        if (query.length === 0) {
            updateDiscountRow(idx, { q: '', results: [], searching: false })
            return
        }

        searchTimeouts.current[idx] = setTimeout(async () => {
             try {
                const res = await ProductsAPI.getAll({ search: query, limit: 100, adminView: true, includeInactive: true })
                const data = res.data?.data || res.data || []
                updateDiscountRow(idx, { results: Array.isArray(data) ? data : [], searching: false })
             } catch (e) {
                updateDiscountRow(idx, { searching: false })
             }
        }, 500)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        
        const start = new Date(startDate + "T00:00:00").getTime()
        const end = new Date(endDate + "T23:59:59").getTime()
        if (end < start) {
            toast({ title: "Error de Fechas", description: "La fecha de finalización no puede ser anterior a la fecha de inicio.", variant: "destructive" })
            setLoading(false)
            return
        }

        const payload = {
            name,
            startDate: new Date(startDate + "T00:00:00").toISOString(),
            endDate: new Date(endDate + "T23:59:59").toISOString(),
            active,
            shippingConfig: shippingType === 'NORMAL' ? null : { type: shippingType, value: parseFloat(shippingValue.toString()) },
            shippingEnabled,
            couponsEnabled,
            pointsEnabled,
            paymentMethods: paymentMethods.length > 0 ? paymentMethods : null, 
            deliveryMethods: deliveryMethods.length > 0 ? deliveryMethods : null,
            heroBanners,
            marqueeText,
            secondaryAds
        }

        try {
            let eventId = initialData?.id
            if (eventId) {
                await PromosAPI.updateEvent(eventId, payload)
            } else {
                const res = await PromosAPI.createEvent(payload)
                eventId = res.data?.id || res.id
            }

            for (const disc of eventDiscounts) {
                const updatedRules = { ...(disc.rules || {}) };
                updatedRules.action = {
                    type: disc.type || updatedRules.action?.type || 'PERCENTAGE',
                    value: Math.min(100, parseFloat(disc.value || '0'))
                };
                
                updatedRules.targets = disc.scope === 'GLOBAL' 
                    ? [{ type: 'GLOBAL' }] 
                    : [{ type: disc.scope, value: disc.targetIds }];

             
                const { q, results, searching, isNew, ...rest } = disc;

                const discPayload = {
                    ...rest,
                    rules: updatedRules,
                    eventId: eventId,
                    active: true 
                }
                if (disc.id && !isNew) {
                    await PromosAPI.updateDiscount(disc.id, discPayload)
                } else {
                    await PromosAPI.createDiscount(discPayload)
                }
            }

            toast({ title: initialData?.id ? "Evento actualizado" : "Evento creado" })
            onSuccess()
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el evento", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const addDiscountRow = () => {
        setEventDiscounts([...eventDiscounts, {
            name: `Desc. ${name || 'Evento'}`,
            scope: 'GLOBAL',
            type: 'PERCENTAGE',
            value: 0,
            targetIds: [],
            isNew: true,
            q: '',
            results: [],
            searching: false
        }])
    }

    const removeDiscountRow = async (index: number) => {
        const disc = eventDiscounts[index]
        if (disc.id && !disc.isNew) {
            if (confirm("¿Eliminar este descuento permanentemente?")) {
                try {
                    await PromosAPI.deleteDiscount(disc.id)
                    setEventDiscounts(eventDiscounts.filter((_, i) => i !== index))
                } catch (e) {
                    toast({ title: "Error", description: "No se pudo eliminar el descuento." })
                }
            }
        } else {
            setEventDiscounts(eventDiscounts.filter((_, i) => i !== index))
        }
    }

    const updateDiscountRow = (index: number, data: any) => {
        setEventDiscounts(prev => {
            const newDiscs = [...prev]
            if (newDiscs[index]) {
                newDiscs[index] = { ...newDiscs[index], ...data }
            }
            return newDiscs
        })
    }

    const togglePayment = (method: string) => {
        setPaymentMethods(prev => 
            prev.includes(method) ? prev.filter(p => p !== method) : [...prev, method]
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nombre del Evento</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Hot Sale 2024" className="bg-background border-input" />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                        <Switch 
                            checked={active} 
                            onCheckedChange={setActive} 
                            disabled={hasAnotherActiveEvent && !initialData?.active}
                        />
                        <Label className={hasAnotherActiveEvent && !initialData?.active ? "text-muted-foreground" : ""}>
                            Evento Activo {hasAnotherActiveEvent && !initialData?.active && "(Ya existe uno activo)"}
                        </Label>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fecha Inicio</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="bg-background border-input" />
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha Fin</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="bg-background border-input" />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="shipping" className="w-full">
                <TabsList className="grid w-full sm:grid-cols-5 grid-cols-3 bg-muted/50 text-muted-foreground rounded-lg border-2 border-border h-auto gap-2 sm:gap-0">
                    <TabsTrigger value="shipping" className="text-xs sm:text-sm border-r border-border data-[state=active]:bg-secondary/30">Envíos</TabsTrigger>
                    <TabsTrigger value="discounts" className="text-xs border-r border-border sm:text-sm data-[state=active]:bg-secondary/30">Descuentos</TabsTrigger>
                    <TabsTrigger value="visual" className="text-xs border-r border-border sm:text-sm data-[state=active]:bg-secondary/30">Diseño Web</TabsTrigger>
                    <TabsTrigger value="payment" className="text-xs border-r border-border sm:text-sm data-[state=active]:bg-secondary/30">Pagos</TabsTrigger>
                    <TabsTrigger value="restrictions" className="text-xs border-border sm:text-sm data-[state=active]:bg-secondary/30">Restric.</TabsTrigger>
                </TabsList>
                
                <TabsContent value="shipping" className="p-4 border border-border rounded-md mt-2 space-y-4 bg-card text-card-foreground">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                         <div className="space-y-0.5">
                            <Label>Habilitar Envíos</Label>
                            <p className="text-xs text-muted-foreground">Override global de envíos durante el evento.</p>
                        </div>
                        <Switch checked={shippingEnabled} onCheckedChange={setShippingEnabled} />
                    </div>

                    {shippingEnabled && (
                        <div className="space-y-2 pt-2">
                            <Label>Tipo de Configuración de Envío</Label>
                            <Select value={shippingType} onValueChange={(v: any) => setShippingType(v)}>
                                <SelectTrigger className="bg-background border-input"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <SelectItem value="NORMAL">Normal (Precio por Zona)</SelectItem>
                                    <SelectItem value="FREE">Envío GRATIS</SelectItem>
                                    <SelectItem value="DISCOUNT">Descuento Global (%)</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            {shippingType === 'DISCOUNT' && (
                                <div className="space-y-2 mt-2">
                                    <Label>Porcentaje de Descuento (%)</Label>
                                    <Input 
                                        type="number" 
                                        min={1} max={100} 
                                        value={shippingValue} 
                                        onChange={e => setShippingValue(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} 
                                        className="bg-background border-input" 
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="discounts" className="p-4 border border-border rounded-md mt-2 space-y-4 bg-card text-card-foreground">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base font-bold">Descuentos del Evento</Label>
                            <p className="text-xs text-muted-foreground">Estos descuentos solo regirán mientras el evento esté activo.</p>
                        </div>
                        {eventDiscounts.length === 0 && (
                            <Button type="button" size="sm" onClick={addDiscountRow} className="gap-2 bg-indigo-600 hover:bg-indigo-700 hover:cursor-pointer">
                                <Plus className="h-4 w-4" /> Agregar Descuento
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {eventDiscounts.map((disc, idx) => (
                            <Card key={idx} className="border-secondary/10 bg-secondary/5">
                                <CardContent className="p-3 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="grid sm:grid-cols-2 grid-cols-1 gap-4 flex-1">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase">Alcance del Descuento</Label>
                                                <Select value={disc.scope} onValueChange={(v) => updateDiscountRow(idx, { scope: v, targetIds: [] })}>
                                                    <SelectTrigger className="h-10 text-sm bg-background"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="GLOBAL">Global (Toda la tienda)</SelectItem>
                                                        <SelectItem value="CATEGORY">Por Categoría</SelectItem>
                                                        <SelectItem value="PRODUCT">Por Producto</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase">Valor (%)</Label>
                                                <Input 
                                                    type="number" 
                                                    value={disc.value} 
                                                    onChange={e => updateDiscountRow(idx, { value: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                                                    className="h-10 text-sm bg-background"
                                                />
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:cursor-pointer" onClick={() => removeDiscountRow(idx)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {disc.scope !== 'GLOBAL' && (
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-[10px] uppercase">
                                                    Buscar {disc.scope === 'CATEGORY' ? 'Categorías' : 'Productos'}
                                                </Label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        placeholder={disc.scope === 'CATEGORY' ? "Escribe nombre de categoría..." : "Escribe nombre de producto..."}
                                                        value={disc.q || ''}
                                                        onChange={(e) => handleSearch(idx, e.target.value)}
                                                        className="pl-9 h-9 text-sm bg-gray-200 border-3 border-gray-400/20"
                                                    />
                                                </div>
                                            </div>

                                            {(disc.q?.length > 0 || disc.scope === 'PRODUCT') && (
                                                <div className="border rounded-md bg-background shadow-sm max-h-[150px] overflow-y-auto divide-y">
                                                    {disc.searching ? (
                                                        <div className="p-4 text-center">
                                                            <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground mt-2 block italic">Buscando...</span>
                                                        </div>
                                                    ) : (disc.scope === 'CATEGORY' 
                                                            ? categories.filter((item: any) => item.name.toLowerCase().includes(disc.q?.toLowerCase() || '') && !disc.targetIds?.includes(item.id)) 
                                                            : (disc.results?.length > 0 ? disc.results : products).filter((item: any) => !disc.targetIds?.includes(item.id))
                                                        )
                                                        .slice(0, 100)
                                                        .map((item: any) => (
                                                            <div 
                                                                key={item.id} 
                                                                className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer transition-colors"
                                                                onClick={() => {
                                                                    const ids = disc.targetIds || []
                                                                    updateDiscountRow(idx, { 
                                                                        targetIds: [...ids, item.id],
                                                                        q: '',
                                                                        results: []
                                                                    })
                                                                }}
                                                            >
                                                                <span className="text-sm">{item.name}</span>
                                                                <Plus className="h-3 w-3 text-indigo-600" />
                                                            </div>
                                                        ))
                                                    }
                                                    {!disc.searching && (disc.scope === 'CATEGORY' ? categories.filter((item: any) => item.name.toLowerCase().includes(disc.q?.toLowerCase() || '') && !disc.targetIds?.includes(item.id)).length : (disc.results?.length > 0 ? disc.results : products).filter((item: any) => !disc.targetIds?.includes(item.id)).length) === 0 && disc.q?.length > 0 && (
                                                        <div className="p-3 text-center text-xs text-muted-foreground">No se encontraron resultados</div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase">Seleccionados ({disc.targetIds?.length || 0})</Label>
                                                <div className="flex flex-wrap gap-1.5 p-2 bg-secondary/5 border border-secondary/10 rounded-md min-h-[45px]">
                                                    {disc.targetIds?.length > 0 ? (
                                                        disc.targetIds.map((id: number) => {
                                                            const item = (disc.scope === 'CATEGORY' ? categories : products).find((i: any) => i.id === id)
                                                            if (!item) return null
                                                            return (
                                                                <Badge 
                                                                    key={id} 
                                                                    variant="secondary"
                                                                    className="gap-1 pr-1 bg-background border-secondary/20 text-secondary hover:bg-background"
                                                                >
                                                                    {item.name}
                                                                    <X 
                                                                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            updateDiscountRow(idx, { targetIds: disc.targetIds.filter((tid: number) => tid !== id) })
                                                                        }}
                                                                    />
                                                                </Badge>
                                                            )
                                                        })
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground italic self-center">Ninguno seleccionado. Usa el buscador arriba.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {eventDiscounts.length === 0 && (
                            <p className="text-center py-8 text-sm text-muted-foreground italic border-2 border-dashed rounded-lg">No hay descuentos específicos configurados para este evento.</p>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="visual" className="p-4 border border-border rounded-md mt-2 space-y-6 bg-card text-card-foreground max-h-[500px] overflow-y-auto custom-scrollbar">
                    <MarqueeItemManager 
                        items={marqueeText}
                        onChange={setMarqueeText}
                    />
                    <Separator />
                    <BannerCarouselManager 
                        slides={heroBanners}
                        onChange={setHeroBanners}
                    />
                    <Separator />
                    <SecondaryAdsManager 
                        ads={secondaryAds}
                        onChange={setSecondaryAds}
                    />
                </TabsContent>

                <TabsContent value="payment" className="p-4 border border-border rounded-md mt-2 space-y-6 bg-card text-card-foreground">
                    <div>
                        <Label className="mb-2 block">Métodos de Pago Permitidos (Dejar vacío para todos)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'CASH', label: 'Efectivo' },
                                { id: 'CARD', label: 'Tarjeta Crédito' },
                                { id: 'DEBIT', label: 'Tarjeta Débito' },
                                { id: 'TRANSFER', label: 'Transferencia' },
                                { id: 'MERCADO_PAGO', label: 'Mercado Pago' },
                            ].map(m => (
                                <div key={m.id} className="flex items-center space-x-2">
                                    <Switch checked={paymentMethods.includes(m.id)} onCheckedChange={() => togglePayment(m.id)} />
                                    <span>{m.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="restrictions" className="p-4 border border-border rounded-md mt-2 space-y-4 bg-card text-card-foreground">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <div className="space-y-0.5">
                            <Label>Permitir Cupones</Label>
                            <p className="text-xs text-muted-foreground">Habilitar uso de cupones durante el evento.</p>
                        </div>
                        <Switch checked={couponsEnabled} onCheckedChange={setCouponsEnabled} />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <div className="space-y-0.5">
                            <Label>Acumular Puntos</Label>
                            <p className="text-xs text-muted-foreground">Habilitar suma de puntos por compras.</p>
                        </div>
                        <Switch checked={pointsEnabled} onCheckedChange={setPointsEnabled} />
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={onCancel} className="border-border text-muted-foreground hover:bg-muted hover:cursor-pointer">Cancelar</Button>
                <Button type="submit" disabled={loading} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-sm hover:cursor-pointer">{loading ? "Guardando..." : "Guardar Evento"}</Button>
            </div>
        </form>
    )
}
