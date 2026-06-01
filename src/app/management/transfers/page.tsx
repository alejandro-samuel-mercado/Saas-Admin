"use client"

import { TransferDetails } from "@/components/admin/transfers/transfer-details"
import { TransferDialog } from "@/components/admin/transfers/transfer-dialog"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import stockTransferService from "@/services/stock-transfer.service"
import { useBranchStore } from "@/store/branch.store"
import { useAuthStore } from '@/store/use-auth-store'
import { StockTransfer } from "@/types/schema"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeftRight, ArrowRight, Calendar as CalendarIcon, Loader2, Plus, RefreshCw, Settings2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export default function TransfersPage() {
    const [transfers, setTransfers] = useState<StockTransfer[]>([])
    const [loading, setLoading] = useState(true)
    const { activeBranch } = useBranchStore()
    const { user } = useAuthStore()
    const currentUserRole = user?.role?.name || 'EMPLOYEE'
    
    const [createOpen, setCreateOpen] = useState(false)
    const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [status, setStatus] = useState<string>("ALL")

    const loadTransfers = useCallback(async () => {
        setLoading(true)
        try {
            const params: any = activeBranch ? { branchId: activeBranch.id } : {}
            if (status !== "ALL") params.status = status
            if (startDate) params.startDate = startDate.toISOString()
            if (endDate) params.endDate = endDate.toISOString()
            
            const data = await stockTransferService.getAll(params)
            setTransfers(Array.isArray(data) ? data : (data.data || []))
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }, [activeBranch, status, startDate, endDate])

    useEffect(() => {
        loadTransfers()
    }, [activeBranch, status, startDate, endDate, loadTransfers])

    const handleView = (transfer: StockTransfer) => {
        setSelectedTransfer(transfer)
        setDetailsOpen(true)
    }

    const getStatusVariant = (status: string) => {
        if (status === 'COMPLETED') return 'default'
        if (status === 'IN_TRANSIT') return 'secondary'
        if (status === 'CANCELLED') return 'destructive'
        return 'outline'
    }

    return (
        <div className="sm:p-8 px-0 pt-2 space-y-8  pb-40 sm:pb-20 max-w-7xl">
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Inventario</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Transferencias</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between px-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ArrowLeftRight className="h-6 w-6" />
                        Transferencias de Stock
                    </h1>
                    <p className="text-muted-foreground">Mueve mercadería entre branches.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadTransfers} disabled={loading} className="hover:cursor-pointer">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    {currentUserRole !== 'EMPLOYEE' && (
                        <Button onClick={() => setCreateOpen(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Transferencia
                        </Button>
                    )}
                </div>
            </div>

               <div className="flex flex-col md:flex-row gap-4 items-center sm:justify-between ">
                <div className="flex flex-wrap items-center gap-2 w-full px-4  ">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[160px] h-9 bg-background border-input">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
                            <SelectItem value="COMPLETED">Completada</SelectItem>
                            <SelectItem value="CANCELLED">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[140px] justify-start text-left font-normal h-9 border-input bg-background hover:cursor-pointer",
                                    !startDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "dd/MM/yyyy") : <span>Fecha inic.</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-4xl" align="end">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[140px] justify-start text-left font-normal h-9 border-input bg-background hover:cursor-pointer",
                                    !endDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "dd/MM/yyyy") : <span>Fecha fin.</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>

                    {(status !== "ALL" || startDate || endDate) && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setStartDate(undefined); setEndDate(undefined); setStatus("ALL"); }} 
                            className="h-9 w-9 text-muted-foreground hover:cursor-pointer hover:text-destructive hover:bg-destructive/10"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="border-3xl ">
            
                <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  overflow-hidden ">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table >
                            <TableHeader className="bg-muted/500">
                                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <TableHead>ID</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Ruta</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead></TableHead>   
                                   
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transfers.map((t) => (
                                    <TableRow key={t.id} className="cursor-pointer hover:bg-gray-800/20  hover:rounded-2xl    dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800" onClick={() => handleView(t)}>
                                        <TableCell className="font-mono">#{t.id}</TableCell>
                                        <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex  text-sm">
                                                <span className={t.originBranch?.id === activeBranch?.id ? 'font-bold' : ''}>{t.originBranch?.name}</span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                <span className={t.destinationBranch?.id === activeBranch?.id ? 'font-bold' : ''}>{t.destinationBranch?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{t.items?.length || 0}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(t.status) as any}>{t.status}</Badge>
                                        </TableCell>
                                       <TableCell className="">
                                                                                  <Button variant="ghost" size="icon" className="hover:cursor-pointer" onClick={() => handleView(t)}>
                                                                                          <Settings2 className="h-4 w-4" />
                                                                                  </Button>
                                                                                  </TableCell>
                                    </TableRow>
                                ))}
                                {transfers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                            No hay transferencias registradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            <TransferDialog 
                open={createOpen} 
                onOpenChange={setCreateOpen} 
                onSuccess={loadTransfers} 
            />

            <TransferDetails 
                transfer={selectedTransfer}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                onUpdate={loadTransfers}
            />
        </div>
    )
}
