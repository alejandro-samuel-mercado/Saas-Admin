"use client"

import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GenericTable } from '@/components/ui/generic-table'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { CategoriesAPI, ProductsAPI, PromosAPI } from '@/services/api'
import { useConfigStore } from '@/store/config.store'
import { useAuthStore } from '@/store/use-auth-store'
import { ColumnDef } from '@tanstack/react-table'
import { AlertCircle, Loader2, Percent, Plus, RefreshCw, Save, Trash } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export default function DiscountsPage() {
    const { user } = useAuthStore()
    const { config } = useConfigStore()
    const userRole = user?.role?.name || ''
    const [discounts, setDiscounts] = useState<any[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newDiscount, setNewDiscount] = useState<any>({ name: '', type: 'PERCENTAGE', value: 0, scope: 'GLOBAL', target: '', active: true })
    const { toast } = useToast()

    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [productQuery, setProductQuery] = useState('')
    const [categoryQuery, setCategoryQuery] = useState('')
    const [isSearchingProduct, setIsSearchingProduct] = useState(false)
    const [searchResults, setSearchResults] = useState<any[]>([])

    const [editingId, setEditingId] = useState<number | null>(null) 

    const [isLoading, setIsLoading] = useState(true) 
    const [activeEvent, setActiveEvent] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)



    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            if (products.length === 0 || categories.length === 0) {
                 const [dProducts, dCategories] = await Promise.all([
                    ProductsAPI.getAll(),
                    CategoriesAPI.getAll()
                ])
                
                const prodsLimit = (dProducts?.data?.data && Array.isArray(dProducts.data.data)) ? dProducts.data.data : (dProducts?.data && Array.isArray(dProducts.data)) ? dProducts.data : Array.isArray(dProducts) ? dProducts : [];
                setProducts(prodsLimit.slice(0, 50))
                setCategories(dCategories)
            }

            const [dDiscounts, configData] = await Promise.all([
                PromosAPI.getDiscounts(),
                PromosAPI.getEvents() 
            ])
            
            setDiscounts(dDiscounts.data || [])
            const active = configData.data?.find((e: any) => e.active)
            setActiveEvent(active || null)
            
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }, [products.length, categories.length, toast])

    useEffect(() => {
        loadData()
    }, [loadData])

    useEffect(() => {
        if (productQuery.length < 2) {
            setSearchResults([])
            return
        }

        if (newDiscount.scope !== 'PRODUCT') return

        const timer = setTimeout(async () => {
            setIsSearchingProduct(true)
            try {
                const res = await ProductsAPI.getAll({ search: productQuery, limit: 50, adminView: true })
                const data = res.data?.data || res.data || res || []
                setSearchResults(data)
            } catch (error) {
                console.error("Error searching products:", error)
            } finally {
                setIsSearchingProduct(true) 
                setIsSearchingProduct(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [productQuery, newDiscount.scope])

    const handleOpenCreate = () => {
        setNewDiscount({ 
            name: '', 
            type: 'PERCENTAGE', 
            value: 0, 
            scope: 'GLOBAL', 
            targetIds: [], 
            active: true,
            priority: 0,
            stackable: false,
            conditions: { minQty: undefined, minAmount: undefined },
            applyPerUnit: false
        })
        setEditingId(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (discount: any) => {
        const uiState = { ...discount }
        
        if (discount.rules) {
            const t = discount.rules.targets[0]
            if (t) {
                uiState.scope = t.type
                uiState.targetIds = Array.isArray(t.value) ? t.value : (t.value ? [t.value] : [])
            }
            
            uiState.conditions = {}
            discount.rules.conditions?.forEach((c: any) => {
                if(c.type === 'MIN_QTY') uiState.conditions.minQty = c.value
                if(c.type === 'MIN_AMOUNT') uiState.conditions.minAmount = c.value
            })
            
            if (discount.rules.action) {
                uiState.type = discount.rules.action.type
                uiState.value = discount.rules.action.value
                uiState.applyPerUnit = discount.rules.action.applyPerUnit
            }
        } else {
             uiState.conditions = discount.conditions || {}
        }

        setNewDiscount(uiState)
        setEditingId(discount.id)
        setIsDialogOpen(true)
    }

    const validateUniqueness = (newData: any) => {
        const newScope = newData.scope;
        const newTargets = newData.targetIds || [];

      
        if (newScope !== 'GLOBAL' && newTargets.length === 0) return null;

        if (!Array.isArray(discounts)) return null;

        for (const d of discounts) {
            
            if (editingId && d.id === editingId) continue;
           
            const dScope = d.rules?.targets?.[0]?.type || d.scope;
            
            // 1. Conflicto Global
            if (newScope === 'GLOBAL' && dScope === 'GLOBAL') {
                return "Ya existe un descuento Global. Solo puede haber uno.";
            }

            // 2. Conflicto Categoría
            if (newScope === 'CATEGORY' && dScope === 'CATEGORY') {
                const rawTargets = d.rules?.targets?.[0]?.value || d.targetIds || [];
                const dTargets = Array.isArray(rawTargets) ? rawTargets : (rawTargets ? [rawTargets] : []);
               
                const hasIntersection = newTargets.some((id: any) => dTargets.includes(id));
                if (hasIntersection) return "Ya existe un descuento para una de las categorías seleccionadas.";
            }

            // 3. Conflicto Producto
            if (newScope === 'PRODUCT' && dScope === 'PRODUCT') {
                 const rawTargets = d.rules?.targets?.[0]?.value || d.targetIds || [];
                 const dTargets = Array.isArray(rawTargets) ? rawTargets : (rawTargets ? [rawTargets] : []);
                 const hasIntersection = newTargets.some((id: any) => dTargets.includes(id));
                 if (hasIntersection) return "Ya existe un descuento para uno de los productos seleccionados.";
            }
        }
        return null;
    }

    const saveWithRules = async (data: any) => {
        if (data.validFrom && data.validUntil) {
            const start = new Date(data.validFrom).getTime()
            const end = new Date(data.validUntil).getTime()
            if (end < start) {
                toast({ title: "Error de Fechas", description: "La fecha de expiración no puede ser anterior a la fecha de vigencia.", variant: "destructive" })
                return
            }
        }

        const errorMsg = validateUniqueness(data);
        if (errorMsg) {
            toast({ title: "Error de Validación", description: errorMsg, variant: "destructive" });
            return;
        }

        setIsSaving(true)
        try {
            if (editingId) {
                await PromosAPI.updateDiscount(editingId, data)
                toast({ title: "Descuento actualizado", description: "La regla de descuento se ha actualizado." })
            } else {
                await PromosAPI.createDiscount(data)
                toast({ title: "Descuento creado", description: "La regla de descuento se ha creado." })
            }
            setIsDialogOpen(false)
            await loadData() 
        } catch (error: any) {
            const message = error.response?.data?.message || "Error al guardar descuento"
            toast({ title: "Error", description: message, variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!editingId) return
        if(confirm('¿Eliminar descuento?')) {
            try {
                await PromosAPI.deleteDiscount(editingId)
                toast({ title: "Descuento eliminado", description: "La regla de descuento ha sido eliminada." })
                setIsDialogOpen(false)
                await loadData()
            } catch (error: any) {
                 const message = error.response?.data?.message || "Error al eliminar descuento"
                 toast({ title: "Error", description: message, variant: "destructive" })
            }
        }
    }

    const columns: ColumnDef<any>[] = [
         { accessorKey: "name", header: "Nombre" },
         { accessorKey: "scope", header: "Aplica a" }, 
         { accessorKey: "value", header: "Valor" },
         { accessorKey: "validUntil", header: "Expira", cell: ({ row }) => row.original.validUntil ? new Date(row.original.validUntil).toLocaleDateString() : 'Nunca' },
         { accessorKey: "active", header: "Estado", cell: ({ row }) => <Badge variant={row.original.active ? 'default' : 'secondary'}>{row.original.active ? 'Activo' : 'Inactivo'}</Badge> },
    ]

    return (
        <div className="sm:p-8  pt-2 space-y-6 pb-40 sm:pb-20">
             <Breadcrumb   className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Descuentos Automáticos</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex sm:flex-row flex-col gap-6 sm:gap-0  items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Percent className="h-6 w-6" />
                        Descuentos Automáticos
                    </h1>
                    <p className="text-muted-foreground">Gestiona reglas de descuento globales, por categoría o producto.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadData} disabled={isLoading} title="Recargar" className="hover:cursor-pointer">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="ml-2 hidden sm:inline">Actualizar</span>
                    </Button>
                    {userRole !== 'EMPLOYEE' && (
                        <Button 
                            onClick={handleOpenCreate} 
                            className="bg-indigo-600 hover:bg-indigo-700 hover:cursor-pointer"
                            disabled={!!activeEvent}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Descuento
                        </Button>
                    )}
                </div>
            </div>

            {activeEvent && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                        <h3 className="font-bold text-amber-900 leading-none">Descuentos Generalmente Suspendidos</h3>
                        <p className="text-amber-800 text-sm"> Hay un evento activo: <strong className="underline decoration-amber-500/50">{activeEvent.name}</strong>. Durante eventos activos, todos los descuentos automáticos de esta lista son ignorados en el punto de venta para priorizar las promociones del evento.</p>
                    </div>
                </div>
            )}
            
            <GenericTable 
                data={discounts}
                columns={columns}
                searchKey="name"
                onEdit={userRole === 'EMPLOYEE' ? undefined : handleEdit} 
                onDelete={userRole === 'EMPLOYEE' ? undefined : (() => {})} 
                loading={isLoading}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-background border-4 border-secondary/60 text-foreground sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Regla' : 'Nueva Regla de Descuento'}</DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="rules">Reglas</TabsTrigger>
                            <TabsTrigger value="action">Beneficio</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="general" className="py-4 space-y-4">
                             <div className="grid gap-2">
                                <Label>Nombre de la Regla</Label>
                                <Input value={newDiscount.name} onChange={(e) => setNewDiscount({...newDiscount, name: e.target.value})} placeholder="Ej: Oferta Verano" className="bg-background border-input" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="active" className="h-4 w-4 rounded border-input bg-background text-secondary focus:ring-secondary" checked={newDiscount.active} onChange={(e) => setNewDiscount({...newDiscount, active: e.target.checked})} />
                                <Label htmlFor="active">Activo</Label> 
                            </div>
                             <div className="flex items-center space-x-2">
                                <input type="checkbox" id="stackable" className="h-4 w-4 rounded border-input bg-background text-secondary focus:ring-secondary" checked={newDiscount.stackable} onChange={(e) => setNewDiscount({...newDiscount, stackable: e.target.checked})} />
                                <Label htmlFor="stackable">Acumulable (Stackable)</Label> 
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Válido Desde</Label>
                                    <Input 
                                        type="date" 
                                        value={newDiscount.validFrom ? newDiscount.validFrom.split('T')[0] : ''} 
                                        onChange={(e) => setNewDiscount({...newDiscount, validFrom: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : null})} 
                                        className="bg-background border-input block" 
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Expira (Opcional)</Label>
                                    <Input 
                                        type="date" 
                                        value={newDiscount.validUntil ? newDiscount.validUntil.split('T')[0] : ''} 
                                        onChange={(e) => setNewDiscount({...newDiscount, validUntil: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : null})} 
                                        className="bg-background border-input block" 
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="rules" className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label>Alcance (Scope)</Label>
                                <Select value={newDiscount.scope} onValueChange={(v) => setNewDiscount({...newDiscount, scope: v, targetIds: []})}>
                                    <SelectTrigger className="bg-background border-input"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-background border-input">
                                        <SelectItem value="GLOBAL">Global (Todo el sitio)</SelectItem>
                                        <SelectItem value="CATEGORY">Por Categoría</SelectItem>
                                        <SelectItem value="PRODUCT">Por Producto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {newDiscount.scope === 'CATEGORY' && (
                                <div className="grid gap-2">
                                    <Label>Selecciona Categorías</Label>
                                    <Input placeholder="Buscar categoría..." value={categoryQuery} onChange={(e) => setCategoryQuery(e.target.value)} className="bg-background border-input text-sm h-8" />
                                    <div className="h-[150px] overflow-y-auto border border-border rounded-md p-2 bg-background">
                                        {categories.filter(cat => cat.name.toLowerCase().includes(categoryQuery.toLowerCase())).map(cat => (
                                            <div key={cat.id} className="flex items-center space-x-2 py-1">
                                                <input 
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-input text-secondary focus:ring-secondary"
                                                    checked={newDiscount.targetIds?.includes(cat.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked
                                                        const current = newDiscount.targetIds || []
                                                        if(checked) setNewDiscount({...newDiscount, targetIds: [...current, cat.id]})
                                                        else setNewDiscount({...newDiscount, targetIds: current.filter((id: number) => id !== cat.id)})
                                                    }}
                                                />
                                                <Label className="font-normal">{cat.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                              {newDiscount.scope === 'PRODUCT' && (
                                <div className="grid gap-2">
                                    <Label>Selecciona Productos</Label>
                                    <Input placeholder="Buscar producto o marca..." value={productQuery} onChange={(e) => setProductQuery(e.target.value)} className="bg-background border-input text-sm h-8" />
                                    <div className="h-[200px] overflow-y-auto border border-border rounded-md p-2 bg-background">
                                        {isSearchingProduct ? (
                                            <div className="p-4 text-center">
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground mt-2 block italic">Buscando productos...</span>
                                            </div>
                                        ) : (searchResults.length > 0 ? searchResults : products.filter(p => p.name.toLowerCase().includes(productQuery.toLowerCase()) || p.brand?.toLowerCase().includes(productQuery.toLowerCase())))
                                            .map(prod => (
                                            <div key={prod.id} className="flex items-center space-x-2 py-1">
                                                <input 
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-input text-secondary focus:ring-secondary"
                                                    checked={newDiscount.targetIds?.includes(prod.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked
                                                        const current = newDiscount.targetIds || []
                                                        if(checked) setNewDiscount({...newDiscount, targetIds: [...current, prod.id]})
                                                        else setNewDiscount({...newDiscount, targetIds: current.filter((id: number) => id !== prod.id)})
                                                    }}
                                                />
                                                <Label className="font-normal">{prod.name} ({prod.brand})</Label>
                                            </div>
                                        ))}
                                        {!isSearchingProduct && productQuery.length >= 2 && searchResults.length === 0 && (
                                            <div className="p-3 text-center text-xs text-muted-foreground">No se encontraron resultados</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-border pt-4 mt-4">
                                <Label className="text-base font-semibold">Condiciones</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="grid gap-2">
                                        <Label>Cantidad Mínima</Label>
                                        <Input 
                                            type="number" 
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={newDiscount.conditions?.minQty || ''}
                                            onChange={(e) => setNewDiscount({
                                                ...newDiscount, 
                                                conditions: { ...newDiscount.conditions, minQty: e.target.value ? parseInt(e.target.value) : undefined }
                                            })} 
                                            className="bg-background border-input"
                                        />
                                        <span className="text-xs text-muted-foreground">Unidades necesarias para activar</span>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Monto Mínimo ({config?.currencySymbol || '$'})</Label>
                                        <Input 
                                            type="number" 
                                            step="any"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            value={newDiscount.conditions?.minAmount || ''}
                                            onChange={(e) => setNewDiscount({
                                                ...newDiscount, 
                                                conditions: { ...newDiscount.conditions, minAmount: e.target.value ? parseFloat(e.target.value) : undefined }
                                            })} 
                                            className="bg-background border-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="action" className="py-4 space-y-4">
                             <div className="grid gap-2">
                                <Label>Tipo de Beneficio</Label>
                                <Select value={newDiscount.type} disabled>
                                    <SelectTrigger className="bg-muted border-input cursor-not-allowed"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-background border-input">
                                        <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                                    </SelectContent>
                                </Select>

                            </div>
                            <div className="grid gap-2">
                                <Label>Valor (%)</Label>
                                <Input 
                                    type="number" 
                                    inputMode="numeric" 
                                    min={1} 
                                    max={100}
                                    value={newDiscount.value || ''} 
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value);
                                        if (isNaN(val)) val = 0;
                                        if (val > 100) val = 100;
                                        if (val < 0) val = 0;
                                        setNewDiscount({...newDiscount, value: val})
                                    }} 
                                    className="bg-background border-input" 
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                    
                    <DialogFooter className="flex justify-between sm:justify-between mt-6 gap-3 sm:gap-0">
                        {editingId ? (
                            <Button variant="destructive" onClick={handleDelete} type="button" className="hover:cursor-pointer">
                                <Trash className="mr-2 h-4 w-4" /> Eliminar
                            </Button>
                        ) : <div></div>}
                        <Button 
                            onClick={() => {
                                const rules: any = {
                                    targets: newDiscount.scope === 'GLOBAL' 
                                        ? [{ type: 'GLOBAL' }] 
                                        : [{ type: newDiscount.scope, value: newDiscount.targetIds }],
                                    conditions: [],
                                    action: { 
                                        type: newDiscount.type, 
                                        value: newDiscount.value, 
                                        applyPerUnit: newDiscount.applyPerUnit 
                                    },
                                    validFrom: newDiscount.validFrom,
                                    validUntil: newDiscount.validUntil
                                }
                                if (newDiscount.conditions?.minQty) 
                                    rules.conditions.push({ type: 'MIN_QTY', value: newDiscount.conditions.minQty, unit: 'UNIDAD' })
                                if (newDiscount.conditions?.minAmount)
                                    rules.conditions.push({ type: 'MIN_AMOUNT', value: newDiscount.conditions.minAmount })
                                    
                                saveWithRules({ ...newDiscount, rules })
                            }}
                            disabled={isSaving}
                            className="bg-secondary hover:bg-secondary/90 shadow-sm text-secondary-foreground hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {editingId ? 'Guardar Cambios' : 'Crear Regla'} 
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
         </div>
    )
}
