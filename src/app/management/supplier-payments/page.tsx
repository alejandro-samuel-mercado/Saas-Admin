"use client"

import { SupplierPaymentForm } from "@/components/admin/supplier-payments/supplier-payment-form"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn, formatCurrency } from "@/lib/utils"
import supplierPaymentService from "@/services/supplier-payment.service"
import { supplierService } from "@/services/supplier.service"
import { useConfigStore } from "@/store/config.store"
import { useAuthStore } from "@/store/use-auth-store"
import { SupplierPayment } from "@/types/schema"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, DollarSign, Loader2, Plus, Search, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"

function SupplierPaymentsContent() {
  const { config: storeConfig } = useConfigStore();
    const searchParams = useSearchParams()
    const { user } = useAuthStore()
    const [payments, setPayments] = useState<SupplierPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [limit] = useState(20)
    const [suppliers, setSuppliers] = useState<any[]>([])
    
  
    const [search, setSearch] = useState("")
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [method, setMethod] = useState<string>("ALL")
    const [supplierId, setSupplierId] = useState<string>("ALL")

    const [isNewModalOpen, setIsNewModalOpen] = useState(false)
    const urlPurchaseId = searchParams?.get('purchaseId')
    const urlSupplierId = searchParams?.get('supplierId')

    useEffect(() => {
        loadFilters()
        if (urlPurchaseId || urlSupplierId) {
            setIsNewModalOpen(true)
        }
    }, [urlPurchaseId, urlSupplierId])



    const loadFilters = async () => {
        try {
            const suppliersRes = await supplierService.getAll({ active: true })
            setSuppliers(suppliersRes?.data || [])
        } catch (error) {
        }
    }

    const fetchPayments = useCallback(async (pageNum = page) => {
        try {
            setLoading(true)
            const params: any = {
                page: pageNum,
                limit
            }
            if (search) params.search = search 
            if (supplierId !== "ALL") params.supplierId = supplierId
            if (method !== "ALL") params.method = method
            if (startDate) params.startDate = startDate.toISOString()
            if (endDate) params.endDate = endDate.toISOString()

            const response = await supplierPaymentService.getAll(params)
            
            const paymentsArray = response?.data?.data || response?.data || response || []
            setPayments(Array.isArray(paymentsArray) ? paymentsArray : [])
            setTotalPages(response?.data?.totalPages || response?.totalPages || 1)
            setPage(response?.data?.page || response?.page || 1)
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }, [search, startDate, endDate, method, supplierId, page, limit])

    useEffect(() => {
        fetchPayments(1)
    }, [startDate, endDate, method, supplierId])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
        setMethod("ALL")
        setSupplierId("ALL")
        setSearch("")
    }

    if (user?.role?.name !== 'SUPER_ADMIN' && user?.role?.name !== 'ADMIN') {
         return <div className="p-8 text-center text-zinc-400">Acceso restringido</div>
    }

    return (
        <div className="sm:p-8 px-0 pt-2 pl-0 space-y-8  pb-40 sm:pb-20">
             <Breadcrumb>
                <BreadcrumbList className="px-2">
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Compras</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Pagos a Proveedores</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <DollarSign className="h-6 w-6" />
                        Pagos a Proveedores
                    </h1>
                    <p className="text-muted-foreground">
                        Historial de pagos realizados a proveedores.
                    </p>
                </div>
                <Button className="hover:cursor-pointer" onClick={() => setIsNewModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Pago
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between  p-4">
                <div className="w-full md:w-1/3 relative">
                    <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
                        <Search className="h-4 w-4" />
                    </div>
                    <Input 
                        placeholder="Buscar por referencia..." 
                        className="pl-9 bg-gray-200 border-3 border-gray-400/20 transition-all placeholder:text-muted-foreground"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Select value={method} onValueChange={setMethod}>
                        <SelectTrigger className="w-[140px] h-9 bg-background border-input">
                            <SelectValue placeholder="Método" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="CASH">Efectivo</SelectItem>
                            <SelectItem value="TRANSFER">Transferencia</SelectItem>
                            <SelectItem value="CHECK">Cheque</SelectItem>
                            <SelectItem value="MERCADO_PAGO">Mercado Pago</SelectItem>
                            <SelectItem value="OTHER">Otro</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={supplierId} onValueChange={setSupplierId}>
                        <SelectTrigger className="w-[140px] h-9 bg-background border-input">
                            <SelectValue placeholder="Proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            {suppliers.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.tradeName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[130px] justify-start text-left font-normal h-9 border-input bg-background hover:cursor-pointer",
                                    !startDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "dd/MM/yyyy") : <span>Fecha inic.</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[130px] justify-start text-left font-normal h-9 border-input bg-background hover:cursor-pointer",
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
                            />
                        </PopoverContent>
                    </Popover>

                    {(method !== "ALL" || supplierId !== "ALL" || startDate || endDate) && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="relative">
                <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-purple-500 hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-muted/50 border-border">
                                <TableHead className="text-muted-foreground font-semibold">ID</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Proveedor</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Monto</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Método</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Referencia</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Fecha</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Orden de Compra</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="relative min-h-[200px]">
                            {loading && (
                                <TableRow className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                    <TableCell colSpan={7} className="border-none flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Cargando...</p>
                                    </TableCell>
                                </TableRow>
                            )}
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={`skeleton-${i}`} className="border-border">
                                        <TableCell><Skeleton className="h-4 w-8 bg-zinc-400/20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32 bg-zinc-400/20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24 bg-zinc-400/20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 bg-zinc-400/20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24 bg-zinc-400/20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 bg-zinc-400/20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-12 bg-zinc-400/20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No se encontraron pagos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id} className="hover:bg-gray-800/20  hover:rounded-2xl    text-foreground transition-colors border-border">
                                        <TableCell className="text-muted-foreground font-mono text-xs">#{payment.id}</TableCell>
                                        <TableCell className="font-medium">
                                            {payment.supplier?.tradeName || 'Desconocido'}
                                        </TableCell>
                                        <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                            {formatCurrency(payment.amount, storeConfig?.baseCurrency || "USD", storeConfig?.currencySymbol)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-border text-foreground bg-muted/50">
                                                {payment.method}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-foreground">
                                            {payment.reference || '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {payment.purchaseId ? (
                                                <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                                    #{payment.purchaseId}
                                                </span>
                                            ) : <span className="text-muted-foreground text-xs italic">Sin Orden</span>}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 rounded-2xl border-4 border-zinc-200 dark:border-zinc-800 shadow-sm mt-4">
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        Página {page} de {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchPayments(page - 1)}
                            disabled={page === 1 || loading}
                            className="rounded-xl font-bold uppercase text-[10px] h-9 border-2 hover:cursor-pointer"
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchPayments(page + 1)}
                            disabled={page === totalPages || loading}
                            className="rounded-xl font-bold uppercase text-[10px] h-9 border-2 hover:cursor-pointer"
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
                <DialogContent className="sm:max-w-[750px] overflow-y-auto max-h-[90vh] border-4 border-secondary/60 shadow-2xl">
                    <div className="py-2">
                        <SupplierPaymentForm 
                            onSuccess={() => { setIsNewModalOpen(false); fetchPayments(); }}
                            onCancel={() => setIsNewModalOpen(false)}
                            initialPurchaseId={urlPurchaseId || undefined}
                            initialSupplierId={urlSupplierId || undefined}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function SupplierPaymentsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
            <SupplierPaymentsContent />
        </Suspense>
    )
}
