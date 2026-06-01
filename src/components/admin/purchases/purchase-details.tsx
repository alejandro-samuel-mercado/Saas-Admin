"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Purchase, purchaseService } from "@/services/purchase.service"
import { ArrowLeft, CheckCircle, Package, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface PurchaseDetailsProps {
    id: number;
    onClose?: () => void;
    onUpdate?: () => void;
}

export function PurchaseDetails({ id, onClose, onUpdate }: PurchaseDetailsProps) {
    const { toast } = useToast()
    const [purchase, setPurchase] = useState<Purchase | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [confirmConfig, setConfirmConfig] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant?: "default" | "destructive";
    }>({
        open: false,
        title: "",
        description: "",
        onConfirm: () => {},
    })

    const fetchPurchase = useCallback(async () => {
        try {
            setLoading(true)
            const data = await purchaseService.getById(id)
            setPurchase(data)
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        if (id) {
            fetchPurchase()
        }
    }, [id, fetchPurchase])

    const handleConfirm = async () => {
        setConfirmConfig({
            open: true,
            title: "Confirmar Orden",
            description: "¿Confirmar orden? ",
            onConfirm: async () => {
                try {
                    setProcessing(true)
                    await purchaseService.confirm(purchase!.id)
                    toast({ title: "Orden confirmada" })
                    fetchPurchase()
                    if (onUpdate) onUpdate()
                    setConfirmConfig(prev => ({ ...prev, open: false }))
                } catch (error: any) {
                    toast({ title: "Error", description: error.message, variant: "destructive" })
                } finally {
                    setProcessing(false)
                }
            }
        })
    }
    
    const handleReceive = async () => {
        setConfirmConfig({
            open: true,
            title: "Recibir Mercadería",
            description: "¿Confirmar recepción de mercadería? ESTO AUMENTARÁ EL STOCK.",
            onConfirm: async () => {
                try {
                    setProcessing(true)
                    await purchaseService.receive(purchase!.id)
                    toast({ title: "Orden recibida", description: "El stock ha sido actualizado." })
                    fetchPurchase()
                    if (onUpdate) onUpdate()
                    setConfirmConfig(prev => ({ ...prev, open: false }))
                } catch (error: any) {
                    toast({ title: "Error", description: error.message, variant: "destructive" })
                } finally {
                    setProcessing(false)
                }
            }
        })
    }

    const handleCancel = async () => {
        setConfirmConfig({
            open: true,
            title: "Cancelar Orden",
            description: "¿Estás seguro de que deseas cancelar esta orden?",
            variant: "destructive",
            onConfirm: async () => {
                try {
                    setProcessing(true)
                    await purchaseService.cancel(purchase!.id)
                    toast({ title: "Orden cancelada" })
                    fetchPurchase()
                    if (onUpdate) onUpdate()
                    setConfirmConfig(prev => ({ ...prev, open: false }))
                } catch (error: any) {
                    toast({ title: "Error", description: error.message, variant: "destructive" })
                } finally {
                    setProcessing(false)
                }
            }
        })
    }

    if (loading) return <div className="p-8"><Skeleton className="h-64" /></div>
    if (!purchase) return <div className="p-8 text-center">Orden no encontrada</div>

    return (
        <div className="space-y-6 w-full ">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onClose && (
                        <Button className="hover:cursor-pointer" variant="ghost" size="icon" onClick={onClose}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Orden #{purchase.id}</h1>
                            <Badge variant="outline" className="text-muted-foreground border-border">
                                {purchase.status === 'DRAFT' ? 'BORRADOR' : 
                                 purchase.status === 'CONFIRMED' ? 'CONFIRMADA' : 
                                 purchase.status === 'RECEIVED' ? 'RECIBIDA' : 
                                 purchase.status === 'CANCELLED' ? 'CANCELADA' : 
                                 purchase.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{purchase.supplier?.tradeName} • {new Date(purchase.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {purchase.status === 'DRAFT' && (
                         <Button 
                            size="sm" 
                            onClick={handleConfirm} 
                            disabled={processing}
                            className="bg-primary/80  hover:bg-primary/90 hover:cursor-pointer text-white font-bold"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" /> Confirmar Orden
                        </Button>
                    )}

                    {(purchase.status === 'DRAFT' || purchase.status === 'CONFIRMED') && !purchase.payment && (
                         <Button variant="destructive" size="sm" className="hover:cursor-pointer" onClick={handleCancel} disabled={processing}>
                            <X className="h-4 w-4 mr-2" /> Cancelar Orden
                        </Button>
                    )}
                    
                    {(purchase.status === 'DRAFT' || purchase.status === 'CONFIRMED') && (
                        <Button 
                            size="sm" 
                            onClick={handleReceive} 
                            disabled={processing || !purchase.payment} 
                            className={`hover:cursor-pointer text-white ${!purchase.payment ? 'bg-muted-foreground/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            title={!purchase.payment ? "Debe registrar el pago antes de recibir" : "Recibir mercadería"}
                        >
                            <Package className="h-4 w-4 mr-2" /> Recibir Mercadería
                        </Button>
                    )}
                </div>
            </div>
            
            {purchase.status !== 'RECEIVED' && purchase.status !== 'CANCELLED' && (
                <div className={`p-6 rounded-lg border-2 shadow-sm ${
                    purchase.payment 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-orange-500/10 border-orange-500/20'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${
                                purchase.payment 
                                ? 'bg-emerald-500/20 text-emerald-600' 
                                : 'bg-orange-500/20 text-orange-600'
                            }`}>
                                {purchase.payment ? <CheckCircle className="h-8 w-8" /> : <Package className="h-8 w-8" />}
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${purchase.payment ? 'text-emerald-600' : 'text-orange-600'}`}>
                                    {purchase.payment ? 'ESTADO: PAGADO' : 'ESTADO: PAGO PENDIENTE'}
                                </h3>
                                <p className={`text-base font-medium ${purchase.payment ? 'text-emerald-600/80' : 'text-orange-600/80'}`}>
                                    {purchase.payment 
                                    ? 'El pago ha sido registrado. La mercadería está lista para ser recibida.' 
                                    : 'ATENCIÓN: Debe registrar el pago antes de poder recibir la mercadería.'}
                                </p>
                            </div>
                        </div>
                        {!purchase.payment && (
                                <Link 
                                    href={`/management/supplier-payments?purchaseId=${purchase.id}&supplierId=${purchase.supplierId}`}
                                    onClick={(e) => {
                                        if (onClose) onClose();
                                    }}
                                >
                                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 hover:cursor-pointer text-white border-orange-700 shadow-md">
                                    REGISTRAR PAGO AHORA
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Información de la orden */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="text-muted-foreground">Producto</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Cantidad</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Precio Unit.</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchase.items?.map(item => {
                                 
                                    const variantText = (item.sku?.variantOptions && item.sku.variantOptions.length > 0)
                                        ? ` (${item.sku.variantOptions.map((v: any) => `${v.name}: ${v.value}`).join(', ')})`
                                        : '';
                                    
                                    return (
                                        <TableRow key={item.id} className="border-border hover:bg-muted/50">
                                            <TableCell>
                                                <div className="font-medium text-foreground">{item.sku?.product?.name || 'Producto desconocido'}{variantText}</div>
                                                <div className="text-xs text-muted-foreground">{item.sku?.code || 'S/C'}</div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">{item.quantity}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</TableCell>
                                            <TableCell className="text-right text-foreground font-medium">{formatCurrency(item.subtotal)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                <TableRow className="border-t-border bg-muted/50">
                                     <TableCell colSpan={3} className="text-right font-bold text-foreground">Total</TableCell>
                                     <TableCell className="text-right font-bold text-xl text-emerald-600">
                                         {formatCurrency(purchase.estimatedTotal)}
                                     </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
                
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                        <h3 className="font-medium text-foreground border-b border-border pb-2">Información</h3>
                        
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Branch Destino</div>
                            <div className="text-sm text-foreground font-medium">{purchase.branch?.name}</div>
                        </div>
                        
                         <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Creado por</div>
                            <div className="text-sm text-foreground">{purchase.user?.name}</div>
                        </div>
                        
                         <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Notas</div>
                            <div className="text-sm text-foreground bg-muted p-3 rounded border border-border italic">
                                {purchase.notes || 'Sin notas'}
                            </div>
                        </div>

                        {purchase.invoiceUrl && (
                             <div className="space-y-1 pt-2">
                                <div className="text-xs text-muted-foreground">Factura Adjunta</div>
                                <Button variant="outline" size="sm" asChild className="w-full hover:cursor-pointer mt-1">
                                    <a href={purchase.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                        Ver Factura (PDF/Imagen)
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog 
                open={confirmConfig.open}
                onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}
                title={confirmConfig.title}
                description={confirmConfig.description}
                onConfirm={confirmConfig.onConfirm}
                variant={confirmConfig.variant}
                loading={processing}
            />
        </div>
    )
}
