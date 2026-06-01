"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { TransfersAPI } from "@/services/api"
import { useBranchStore } from "@/store/branch.store"
import { Transfer } from "@/types/schema"
import { CheckCircle, Image as ImageIcon, Loader2, RefreshCw, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export function TransfersTab() {
    const { activeBranch } = useBranchStore()
    const [statusFilter, setStatusFilter] = useState<string>("PENDIENTE")
    const [transfers, setTransfers] = useState<Transfer[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTransfers = useCallback(async () => {
        if (!activeBranch) {
            return
        }
        
        setLoading(true)
        try {
            const data = await TransfersAPI.getAll({ branchId: activeBranch.id })
            setTransfers(data)
        } catch (error) {
            toast.error("Error al cargar transferencias")
        } finally {
            setLoading(false)
        }
    }, [activeBranch])

    useEffect(() => {
        fetchTransfers()
    }, [activeBranch, fetchTransfers])

    const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            await TransfersAPI.updateStatus(id, status)
            toast.success(`Transferencia ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} correctamente`)
            fetchTransfers()
        } catch (error) {
            toast.error("Error al actualizar estado")
        }
    }

    const filteredTransfers = transfers.filter(t => t.status === statusFilter)

    return (
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                     <h2 className="text-lg font-bold">Transferencias</h2>
                     <p className="text-sm text-muted-foreground">Valida comprobantes de clientes.</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    <Button variant="ghost" size="icon" className="hover:cursor-pointer" onClick={fetchTransfers} disabled={loading}>
                        <RefreshCw className={`w-4  h-4  ${loading ? 'animate-spin' : ''}`} />
                    </Button>

                    <div className="bg-muted p-1 rounded-lg flex space-x-1">
                        <Button 
                            variant={statusFilter === 'PENDING' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setStatusFilter('PENDING')}
                            className="text-xs hover:cursor-pointer"
                        >
                            Pendientes ({transfers.filter(t => t.status === 'PENDING').length})
                        </Button>
                        <Button 
                            variant={statusFilter === 'APPROVED' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setStatusFilter('APPROVED')}
                            className="text-xs hover:cursor-pointer"
                        >
                            Aceptadas
                        </Button>
                        <Button 
                            variant={statusFilter === 'REJECTED' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setStatusFilter('REJECTED')}
                            className="text-xs hover:cursor-pointer"
                        >
                            Rechazadas
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto space-y-3">
                 {loading && filteredTransfers.length === 0 ? (
                     <div className="flex items-center justify-center h-40">
                         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                     </div>
                 ) : filteredTransfers.length === 0 ? (
                     <div className="text-center py-20 text-muted-foreground">
                         No hay transferencias en este estado.
                     </div>
                 ) : (
                     filteredTransfers.map(t => (
                        <div key={t.id} className="flex items-start justify-between p-4 border border-border rounded-lg hover:border-secondary/50 transition-all bg-card shadow-sm group">
                            <div className="flex gap-4">
                                <a 
                                    href={t.imageUrl || "#"} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="h-16 w-16 bg-muted rounded-md flex items-center justify-center border border-border overflow-hidden relative hover:opacity-80 transition-opacity"
                                >
                                    {t.imageUrl ? (
                                        <img src={t.imageUrl} alt="Comprobante" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="text-zinc-400" />
                                    )}
                                </a>
                                <div>
                                    <h4 className="font-bold flex items-center gap-2">
                                        {t.user?.name || "Usuario Desconocido"}
                                        {t.status === 'PENDING' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>}
                                        {t.status === 'APPROVED' && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Aprobado</Badge>}
                                        {t.status === 'REJECTED' && <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Rechazado</Badge>}
                                    </h4>
                                    <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                                        <p>DNI: {t.user?.dni || "-"}</p>
                                        <p>Tel: {t.user?.phone || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="font-bold text-2xl tracking-tight">{formatCurrency(t.amount)}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    {t.imageUrl && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 text-muted-foreground hover:text-foreground hover:cursor-pointer"
                                            onClick={() => window.open(t.imageUrl, '_blank')}
                                        >
                                            <ImageIcon className="w-4 h-4 mr-2" /> Ver Comprobante
                                        </Button>
                                    )}

                                    {t.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer"
                                                onClick={() => handleUpdateStatus(t.id, 'APPROVED')}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="outline" 
                                                className="h-9 w-9 text-destructive border-destructive/20 hover:bg-destructive/10 hover:cursor-pointer"
                                                onClick={() => handleUpdateStatus(t.id, 'REJECTED')}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                    {t.status !== 'PENDING' && (
                                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 h-9 px-3">
                                            {t.status === 'APPROVED' ? (
                                                <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Aprobado</span>
                                            ) : (
                                                <span className="text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3"/> Rechazado</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                     ))
                 )}
            </div>
        </div>
    )
}
