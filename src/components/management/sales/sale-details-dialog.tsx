"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import { ConfigAPI, SalesAPI } from "@/services/api"
import { useBranchStore } from "@/store/branch.store"
import { useConfigStore } from "@/store/config.store"
import { Sale } from "@/types/schema"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertCircle, Calendar, CreditCard, Download, ExternalLink, Eye, FileText, Loader2, MapPin, Package, Printer, QrCode, Store, Trash2, Upload, User, XCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"
import { TicketTemplate } from "../../sales/ticket-template"

interface SaleDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sale: Sale
    onSaleUpdated: () => void
}

export function SaleDetailsDialog({ open, onOpenChange, sale, onSaleUpdated }: SaleDetailsDialogProps) {
    const { config } = useConfigStore()
    const { activeBranch } = useBranchStore()
    const [loading, setLoading] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState(sale.paymentStatus)
    const [paymentType, setPaymentType] = useState(sale.paymentType)
    const [deliveryStatus, setDeliveryStatus] = useState(sale.deliveryStatus)
    const [deliveryType, setDeliveryType] = useState(sale.deliveryType)

    const ticketRef = useRef<HTMLDivElement>(null);
    const handlePrintTicket = useReactToPrint({
        contentRef: ticketRef,
    });

    const [isDownloading, setIsDownloading] = useState(false)
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
    const [refundReason, setRefundReason] = useState("")
    const [isRefunding, setIsRefunding] = useState(false)
    const [isUploadingQr, setIsUploadingQr] = useState(false)
    const [isDeletingQr, setIsDeletingQr] = useState(false)
    const [localQrUrl, setLocalQrUrl] = useState<string | null>(sale.qrPaymentUrl || null)

    const handleRefund = async () => {
        if (!refundReason.trim()) {
            toast.error("El motivo de anulación es requerido")
            return
        }
        if (!sale.id) {
            toast.error("Venta inválida")
            return
        }
        setIsRefunding(true)
        try {
            await SalesAPI.refund(sale.id, { reason: refundReason })
            toast.success("Venta anulada correctamente. Stock y puntos revertidos.")
            setIsRefundDialogOpen(false)
            setRefundReason("")
            onSaleUpdated()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Error al anular venta")
        } finally {
            setIsRefunding(false)
        }
    }

    const isAbandoned = sale.paymentStatus === 'PENDING' && 
                        sale.paymentType === 'MERCADO_PAGO' && 
                        !sale.mpPaymentId;

    const canEditPaymentStatus = !isAbandoned && ['REJECTED', 'PENDING'].includes(sale.paymentStatus);
    const canEditPaymentType = !isAbandoned && sale.paymentStatus === 'REJECTED';
    
    const canEditDelivery = !isAbandoned && 
                            sale.deliveryStatus !== 'DELIVERED' && 
                            !['CANCELLED', 'REJECTED'].includes(sale.paymentStatus) &&
                            (sale.paymentStatus === 'PAID' || sale.paymentStatus === 'PENDING' || sale.paymentStatus === 'SHIPPED');

    const handleSave = async () => {
        setLoading(true)
        try {
            const updates: any = {}
            if (paymentStatus !== sale.paymentStatus) updates.paymentStatus = paymentStatus
            if (paymentType !== sale.paymentType) updates.paymentType = paymentType
            if (deliveryStatus !== sale.deliveryStatus) updates.deliveryStatus = deliveryStatus
            if (deliveryType !== sale.deliveryType) updates.deliveryType = deliveryType

            if (Object.keys(updates).length > 0 && sale.id) {
                await SalesAPI.update(sale.id, updates)
                toast.success("Venta actualizada correctamente")
                onSaleUpdated()
                onOpenChange(false)
            } else {
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al actualizar venta")
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadInvoice = async () => {
        setIsDownloading(true);
        try {
            const blob = await SalesAPI.getInvoice(sale.id as number);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `factura-${sale.uuid || sale.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Factura descargada");
        } catch (error) {
            toast.error("Error al descargar factura");
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <>
        <Dialog open={open} onOpenChange={(val) => !val && onOpenChange(false)}>
            <DialogContent className="sm:max-w-[800px]  border-4 border-secondary/60 shadow-2xl  text-card-foreground max-h-[90vh] overflow-y-auto  p-4 gap-0">
                
                {/* Header */}
                <div className="bg-muted/30 p-6 border-b border-border">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="sr-only">Detalles de la Venta #{sale.id}</DialogTitle>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Orden</span>
                                    <Badge variant="outline" className="border-border text-foreground font-bold bg-background text-base px-3">
                                        #{sale.id}
                                    </Badge>
                                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                                        {sale.uuid?.substring(0, 13)}...
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border border-border shadow-sm">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground/70" />
                                    {sale.createdAt ? format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm", { locale: es }) : "Fecha desconocida"}
                                </div>
                            </div>
                            
                            {/* Empleado Info  */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border border-dashed">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendedor:</span>
                                    <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                        {sale.employee?.name || 'Venta Web / Anónimo'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pago */}
                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                <CreditCard size={64} />
                             </div>
                             <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <CreditCard size={14} /> Información de Pago
                                </h3>
                                 {(!canEditPaymentStatus && !canEditPaymentType) && <Badge variant="secondary" className="text-[10px] h-5">Bloqueado</Badge>}
                             </div>
                             
                            <div className="space-y-3 relative z-10">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground/70">Estado</Label>
                                         <Select disabled={!canEditPaymentStatus} value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/50 border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDING">PENDIENTE</SelectItem>
                                                <SelectItem value="PAID">PAGADO</SelectItem>
                                                <SelectItem value="REJECTED">RECHAZADO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground/70">Método</Label>
                                         <Select disabled={!canEditPaymentType} value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/50 border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">EFECTIVO</SelectItem>
                                                <SelectItem value="CARD">TARJETA</SelectItem>
                                                <SelectItem value="DEBIT">DEBITO</SelectItem>
                                                <SelectItem value="MERCADO_PAGO">MERCADO PAGO</SelectItem>
                                                <SelectItem value="POINTS">PUNTOS</SelectItem>
                                                <SelectItem value="QR">QR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                { /* Aviso de reembolso manual para estados de cancelación */ }
                                { (paymentStatus === 'CANCELLED' || paymentStatus === 'REJECTED') && (
                                    <div className="mt-2 text-xs p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded flex gap-2 items-start text-amber-800 dark:text-amber-300">
                                        <div className="mt-0.5"> </div>
                                        <div>
                                            <p className="font-semibold uppercase text-[10px] mb-0.5">Cancelación sin reintegro monetario</p>
                                            <p className="opacity-90 leading-tight">Esta acción devolverá el stock y puntos usados, pero <strong className="font-semibold">no reembolsará el dinero automáticamente</strong>. Debes hacerlo manualmente en la pasarela de pagos.</p>
                                        </div>
                                    </div>
                                )}

                                {sale.mpPaymentId && (
                                    <div className="pt-2 border-t border-border border-dashed mt-2">
                                        <Label className="text-[10px] uppercase text-amber-600 font-bold">ID Transacción MP</Label>
                                        <p className="text-xs font-mono bg-amber-50 dark:bg-amber-900/10 p-1.5 rounded border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 mt-1 select-all">
                                            {sale.mpPaymentId}
                                        </p>
                                    </div>
                                )}
                                
                                {['PAID', 'SHIPPED', 'DELIVERED'].includes(sale.paymentStatus) && (
                                    <div className="pt-4 mt-2 hover:cursor-pointer">
                                        <Button 
                                            variant="destructive" 
                                            className="w-full font-bold uppercase py-6 flex items-center gap-2 shadow-lg shadow-red-900/20"
                                            onClick={() => setIsRefundDialogOpen(true)}
                                            type="button"
                                        >
                                            <XCircle size={20} /> Devolución / Anular Venta
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Entrega */}
                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                {deliveryType === 'DELIVERY' ? <MapPin size={64} /> : <Store size={64} />}
                             </div>
                             <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    {deliveryType === 'DELIVERY' ? <MapPin size={14} /> : <Store size={14} />} Información de Entrega
                                </h3>
                                {!canEditDelivery && <Badge variant="secondary" className="text-[10px] h-5">Bloqueado</Badge>}
                             </div>
                             
                            <div className="space-y-3 relative z-10">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground/70">Estado</Label>
                                         <Select disabled={!canEditDelivery} value={deliveryStatus} onValueChange={(v: any) => setDeliveryStatus(v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/50 border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDING_DELIVERY">PENDIENTE</SelectItem>
                                                <SelectItem value="SHIPPED">EN CAMINO</SelectItem>
                                                <SelectItem value="DELIVERED">ENTREGADO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground/70">Método</Label>
                                         <Select disabled={!canEditDelivery} value={deliveryType} onValueChange={(v: any) => setDeliveryType(v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/50 border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PICKUP">RETIRO LOCAL</SelectItem>
                                                <SelectItem value="DELIVERY">ENVIO DOMICILIO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Comprobante de Pago */}
                    {sale.paymentProofUrl && (
                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm mt-4">
                            <div className="flex items-center justify-between mb-3 text-muted-foreground uppercase tracking-wider text-[10px] font-black">
                                <h3 className="flex items-center gap-2">
                                    <FileText size={14} /> Comprobante de Pago
                                </h3>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                    Recibido
                                </Badge>
                            </div>
                            <div className="space-y-4">
                                <div className="aspect-video relative rounded-md border-2 border-dashed border-border overflow-hidden bg-muted group">
                                    <img 
                                        src={sale.paymentProofUrl} 
                                        alt="Comprobante de pago" 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="font-bold flex gap-2"
                                            onClick={() => window.open(sale.paymentProofUrl!, '_blank')}
                                            disabled={sale.paymentStatus === 'CANCELLED'}
                                        >
                                            <Eye size={14} /> {sale.paymentStatus === 'CANCELLED' ? 'No disponible' : 'Ampliar'}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center italic">
                                    Subido el {sale.paymentProofUploadedAt ? format(new Date(sale.paymentProofUploadedAt), "dd/MM/yyyy HH:mm", { locale: es }) : 'desconocido'}
                                </p>
                            </div>
                        </div>
                    )}

                    {(sale.paymentType === 'QR' || paymentType === 'QR') && (
                        <QrPaymentSection
                            sale={sale}
                            localQrUrl={localQrUrl}
                            setLocalQrUrl={setLocalQrUrl}
                            isUploadingQr={isUploadingQr}
                            setIsUploadingQr={setIsUploadingQr}
                            isDeletingQr={isDeletingQr}
                            setIsDeletingQr={setIsDeletingQr}
                            onSaleUpdated={onSaleUpdated}
                        />
                    )}
                </div>

                <div className="p-6 space-y-8">
                     {/* Cliente & Direccion */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User size={14} /> Cliente
                            </h3>
                            <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm">
                                {sale.user ? (
                                    <>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-foreground text-base">{sale.user.name}</p>
                                            <Link 
                                                href={`/management/users?search=${sale.user.email}`}
                                                className="text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                                                onClick={() => onOpenChange(false)}
                                            >
                                                Ver Perfil <ExternalLink size={10} />
                                            </Link>
                                        </div>
                                        <p className="text-muted-foreground">{sale.user.email}</p>
                                        <p className="text-muted-foreground mt-2">{sale.user.phone || 'Teléfono no registrado'}</p>
                                    </>
                                ) : sale.customerEmail ? (
                                    <>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-foreground text-base">{sale.customerName || 'Invitado'}</p>
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/10">Compra de Invitado</Badge>
                                        </div>
                                        <p className="text-muted-foreground">{sale.customerEmail}</p>
                                        <p className="text-muted-foreground mt-1">{sale.customerPhone || 'Sin teléfono'}</p>
                                        {sale.customerDni && <p className="text-[10px] text-muted-foreground mt-1">DNI/CUIT: {sale.customerDni}</p>}
                                        {sale.customerAddress && sale.deliveryType === 'PICKUP' && (
                                            <p className="text-[10px] text-muted-foreground mt-1">DIR: {sale.customerAddress}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-muted-foreground italic">Consumidor Final / Anónimo</p>
                                )}
                            </div>
                        </div>

                        {sale.deliveryType === 'DELIVERY' && (
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MapPin size={14} /> Dirección de Envío
                                </h3>
                                <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm">
                                    <p className="font-medium text-foreground mb-1">{sale.deliveryAddress || 'Sin dirección especificada'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Observaciones */}
                    {sale.observations && (
                        <div className="mt-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FileText size={14} /> Observaciones
                            </h3>
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 text-sm">
                                <p className="text-zinc-700 dark:text-zinc-300 italic">{sale.observations}</p>
                            </div>
                        </div>
                    )}

                    {/* Motivo de Anulación */}
                    {sale.paymentStatus === 'CANCELLED' && sale.cancelReason && (
                        <div className="mt-6">
                            <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertCircle size={14} /> Motivo de Anulación
                            </h3>
                            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900/50 text-sm">
                                <p className="text-red-700 dark:text-red-300 font-medium italic">{sale.cancelReason}</p>
                            </div>
                        </div>
                    )}
                    
                    <Separator className="my-6" />

                    {/* Items Table */}
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Package size={14} /> Productos
                        </h3>
                         <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-xs uppercase">Producto</th>
                                        <th className="px-4 py-3 font-medium text-center text-xs uppercase">Cant.</th>
                                        <th className="px-4 py-3 font-medium text-right text-xs uppercase">Precio Unit.</th>
                                        <th className="px-4 py-3 font-medium text-right text-xs uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sale.items?.map((item: any, index: number) => (
                                        <tr key={index} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <Link 
                                                    href={`/management/inventory?search=${item.productName}`}
                                                    className="font-medium text-foreground text-sm hover:text-secondary hover:underline transition-colors flex items-center gap-2 group"
                                                    onClick={() => onOpenChange(false)}
                                                >
                                                    {item.productName}
                                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                                {item.skuCode && <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono border border-border mt-1">SKU: {item.skuCode}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice, sale.currencyCode || config?.baseCurrency || "USD", config?.currencySymbol)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-foreground border-l border-border bg-muted/20">{formatCurrency(item.subtotal, sale.currencyCode || config?.baseCurrency || "USD", config?.currencySymbol)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Resumen de Totales */}
                    <div className="flex flex-col gap-2 ml-auto w-full md:w-1/2">
                        <div className="flex justify-between text-zinc-500 text-sm">
                            <span>Subtotal Productos</span>
                             <span>{formatCurrency(sale.subtotal, sale.currencyCode || config?.baseCurrency || "USD", config?.currencySymbol)}</span>
                        </div>
                        
                        {/* Impuesto */}
                        {Number(sale.taxAmount) > 0 && (
                            <div className="flex justify-between text-zinc-500 text-sm">
                                <span>Impuesto</span>
                                <span>{formatCurrency(sale.taxAmount, sale.currencyCode || config?.baseCurrency || "USD", config?.currencySymbol)}</span>
                            </div>
                        )}
                        
                        {/* Descuento */}
                        {(Number(sale.discount) > 0 || (sale.coupon && sale.coupon !== null)) ? (
                            <div className="flex justify-between text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded">
                                <span>
                                    Descuento {sale.coupon ? `(Cupón: ${sale.coupon.code})` : ''}
                                </span>
                                 <span>-{formatCurrency(sale.discount, sale.currencyCode || config?.baseCurrency || "USD", config?.currencySymbol)}</span>
                            </div>
                        ) : null}

                         {/* Envio */}
                         {Number(sale.shippingCost) > 0 ? (
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-sm bg-zinc-50 px-2 py-1 rounded">
                                <span>Costo de Envío</span>
                                 <span>+{formatCurrency(sale.shippingCost, sale.currencyCode || config?.baseCurrency || "USD", config?.currencySymbol)}</span>
                            </div>
                        ) : null}
                        
                        <div className="flex justify-between text-2xl font-bold  dark:text-zinc-100 border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-2">
                            <span>Total Final</span>
                             <span>{formatCurrency(sale.total, sale.currencyCode || config?.baseCurrency || "USD", config?.currencySymbol)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-muted/30 border-t border-border p-4 flex sm:justify-between items-center w-full">
                    <div className="flex sm:gap-2 gap-12">
                        <Button 
                            variant="outline" 
                            onClick={handlePrintTicket}
                            disabled={sale.paymentStatus === 'CANCELLED'}
                            className="text-muted-foreground hover:bg-background flex gap-2 font-bold border-2 border-secondary/50 hover:cursor-pointer hover:bg-secondary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer size={16} /> Ticket
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleDownloadInvoice}
                            disabled={isDownloading || sale.paymentStatus === 'CANCELLED'}
                            className="text-secondary hover:bg-secondary hover:text-white  flex gap-2 font-bold border-2 border-secondary/50  hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed "
                        >
                            {isDownloading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            Factura PDF
                        </Button>
                    </div>
                    <div className="hidden">
                        <TicketTemplate ref={ticketRef} sale={sale} branch={sale.branch || activeBranch} />
                    </div>
                    <div className="flex  hidden sm:block">
                        <Button variant="ghost" className=" text-muted-foreground hover:bg-background flex w-full mb-2  font-bold border-2 border-secondary/50 hover:cursor-pointer hover:bg-secondary hover:text-white" onClick={() => onOpenChange(false)}>Cerrar</Button>
                        {(canEditPaymentStatus || canEditPaymentType || canEditDelivery) && (
                            <Button onClick={handleSave} disabled={loading} className="w-full bg-secondary hover:bg-secondary/90 hover:cursor-pointer  text-white shadow-md">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Guardar Cambios
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Anular Venta #{sale.id}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-foreground">
                        Esta acción cancelará la venta, retornará el stock físico al inventario de la sucursal y revertirá los puntos de fidelidad involucrados en la orden.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-900/50">
                        <p className="text-xs text-amber-800 dark:text-amber-400 font-bold uppercase mb-1">  Atención Administrativa</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500">
                            El bloqueo de stock se deshará instantáneamente. El dinero deberá ser devuelto manualmente al cliente mediante el portal de cobro pertinente.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs uppercase font-bold text-muted-foreground">Motivo de Anulación (Requerido)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Ej. Devolución de producto por garantía, Arrepentimiento de compra..."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)} disabled={isRefunding}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleRefund} disabled={isRefunding || !refundReason.trim()}>
                        {isRefunding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                        Confirmar Anulación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}

function QrPaymentSection({ sale, localQrUrl, setLocalQrUrl, isUploadingQr, setIsUploadingQr, isDeletingQr, setIsDeletingQr, onSaleUpdated }: {
    sale: Sale
    localQrUrl: string | null
    setLocalQrUrl: (url: string | null) => void
    isUploadingQr: boolean
    setIsUploadingQr: (v: boolean) => void
    isDeletingQr: boolean
    setIsDeletingQr: (v: boolean) => void
    onSaleUpdated: () => void
}) {
    const [isPersistent, setIsPersistent] = useState(false)

    useEffect(() => {
        ConfigAPI.get().then((cfg: any) => {
            if (cfg?.enablePersistentQr && cfg?.persistentQrUrl) {
                setIsPersistent(true)
            }
        }).catch(() => {})
    }, [])

    return (
        <div className="bg-card p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <QrCode size={14} /> Imagen QR de Pago
                </h3>
                <div className="flex items-center gap-2">
                    {isPersistent && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">
                            QR Persistente
                        </Badge>
                    )}
                    {localQrUrl ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                            QR Cargado
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                            Sin QR
                        </Badge>
                    )}
                </div>
            </div>

            {localQrUrl ? (
                <div className="space-y-3">
                    <div className="relative rounded-lg border-2 border-purple-200 dark:border-purple-700 overflow-hidden bg-white dark:bg-slate-900 group flex items-center justify-center p-4">
                        <img
                            src={localQrUrl}
                            alt="QR de Pago"
                            className="max-w-[280px] w-full rounded-md transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="font-bold flex gap-2"
                                onClick={() => window.open(localQrUrl!, '_blank')}
                            >
                                <Eye size={14} /> Ampliar
                            </Button>
                        </div>
                    </div>

                    {isPersistent && (
                        <p className="text-[10px] text-purple-500 text-center font-medium">
                            Este QR se asigna automáticamente desde la configuración de la tienda.
                        </p>
                    )}

                    {!isPersistent && sale.paymentStatus !== 'PAID' && (
                        <div className="flex gap-2">
                            <label className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file || !sale.id) return
                                        setIsUploadingQr(true)
                                        try {
                                            const res = await SalesAPI.uploadQrImage(sale.id, file)
                                            setLocalQrUrl(res.data?.url || res.url)
                                            toast.success("QR actualizado")
                                            onSaleUpdated()
                                        } catch (err: any) {
                                            toast.error(err?.response?.data?.message || "Error al subir QR")
                                        } finally {
                                            setIsUploadingQr(false)
                                            e.target.value = ''
                                        }
                                    }}
                                />
                                <Button variant="outline" className="w-full font-bold text-xs border-purple-300 text-purple-700 hover:bg-purple-50 hover:cursor-pointer" disabled={isUploadingQr} asChild>
                                    <span>
                                        {isUploadingQr ? <Loader2 size={14} className="animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
                                        Cambiar QR
                                    </span>
                                </Button>
                            </label>
                            <Button
                                variant="outline"
                                className="font-bold text-xs border-red-300 text-red-600 hover:bg-red-50 hover:cursor-pointer"
                                disabled={isDeletingQr}
                                onClick={async () => {
                                    if (!sale.id) return
                                    setIsDeletingQr(true)
                                    try {
                                        await SalesAPI.deleteQrImage(sale.id)
                                        setLocalQrUrl(null)
                                        toast.success("QR eliminado")
                                        onSaleUpdated()
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Error al eliminar QR")
                                    } finally {
                                        setIsDeletingQr(false)
                                    }
                                }}
                            >
                                {isDeletingQr ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="p-6 border-2 border-dashed border-purple-200 dark:border-purple-700 rounded-lg text-center bg-purple-50/50 dark:bg-purple-900/10">
                        <QrCode size={40} className="mx-auto text-purple-300 mb-2" />
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                            Aún no se ha subido un código QR para esta venta.
                        </p>
                        {sale.paymentStatus !== 'PAID' && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Sube la imagen QR para que el cliente pueda escanearla y pagar.
                            </p>
                        )}
                    </div>

                    {sale.paymentStatus !== 'PAID' && (
                        <label>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file || !sale.id) return
                                    setIsUploadingQr(true)
                                    try {
                                        const res = await SalesAPI.uploadQrImage(sale.id, file)
                                        setLocalQrUrl(res.data?.url || res.url)
                                        toast.success("QR subido con éxito. Se notificará al cliente por email.")
                                        onSaleUpdated()
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Error al subir QR")
                                    } finally {
                                        setIsUploadingQr(false)
                                        e.target.value = ''
                                    }
                                }}
                            />
                            <Button variant="default" className="w-full font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white hover:cursor-pointer" disabled={isUploadingQr} asChild>
                                <span>
                                    {isUploadingQr ? <Loader2 size={14} className="animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
                                    Subir Imagen QR
                                </span>
                            </Button>
                        </label>
                    )}
                </div>
            )}
        </div>
    )
}
