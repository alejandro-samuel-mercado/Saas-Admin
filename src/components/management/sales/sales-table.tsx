"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { useConfigStore } from "@/store/config.store"
import { Sale } from "@/types/schema"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowUpDown, FileText, Filter, Loader2, Search, Settings2, X } from "lucide-react"
import { useState } from "react"



interface SalesTableProps {
    data: Sale[]
    onView: (sale: Sale) => void
    hideSearch?: boolean
    search?: string
    onSearchChange?: (val: string) => void
    pagination?: {
        page: number
        totalPages: number
        onPageChange: (page: number) => void
    }
    loading?: boolean
}

export function SalesTable({ data, onView, hideSearch = false, search, onSearchChange, pagination, loading }: SalesTableProps) {
    const { config } = useConfigStore()
    const [sorting, setSorting] = useState<any>([])
    const [columnFilters, setColumnFilters] = useState<any>([])
    
    const columns: ColumnDef<Sale>[] = [
        {
            accessorKey: "id",
            header: "ID Venta",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs">#{row.getValue("id")}</span>
                    {row.original.observations && (
                        <span title="Contiene observaciones">
                            <FileText className="h-3 w-3 text-amber-500" />
                        </span>
                    )}
                </div>
            )
        },
        {
            id: "createdAt",
            accessorKey: "createdAt",
            header: ({ column }) => {
                return (
                    <Button className="hover:cursor-pointer" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"))
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{format(date, "d MMM yyyy", { locale: es })}</span>
                        <span className="text-xs text-muted-foreground">{format(date, "HH:mm", { locale: es })} hs</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "user",
            header: "Cliente",
            cell: ({ row }) => {
                const user = row.original.user
                const name = user?.name || row.original.customerName || "Invitado"
                const email = user?.email || row.original.customerEmail || "Sin email"
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{name}</span>
                        <span className="text-xs text-muted-foreground">{email}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "total",
            header: "Total",
            cell: ({ row }) => <span className="font-bold text-emerald-600">{formatCurrency(row.getValue<number>("total"), row.original.currencyCode || config?.baseCurrency || "USD", config?.currencySymbol)}</span>
        },
        {
            accessorKey: "paymentStatus",
            header: "Estado Pago",
            cell: ({ row }) => {
                const status = row.getValue("paymentStatus") as string
                const mpPaymentId = row.original.mpPaymentId
                const paymentType = row.original.paymentType
                
                let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
                let className = ""
                let label = status

                switch (status) {
                    case 'PAID':
                        variant = 'default'
                        className = 'bg-emerald-600 hover:bg-emerald-700'
                        label = "Pagada"
                        break
                    case 'CANCELLED':
                    case 'REJECTED':
                        variant = 'destructive'
                        label = status === 'CANCELLED' ? "Cancelada" : "Rechazada"
                        break
                    case 'PENDING':
                    default:
                        if (paymentType !== 'CASH' && paymentType !== 'TRANSFER' && paymentType !== 'QR') {
                            if (mpPaymentId) {
                                variant = 'secondary'
                                className = 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                label = "Pendiente (Pasarela)"
                            } else {
                                variant = 'outline'
                                className = 'text-muted-foreground italic'
                                label = "Abandonada"
                            }
                        } else {
                            variant = 'secondary'
                            className = 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 hover:bg-amber-200 border-amber-200 dark:border-amber-800'
                            label = paymentType === 'QR' ? "Esperando Pago QR" : "Pendiente Pago"
                        }
                }

                return (
                     <Badge variant={variant} className={className}>
                        {label}
                     </Badge>
                )
            }
        },
        {
            accessorKey: "deliveryStatus",
            header: "Estado de Envío",
            cell: ({ row }) => {
                const status = row.getValue("deliveryStatus") as string
                return (
                     <Badge variant="outline" className={
                                status === 'DELIVERED' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 
                                status === 'SHIPPED' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 
                                status === 'PENDING_DELIVERY' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                                'text-muted-foreground'
                             }>
                                {status==="DELIVERED" ? "Entregada" : status==="SHIPPED" ? "Enviada" : status==="PENDING_DELIVERY" ? "Pendiente" : "Cancelada"}
                             </Badge>
                )
            }
        },
        {
            accessorKey: "paymentType",
            header: "Método Pago",
            cell: ({ row }) => (
                 <span className="text-xs font-medium text-muted-foreground">{row.getValue("paymentType")=== "CASH" ? "Efectivo" : row.getValue("paymentType")=== "TRANSFER" ? "Transferencia" : row.getValue("paymentType")=== "DEBIT" ? "Tarjeta de Débito" : row.getValue("paymentType")=== "CARD" ? "Tarjeta de Crédito" : row.getValue("paymentType")=== "MERCADO_PAGO" ? "Mercado Pago" : row.getValue("paymentType")=== "CHECK" ? "Cheque" : "Otro"}</span>
            )
        },
        {
            accessorKey: "deliveryType",
            header: "Tipo de Entrega",
            cell: ({ row }) => (
                 <span className="text-xs font-medium text-muted-foreground">{row.getValue("deliveryType")=== "DELIVERY" ? "Envío" : row.getValue("deliveryType")=== "PICKUP" ? "Retiro" : "Otro"}</span>
            )
        },
         {
            id: "actions",
            accessorKey: "id",
            header: "",
            cell: ({ row }) => (<Button variant="ghost" size="icon"  className="hover:cursor-pointer"    onClick={() => onView(row.original)}>  <Settings2 className="h-4 w-4" /></Button>)
        }
         
    ]

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: !!pagination,
        pageCount: pagination?.totalPages,
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div className="space-y-4">
            {!hideSearch && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-4 bg-muted/30 rounded-2xl mb-4 border border-border/50">
                    <div className="relative w-full max-w-sm group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary">
                            <Search className="h-4 w-4" />
                        </div>
                        <Input 
                            placeholder="Buscar por ID..." 
                            className="pl-10 pr-4 rounded-full shadow-sm w-full bg-background border-2 border-border"
                            value={search ?? ""}
                            onChange={(event) => onSearchChange?.(event.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
                            <Filter className="h-3 w-3" />
                            Filtrar por:
                        </div>

                        {/* Filtro Tipo Entrega */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase px-1">Tipo de Entrega</span>
                            <Select
                                value={(table.getColumn("deliveryType")?.getFilterValue() as string) ?? "all"}
                                onValueChange={(value) => 
                                    table.getColumn("deliveryType")?.setFilterValue(value === "all" ? "" : value)
                                }
                            >
                                <SelectTrigger className="w-[140px] h-9 rounded-xl bg-background border-2">
                                    <SelectValue placeholder="Tipo Entrega" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="PICKUP">Retiro</SelectItem>
                                    <SelectItem value="DELIVERY">Envío</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro Método Pago */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase px-1">Método de Pago</span>
                            <Select
                                value={(table.getColumn("paymentType")?.getFilterValue() as string) ?? "all"}
                                onValueChange={(value) => 
                                    table.getColumn("paymentType")?.setFilterValue(value === "all" ? "" : value)
                                }
                            >
                                <SelectTrigger className="w-[140px] h-9 rounded-xl bg-background border-2">
                                    <SelectValue placeholder="Método Pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="MERCADO_PAGO">Mercado Pago</SelectItem>
                                    <SelectItem value="CASH">Efectivo</SelectItem>
                                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                    <SelectItem value="DEBIT">Tarjeta Débito</SelectItem>
                                    <SelectItem value="CARD">Tarjeta Crédito</SelectItem>
                                    <SelectItem value="CHECK">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro Estado Envío */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase px-1">Estado de Envío</span>
                            <Select
                                value={(table.getColumn("deliveryStatus")?.getFilterValue() as string) ?? "all"}
                                onValueChange={(value) => 
                                    table.getColumn("deliveryStatus")?.setFilterValue(value === "all" ? "" : value)
                                }
                            >
                                <SelectTrigger className="w-[150px] h-9 rounded-xl bg-background border-2">
                                    <SelectValue placeholder="Estado Envío" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="PENDING_DELIVERY">Pendiente</SelectItem>
                                    <SelectItem value="SHIPPED">En camino</SelectItem>
                                    <SelectItem value="DELIVERED">Entregado</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                    <SelectItem value="REQUIRES_ACTION">Requiere Acción</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {columnFilters.length > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setColumnFilters([])}
                                className="h-9 px-2 text-muted-foreground hover:text-foreground mt-4"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>
            )}
            
            <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-muted/50 border-border">
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} className="text-muted-foreground font-semibold">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
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
                                    <TableRow key={`skeleton-${i}`}>
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
                                        data-state={row.getIsSelected() && "selected"}
                                        className="hover:bg-gray-200 dark:hover:bg-zinc-800/50 text-foreground transition-colors cursor-pointer border-border"
                                        onClick={() => onView(row.original)}
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
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium uppercase tracking-widest italic opacity-50">
                                        No hay resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div className="flex items-center justify-between py-4 px-2">
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-tighter">
                    {pagination ? (
                        <span>Página {pagination.page} de {pagination.totalPages}</span>
                    ) : (
                        <span>{table.getFilteredRowModel().rows.length} resultados</span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"    
                        className="hover:cursor-pointer rounded-xl font-bold uppercase text-[10px] h-9 border-2"
                        onClick={() => pagination ? pagination.onPageChange(pagination.page - 1) : table.previousPage()}
                        disabled={pagination ? pagination.page <= 1 : !table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm" 
                        className="hover:cursor-pointer rounded-xl font-bold uppercase text-[10px] h-9 border-2"
                        onClick={() => pagination ? pagination.onPageChange(pagination.page + 1) : table.nextPage()}
                        disabled={pagination ? pagination.page >= pagination.totalPages : !table.getCanNextPage()}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    )
}
