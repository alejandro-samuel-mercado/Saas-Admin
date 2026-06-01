"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SafeNumericInput } from "@/components/ui/safe-numeric-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn, formatCurrency } from "@/lib/utils"
import { Purchase, purchaseService } from "@/services/purchase.service"
import supplierPaymentService from "@/services/supplier-payment.service"
import { supplierService } from "@/services/supplier.service"
import { useConfigStore } from "@/store/config.store"

import { format } from "date-fns"
import { Check, ChevronsUpDown, Loader2, Save } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface SupplierPaymentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialPurchaseId?: string;
    initialSupplierId?: string;
}

export function SupplierPaymentForm({ onSuccess, onCancel, initialPurchaseId, initialSupplierId }: SupplierPaymentFormProps) {
    const { toast } = useToast()
    const { config } = useConfigStore()
    
  
    const [supplierId, setSupplierId] = useState<string>(initialSupplierId || "")
    const [purchaseId, setPurchaseId] = useState<string>(initialPurchaseId || "none")
    const [amount, setAmount] = useState<string>("")
    const [method, setMethod] = useState<string>("CASH")
    const [reference, setReference] = useState("")
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [description, setDescription] = useState("")
    
  
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [supplierSearchQuery, setSupplierSearchQuery] = useState("")
    const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false)
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    
    const [loading, setLoading] = useState(false)

    const searchSuppliers = useCallback(async (query: string) => {
        try {
            setIsSearchingSuppliers(true)
            const data = await supplierService.getAll({ search: query, active: true, limit: 50 })
            setSuppliers(Array.isArray(data) ? data : (data.data || []))
        } catch (error) {
            console.error("Error searching suppliers:", error)
        } finally {
            setIsSearchingSuppliers(false)
        }
    }, [])

    useEffect(() => {
        searchSuppliers("")
    }, [searchSuppliers])
    
    useEffect(() => {
        const timer = setTimeout(() => {
            searchSuppliers(supplierSearchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [supplierSearchQuery, searchSuppliers])
    
    const loadPurchases = useCallback(async (id: number) => {
        try {
            const data = await purchaseService.getAll({ supplierId: id })
            const confirmed = data.filter((p: any) => p.status === 'CONFIRMED')
            setPurchases(confirmed)
            
          
            if (initialPurchaseId) {
                 const selected = confirmed.find((p: any) => p.id.toString() === initialPurchaseId)
                 if (selected) {
                     setAmount(selected.estimatedTotal.toString())
                 }
            }
        } catch (error) {
        }
    }, [initialPurchaseId])

    
    useEffect(() => {
        if (supplierId) {
            loadPurchases(parseInt(supplierId))
            if (!initialPurchaseId) {
                setPurchaseId("none")
            }
        } else {
            setPurchases([])
        }
    }, [supplierId, initialPurchaseId, loadPurchases])
    
    const isFormValid = () => {
        return !!supplierId && parseFloat(amount) > 0 && !!method && !!date;
    }
    
    const handleSubmit = async () => {
        if (!supplierId || !amount || !method || !date) {
            toast({ title: "Completa los campos requeridos", variant: "destructive" })
            return
        }

        try {
            setLoading(true)
            await supplierPaymentService.create({
                supplierId: parseInt(supplierId),
                purchaseId: purchaseId !== "none" ? parseInt(purchaseId) : undefined,
                amount: parseFloat(amount),
                method,
                paymentDate: new Date(date).toISOString(),
                description,
                reference: reference || undefined
            })
            
            toast({ title: "Pago registrado exitosamente" })
            if (onSuccess) onSuccess()
        } catch (error: any) {
             toast({ title: "Error", description: error.message || "Error al registrar el pago", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handlePurchaseChange = (val: string) => {
        setPurchaseId(val)
        if (val !== "none") {
            const selected = purchases.find(p => p.id.toString() === val)
            if (selected) {
                setAmount(selected.estimatedTotal.toString())
            }
        } else {
            setAmount("")
        }
    }

    useEffect(() => {
        const autoRef = `PAY-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        setReference(autoRef)
    }, [])

    return (
        <div className="space-y-6 w-full ">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuevo Pago a Proveedor</h1>
                <p className="text-muted-foreground text-sm">Registrar una salida de dinero o pago de factura</p>
            </div>
            
            <Card className="sm:border-border border-none shadow-none  sm:shadow-sm bg-card ">
                <CardHeader className="border-b border-border bg-muted/50">
                    <CardTitle className="text-lg text-foreground">Detalles del Pago</CardTitle>
                    <CardDescription>Complete la información del pago realizado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    <div className="space-y-2">
                        <Label className="text-foreground">Proveedor <span className="text-destructive">*</span></Label>
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild disabled={!!initialSupplierId}>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isPopoverOpen}
                                    className="w-full justify-between bg-background border-input font-normal hover:cursor-pointer"
                                >
                                    {supplierId
                                        ? suppliers.find((s) => s.id.toString() === supplierId)?.tradeName || "Proveedor seleccionado"
                                        : "Seleccionar Proveedor"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput 
                                        placeholder="Buscar proveedor..." 
                                        value={supplierSearchQuery}
                                        onValueChange={setSupplierSearchQuery}
                                    />
                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                        {isSearchingSuppliers ? (
                                            <div className="p-4 text-center">
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground mt-2 block">Buscando...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
                                                <CommandGroup>
                                                    {suppliers.map((s) => (
                                                        <CommandItem
                                                            key={s.id}
                                                            value={s.id.toString()}
                                                            onSelect={(currentValue) => {
                                                                setSupplierId(currentValue)
                                                                setIsPopoverOpen(false)
                                                            }}
                                                            className="hover:cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    supplierId === s.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-foreground">{s.tradeName}</span>
                                                                <span className="text-xs text-muted-foreground">{s.legalName} - CUIT: {s.taxId}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {supplierId && (
                         <div className="space-y-2 p-4 bg-muted/50 border border-border rounded-lg">
                            <Label className="text-foreground font-medium">Imputar a Orden de Compra (Opcional)</Label>
                            <Select value={purchaseId} onValueChange={handlePurchaseChange}>
                                <SelectTrigger className="bg-background border-input focus:ring-ring">
                                    <SelectValue placeholder="Seleccionar Orden (Opcional)" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="none">-- Sin Orden Específica --</SelectItem>
                                    {purchases.map(p => {
                                        const isPaid = !!p.payment
                                        return (
                                            <SelectItem key={p.id} value={p.id.toString()} disabled={isPaid}>
                                                #{p.id} - {format(new Date(p.createdAt), "dd/MM/yyyy")} - {formatCurrency(Number(p.estimatedTotal))} ({p.status}) {isPaid ? '(PAGADO)' : ''}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Si seleccionas una orden, el pago quedará vinculado a ella y el monto se bloqueará.</p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-foreground">Monto <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <SafeNumericInput 
                                    className={`border-input text-lg font-bold text-foreground placeholder:text-muted-foreground ${purchaseId !== "none" ? "bg-muted" : "bg-background"}`}
                                    placeholder="0.00" 
                                    value={parseFloat(amount) || 0}
                                    onChange={val => setAmount(String(val))}
                                    onStringChange={setAmount}
                                    disabled={purchaseId !== "none"}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-foreground">Método de Pago <span className="text-destructive">*</span></Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="bg-background border-input">
                                    <SelectValue placeholder="Seleccionar Método" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="CASH">Efectivo</SelectItem>
                                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                    <SelectItem value="CHECK">Cheque</SelectItem>
                                    <SelectItem value="MERCADO_PAGO">Mercado Pago</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="text-foreground">Fecha <span className="text-destructive">*</span></Label>
                            <Input 
                                type="date" 
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="bg-background border-input block w-full"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-foreground">Referencia / Comprobante</Label>
                            <Input 
                                placeholder="Ej: #123456" 
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                className="bg-muted border-input text-muted-foreground cursor-not-allowed"
                                readOnly
                            />
                            <p className="text-[10px] text-muted-foreground">Generado automáticamente</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">Notas Adicionales</Label>
                        <Textarea 
                            placeholder="Observaciones sobre el pago..." 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="bg-background border-input min-h-[100px] resize-none"
                        />
                    </div>
                    
                     <div className="flex justify-end gap-3 pt-6 border-t border-border">
                        <Button variant="outline" className="border-input text-foreground hover:bg-muted hover:cursor-pointer" onClick={() => onCancel && onCancel()}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={loading || !isFormValid()} className="min-w-[150px] shadow-sm hover:cursor-pointer">
                            {loading ? "Guardando..." : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Registrar Pago
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
