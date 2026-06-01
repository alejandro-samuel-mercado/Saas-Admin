"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import stockTransferService from "@/services/stock-transfer.service"
import { useBranchStore } from "@/store/branch.store"
import { StockTransfer } from "@/types/schema"
import { ArrowRight, Box, CheckCircle, Loader2, Send, XCircle } from "lucide-react"
import { useState } from "react"

interface TransferDetailsProps {
    transfer: StockTransfer | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdate: () => void
}

export function TransferDetails({ transfer, open, onOpenChange, onUpdate }: TransferDetailsProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const { activeBranch } = useBranchStore() 
    const [confirmState, setConfirmState] = useState<{open: boolean, action: 'ship' | 'receive' | 'cancel' | null}>({open: false, action: null})

    if (!transfer) return null

    const handleActionClick = (action: 'ship' | 'receive' | 'cancel') => {
        setConfirmState({ open: true, action })
    }

    const handleActionConfirmed = async (action: 'ship' | 'receive' | 'cancel') => {
        setLoading(true)
        try {
            if (action === 'ship') await stockTransferService.ship(transfer.id)
            if (action === 'receive') await stockTransferService.receive(transfer.id)
            if (action === 'cancel') await stockTransferService.cancel(transfer.id)
            
            toast({ title: "Transferencia actualizada exitosamente" })
            onUpdate()
            onOpenChange(false)
            setConfirmState({ open: false, action: null })
        } catch (error: any) {
             toast({ title: "Error", description: error.response?.data?.message || "Error", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const isOrigin = activeBranch?.id === transfer.originBranchId
    const isDestination = activeBranch?.id === transfer.destinationBranchId

    const canShip = transfer.status === 'PENDING' && isOrigin
    const canReceive = transfer.status === 'IN_TRANSIT' && isDestination
    const canCancel = transfer.status === 'PENDING' && isOrigin

    const getStatusColor = (status: string) => {
        if (status === 'COMPLETED') return 'bg-green-500'
        if (status === 'IN_TRANSIT') return 'bg-blue-500'
        if (status === 'CANCELLED') return 'bg-red-500'
        return 'bg-yellow-500'
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-3">
                        <SheetTitle>Transferencia #{transfer.id}</SheetTitle>
                        <Badge className={`${getStatusColor(transfer.status)} text-white border-0`}>{transfer.status}</Badge>
                    </div>
                    <SheetDescription>
                        Creada el {new Date(transfer.createdAt).toLocaleDateString()} por {transfer.user?.name || 'Sistema'}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                   
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Origen</p>
                            <p className="font-semibold">{transfer.originBranch?.name}</p>
                        </div>
                        <ArrowRight className="text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Destino</p>
                            <p className="font-semibold">{transfer.destinationBranch?.name}</p>
                        </div>
                    </div>

                    {/* Notes */}
                    {transfer.notes && (
                        <div className="text-sm bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md border border-yellow-100 dark:border-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                            <strong>Nota:</strong> {transfer.notes}
                        </div>
                    )}

                    {/* Items */}
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Box className="h-4 w-4" /> Items ({transfer.items.length})
                        </h4>
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Cant.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfer.items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium text-sm">{item.sku?.product?.name || `SKU #${item.skuId}`}</div>
                                                {/* Informacion de variantes */}
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                 
                    <div className="flex flex-col gap-2 pt-4 border-t">
                        {canShip && (
                             <Button onClick={() => handleActionClick('ship')} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer">
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                                Despachar Mercadería (Saldrá de Stock)
                             </Button>
                        )}
                        {canReceive && (
                             <Button onClick={() => handleActionClick('receive')} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer">
                                 {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Recepcionar (Ingresará a Stock)
                             </Button>
                        )}
                        {canCancel && (
                             <Button onClick={() => handleActionClick('cancel')} variant="destructive" disabled={loading} className="w-full hover:cursor-pointer">
                                 {loading ? <Loader2 className="animate-spin mr-2" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Cancelar Transferencia
                             </Button>
                        )}
                        
                        {!canShip && !canReceive && !canCancel && (
                            <div className="text-center text-sm text-muted-foreground p-2">
                                Esta transferencia está finalizada y no se pueden realizar más acciones.
                            </div>
                        )}

                        <Button 
                            variant="outline" 
                            onClick={() => stockTransferService.downloadPdf(transfer.id)}
                            className="w-full mt-4 hover:cursor-pointer"
                        >
                            Descargar PDF (Comprobante Legal)
                        </Button>
                    </div>
                </div>
                
                <ConfirmDialog 
                    open={confirmState.open}
                    onOpenChange={(open) => setConfirmState(prev => ({ ...prev, open }))}
                    title={confirmState.action === 'ship' ? 'Despachar Transferencia' : confirmState.action === 'receive' ? 'Recepcionar Transferencia' : 'Cancelar Transferencia'}
                    description={`¿Estás seguro de ${confirmState.action === 'ship' ? 'despachar' : confirmState.action === 'receive' ? 'recepcionar' : 'cancelar'} esta transferencia?`}
                    onConfirm={() => {
                        if (confirmState.action) {
                             handleActionConfirmed(confirmState.action)
                        }
                    }}
                    variant={confirmState.action === 'cancel' ? 'destructive' : 'default'}
                    loading={loading}
                />
            </SheetContent>
        </Sheet>
    )
}
