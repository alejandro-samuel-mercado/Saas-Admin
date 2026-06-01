"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { useConfigStore, useRubro } from "@/store/config.store"
import { Product, UserRole } from "@/types/schema"
import { CellContext, ColumnDef, ColumnFiltersState, HeaderContext, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, Boxes, Edit, Loader2, Search, Settings2, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SkuManager } from "./sku-manager"

interface ProductTableProps {
    data: Product[]
    onEdit: (product: Product) => void
    onDelete: (product: Product) => void | Promise<void>
    onSelectionChange?: (selectedIds: number[]) => void
    currentUserRole: UserRole
    pagination?: {
        page: number
        totalPages: number
        onPageChange: (page: number) => void
    }
    search?: string
    onSearchChange?: (value: string) => void
    loading?: boolean
}

export function ProductTable({ data, onEdit, onDelete, onSelectionChange, currentUserRole, pagination, search, onSearchChange, loading }: ProductTableProps) {
    const router = useRouter()
    const { config } = useConfigStore()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
    const rubro = useRubro()

    const columns: ColumnDef<Product>[] = [
        {
            id: "select",
            header: ({ table }: HeaderContext<Product, unknown>) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Seleccionar todos"
                />
            ),
            cell: ({ row }: CellContext<Product, unknown>) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Seleccionar fila"
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "images",
            header: "Imagen",
            cell: ({ row }: CellContext<Product, unknown>) => {
                const img = row.original.images?.[0]
                return (
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-muted border border-border flex items-center justify-center">
                        {img ? (
                            <img src={img} alt={row.getValue("name")} className="h-full w-full object-cover" />
                        ) : (
                            <div className="text-xs text-muted-foreground">N/A</div>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "name",
            header: ({ column }: HeaderContext<Product, unknown>) => {
                return (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:cursor-pointer">
                        Producto
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }: CellContext<Product, unknown>) => (
                <div>
                    <div className="font-bold text-foreground">{row.getValue("name")}</div>
                    <div className="text-xs text-muted-foreground">SKU: {row.original.skus?.[0]?.code || 'N/A'}</div>
                </div>
            )
        },
        {
            accessorKey: "brand",
            header: "Marca/Modelo",
            cell: ({ row }: CellContext<Product, unknown>) => (
                <div className="text-sm">
                    <span className="font-medium text-foreground">{row.original.brand || '-'}</span>
                    {row.original.model && <span className="text-muted-foreground ml-1">/ {row.original.model}</span>}
                </div>
            )
        },
        {
            accessorKey: "basePrice",
            header: "Precio Base",
            cell: ({ row }: CellContext<Product, unknown>) => <span className="font-medium text-foreground">{formatCurrency(row.getValue("basePrice") as number, config?.baseCurrency, config?.currencySymbol)}</span>
        },
        {
            id: "costPrice",
            header: "Precio de compra",
            cell: ({ row }: CellContext<Product, unknown>) => {
                const cost = row.original.costPrice || row.original.skus?.[0]?.costPrice || 0;
                return <span className="font-medium text-foreground">{formatCurrency(Number(cost), config?.baseCurrency, config?.currencySymbol)}</span>
            }
        },
        {
            accessorKey: "stock",
            header: "Stock",
            cell: ({ row }: CellContext<Product, unknown>) => {

                const stock = row.original.skus?.reduce((acc: number, sku: { stock: number | string }) => acc + Number(sku.stock), 0) ?? 0
                const unit = row.original.measurementUnit?.toLowerCase() || 'unid.'
                const displayStock = row.original.allowFractional ? stock.toFixed(3).replace(/\.?0+$/, '') : Math.floor(stock)

                return (
                    <Badge variant={stock > 0 ? 'outline' : 'destructive'} className={stock > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                        {displayStock} {unit}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "category",
            header: "Categoría",
            cell: ({ row }: CellContext<Product, unknown>) => (
                <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">
                    {row.original.category?.name || 'Sin Categoría'}
                </Badge>
            )
        },
        {
            accessorKey: "isActive",
            header: "Estado",
            cell: ({ row }: CellContext<Product, unknown>) => {
                const isActive = row.getValue("isActive")
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-muted text-muted-foreground'}>
                        {isActive ? 'Publicado' : 'Borrador'}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            cell: ({ row }: CellContext<Product, unknown>) => {
                const product = row.original
                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:cursor-pointer hover:text-foreground">
                                    <span className="sr-only">Abrir menú</span>
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground shadow-xl z-50 min-w-[200px]">
                                <DropdownMenuLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider px-4 py-2"></DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onEdit(product)} className="hover:bg-secondary/5 cursor-pointer p-3 text-sm font-medium transition-colors">
                                    <Edit className="mr-3 h-5 w-5 text-secondary" /> Editar Producto
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    setSelectedSkuProduct(product)
                                    setSkuManagerOpen(true)
                                }} className="hover:bg-secondary/5 cursor-pointer p-3 text-sm font-medium transition-colors border-b border-border">
                                    <Boxes className="mr-3 h-5 w-5 text-secondary" /> Gestionar Variantes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete(product)
                                    }}
                                    className="hover:bg-red-500/5 cursor-pointer p-3 text-sm font-medium transition-colors text-red-600 focus:text-red-700"
                                >
                                    <Trash className="mr-3 h-5 w-5" /> Eliminar Producto
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ].filter(col => {
        if (col.id === 'actions' && currentUserRole === 'EMPLOYEE') return false;
        if (col.accessorKey === 'brand' && rubro?.slug === 'inmuebles') return false;
        return true;
    })

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
        manualPagination: !!pagination,
        pageCount: pagination?.totalPages,
    })

    useEffect(() => {
        if (onSelectionChange) {
            const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
            onSelectionChange(selectedIds);
        }
    }, [rowSelection, onSelectionChange, table])

    const [skuManagerOpen, setSkuManagerOpen] = useState(false)
    const [selectedSkuProduct, setSelectedSkuProduct] = useState<Product | null>(null)

    return (
        <div className="space-y-4">


            <div className="flex items-center justify-between px-2">
                <div className="relative w-full max-w-sm group ">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary">
                        <Search className="h-4 w-4" />
                    </div>
                    <Input
                        placeholder="Buscar por nombre, marca, modelo o SKU..."
                        value={search ?? ""}
                        onChange={(event) => onSearchChange?.(event.target.value)}
                        className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20"
                    />
                </div>
            </div>

            <div className="sm:rounded-3xl rounded-none border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className=" border-border">
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
                                <TableRow key={`loading-${i}`} className="border-border">
                                    {columns.map((_, j) => (
                                        <TableCell key={`loading-cell-${j}`} className="h-16">
                                            <div className="h-4 bg-muted animate-pulse rounded w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => router.push(`/management/products/detail?id=${row.original.id}`)}
                                    className="hover:bg-gray-800/20  hover:rounded-2xl    transition-colors border-border cursor-pointer"
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
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between py-4 px-2">
                <div className="text-sm text-muted-foreground">
                    {pagination ? (
                        <span>Página {pagination.page} de {pagination.totalPages}</span>
                    ) : (
                        <span>{table.getFilteredRowModel().rows.length} productos</span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination ? pagination.onPageChange(pagination.page - 1) : table.previousPage()}
                        disabled={pagination ? pagination.page <= 1 : !table.getCanPreviousPage()}
                        className="border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination ? pagination.onPageChange(pagination.page + 1) : table.nextPage()}
                        disabled={pagination ? pagination.page >= pagination.totalPages : !table.getCanNextPage()}
                        className="border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>

            {selectedSkuProduct && (
                <SkuManager
                    open={skuManagerOpen}
                    onOpenChange={setSkuManagerOpen}
                    product={selectedSkuProduct}
                    onUpdate={() => {

                        router.refresh()
                    }}
                />
            )}
        </div>
    )
}


