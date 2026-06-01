"use client"

import { PurchaseDetails } from "@/components/admin/purchases/purchase-details"
import { PurchaseForm } from "@/components/admin/purchases/purchase-form"
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
import branchService from "@/services/branch.service"
import { Purchase, purchaseService } from "@/services/purchase.service"
import { supplierService } from "@/services/supplier.service"
import { useConfigStore } from "@/store/config.store"
import { useAuthStore } from "@/store/use-auth-store"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowUpDown, Calendar as CalendarIcon, Loader2, Plus, Search, ShoppingCart, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

export default function PurchasesPage() {
    const { config } = useConfigStore()
    const router = useRouter()
    const { user } = useAuthStore()
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [branches, setBranches] = useState<any[]>([])
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    
    const [isNewModalOpen, setIsNewModalOpen] = useState(false)
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null)
   
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [status, setStatus] = useState<string>("ALL")
    const [supplierId, setSupplierId] = useState<string>("ALL")
    const [branchId, setBranchId] = useState<string>("ALL")

 
    const [sorting, setSorting] = useState<any>([])
    const [columnFilters, setColumnFilters] = useState<any>([])



    const loadFilters = async () => {
        try {
            const [suppliersRes, branchesData] = await Promise.all([
                supplierService.getAll({ active: true }),
                branchService.getAll()
            ])
            setSuppliers(suppliersRes?.data || [])
            setBranches(Array.isArray(branchesData) ? branchesData : [])
        } catch (error) {
        }
    }

    const fetchPurchases = useCallback(async () => {
        try {
            setLoading(true)
            const params: any = {}
            if (search) params.search = search 
            if (status !== "ALL") params.status = status
            if (supplierId !== "ALL") params.supplierId = supplierId
            if (branchId !== "ALL") params.branchId = branchId
            if (startDate) params.startDate = startDate.toISOString()
            if (endDate) params.endDate = endDate.toISOString()

            const data = await purchaseService.getAll(params)
            setPurchases(Array.isArray(data) ? data : data?.data || [])
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }, [search, startDate, endDate, status, supplierId, branchId])

    useEffect(() => {
        loadFilters()
    }, [])

    useEffect(() => {
        fetchPurchases()
    }, [fetchPurchases])

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
        setStatus("ALL")
        setSupplierId("ALL")
        setBranchId("ALL")
        setSearch("")
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return "bg-secondary text-secondary-foreground"
            case 'CONFIRMED': return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            case 'RECEIVED': return "bg-emerald-600 hover:bg-emerald-700 text-white"
            case 'CANCELLED': return "bg-destructive/10 text-destructive border-destructive/20"
            default: return "bg-secondary text-secondary-foreground"
        }
    }

    const translateStatus = (status: string) => {
        switch (status) {
            case 'DRAFT': return "Borrador"
            case 'CONFIRMED': return "Confirmada"
            case 'RECEIVED': return "Recibida"
            case 'CANCELLED': return "Cancelada"
            default: return status
        }
    }

    const columns = useMemo<ColumnDef<Purchase>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => <span className="font-mono font-bold text-xs">#{row.original.id}</span>
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:cursor-pointer">
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.original.createdAt)
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{format(date, "d MMM yyyy", { locale: es })}</span>
                        <span className="text-xs text-muted-foreground">{format(date, "HH:mm", { locale: es })} hs</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "branch.name",
            header: "Sucursal",
            cell: ({ row }) => <span className="font-medium text-sm">{row.original.branch?.name}</span>
        },
        {
            accessorKey: "supplier.tradeName",
            header: "Proveedor",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.original.supplier?.tradeName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.supplier?.email}</span>
                </div>
            )
        },
        {
            accessorKey: "estimatedTotal",
            header: "Total",
            cell: ({ row }) => (
                <span className="font-bold text-emerald-600">
                    {formatCurrency(Number(row.original.estimatedTotal), config?.baseCurrency || "USD", config?.currencySymbol)}
                </span>
            )
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                const statusValue = row.original.status
                return (
                    <Badge variant={statusValue === 'RECEIVED' ? 'default' : 'secondary'} className={cn(getStatusColor(statusValue))}>
                        {translateStatus(statusValue)}
                    </Badge>
                )
            }
        },
        {
            id: "payment",
            header: "Pago",
            cell: ({ row }) => row.original.payment ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-700">
                    Pagado
                </Badge>
            ) : (
                <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                    Pendiente
                </Badge>
            )
        }
    ], [])

    const table = useReactTable({
        data: purchases,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    return (
        <div className="sm:p-8 pt-2 space-y-6 pb-40 sm:pb-20">
            <Skeleton className="hidden" />
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink>Compras</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6" />
                        Órdenes de Compra
                    </h1>
                    <p className="text-muted-foreground">Gestiona el historial de compras y reposición.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm text-white hover:cursor-pointer" onClick={() => setIsNewModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Orden
                    </Button>
                </div>
            </div>

            {/* Patrón estricto de filtros */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-4 gap-6">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500">
                            <Search className="h-4 w-4" />
                        </div>
                        <Input 
                            placeholder="Buscar por ID..." 
                            className="pl-9 bg-gray-200 border-3 border-gray-400/20 transition-all rounded-md"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 sm:mt-1 w-[80%] sm:w-full ">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="sm:w-[180px]  bg-background border-input">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los Estados</SelectItem>
                                <SelectItem value="DRAFT">Borrador</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                                <SelectItem value="RECEIVED">Recibida</SelectItem>
                                <SelectItem value="CANCELLED">Cancelada</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger className="sm:w-[200px] bg-background border-input">
                                 <SelectValue placeholder="Proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                                 <SelectItem value="ALL">Todos los Proveedores</SelectItem>
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
                                        "sm:w-[140px] w-[100%] justify-start text-left font-normal bg-background border-input hover:cursor-pointer",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "dd/MM/yy") : "Desde"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
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
                                        "sm:w-[140px] w-[100%] justify-start text-left font-normal bg-background border-input hover:cursor-pointer",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "dd/MM/yy") : "Hasta"}
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

                        { (status !== "ALL" || supplierId !== "ALL" || search || startDate || endDate) && (
                            <Button variant="ghost" size="icon" onClick={clearFilters} className="text-muted-foreground hover:cursor-pointer">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative">
                <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-purple-500 hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="border-border hover:bg-muted/50">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="text-muted-foreground font-semibold">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody className="relative min-h-[200px]">
                            {loading && (
                                <TableRow className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                    <TableCell colSpan={columns.length} className="border-none flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Cargando...</p>
                                    </TableCell>
                                </TableRow>
                            )}
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={`skeleton-${i}`} className="border-border">
                                        {columns.map((_, j) => (
                                            <TableCell key={`cell-${i}-${j}`}>
                                                <Skeleton className="h-6 w-full bg-zinc-400/20" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow 
                                        key={row.id} 
                                        className="hover:bg-gray-800/20 text-foreground transition-colors cursor-pointer border-border"
                                        onClick={() => setSelectedPurchaseId(row.original.id)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-72 text-center text-muted-foreground">
                                        No hay resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="hover:cursor-pointer"
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="hover:cursor-pointer"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>

            <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
                <DialogContent className="sm:max-w-[1000px] overflow-y-auto overflow-x-auto max-h-[90vh] bg-background text-foreground border-4 border-secondary/60 shadow-2xl  transition-all duration-200">
                    <div className="py-2">
                        <PurchaseForm onSuccess={() => { setIsNewModalOpen(false); fetchPurchases(); }} onCancel={() => setIsNewModalOpen(false)} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={selectedPurchaseId !== null} onOpenChange={(open) => !open && setSelectedPurchaseId(null)}>
                <DialogContent className="sm:max-w-[1200px] overflow-y-auto max-h-[90vh] bg-background text-foreground border-4 border-secondary/60 shadow-2xl  transition-all duration-200">
                    {selectedPurchaseId && (
                        <div className="py-2">
                            <PurchaseDetails 
                                id={selectedPurchaseId} 
                                onClose={() => setSelectedPurchaseId(null)}
                                onUpdate={fetchPurchases}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
