"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import api from "@/services/api"
import { InventoryItem, formatPrice, formatStock } from "@/services/stock-control.service"
import { useBranchStore } from "@/store/branch.store"
import { useConfigStore } from "@/store/config.store"
import { useAuthStore } from "@/store/use-auth-store"
import { UserRole } from "@/types/schema"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Edit3, Loader2, Settings2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { BulkEditDialog } from "./bulk-edit-dialog"
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"

interface StockTableProps {
    data: InventoryItem[]
    onRefresh: () => void
    lowThreshold?: number
    criticalThreshold?: number
    pagination?: {
        page: number
        totalPages: number
        onPageChange: (page: number) => void
    }
    loading?: boolean
}

export function StockTable({ 
    data,
    onRefresh,
    lowThreshold,
    criticalThreshold,
    pagination,
    loading
}: StockTableProps) {
    const { activeBranch } = useBranchStore()
    const [branches, setBranches] = useState<any[]>([])
    const { user } = useAuthStore()
    const { config } = useConfigStore()
    const currentUserRole = (user?.role?.name || 'EMPLOYEE') as UserRole
    const [sorting, setSorting] = useState<any>([])
    const [columnFilters, setColumnFilters] = useState<any>([])
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [bulkEditOpen, setBulkEditOpen] = useState(false)

    useEffect(() => {
        api.get('/branches').then(res => {
            const fetchedBranches = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setBranches(fetchedBranches.filter((b: any) => b.isActive));
        }).catch(() => {});
    }, []);

    const renderStockCell = (item: InventoryItem, stockAmount: number) => {
        const low = lowThreshold ?? item.minStock ?? 10;
        const critical = criticalThreshold ?? 5;
        const isEmpty = stockAmount === 0;
        const isCritical = !isEmpty && stockAmount <= critical;
        const isLow = !isEmpty && !isCritical && stockAmount <= low;
        
        let extraClasses = '';
        if (isCritical) {
            extraClasses = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
        } else if (isLow) {
            extraClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
        }

        return (
            <div className="flex items-center gap-1.5 ">
                <Badge variant={isEmpty || isCritical ? "destructive" : "outline"}
                    className={extraClasses}>
                    {formatStock(stockAmount, item.measurementUnit ?? 'UNIDAD')}
                </Badge>
            </div>
        );
    };
    
    const columns: ColumnDef<InventoryItem>[] = useMemo(() => {
        const baseCols: ColumnDef<InventoryItem>[] = [
            {
                id: "select",
                header: ({ table }: { table: any }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Seleccionar todos"
                    />
                ),
                cell: ({ row }: { row: any }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value:any) => row.toggleSelected(!!value)}
                        aria-label="Seleccionar fila"
                        onClick={(e) => e.stopPropagation()}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "skuCode",
                header: "SKU",
                cell: ({ row }: { row: any }) => <span className="font-mono text-xs whitespace-nowrap">{row.getValue("skuCode")}</span>,
                meta: { className: "w-[120px]" } as any
            },
            {
                accessorKey: "productName",
                header: "Producto",
                cell: ({ row }: { row: any }) => {
                    const variant = row.original.variant;
                    return (
                        <div className="flex flex-col py-2">
                            <div className="font-medium leading-tight whitespace-normal break-words">
                                {row.getValue("productName")}
                                {variant && <span className="text-foreground font-bold ml-1">({variant})</span>}
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-tight mt-1">{row.original.categoryName}</span>
                        </div>
                    );
                },
                meta: { className: "min-w-[250px]" } as any
            },
            {
                accessorKey: "price",
                header: "Precio",
                cell: ({ row }: { row: any }) => {
                    const item = row.original
                    return (
                        <span className="font-mono">{formatPrice(parseFloat(item.price), item.measurementUnit, config?.baseCurrency || 'USD', config?.currencySymbol)}</span>
                    )
                },
                meta: { className: "w-[140px]" } as any
            },
        ];

        const metricCols: ColumnDef<InventoryItem>[] = []

        if (activeBranch) {
            metricCols.push({
                id: `stock_${activeBranch.id}`,
                header: () => <span className="font-semibold">Stock - {activeBranch.name}</span>,
                cell: ({ row }: { row: any }) => renderStockCell(row.original, row.original.stock),
                meta: { isHighlighted: true } as any
            });
        }

        branches.forEach(b => {
            if (activeBranch && b.id === activeBranch.id) return;
            metricCols.push({
                id: `stock_branch_${b.id}`,
                header: `Stock - ${b.name}`,
                cell: ({ row }: { row: any }) => {
                    const bs = row.original.branchStocks?.find((bs: any) => bs.branchId === b.id);
                    return renderStockCell(row.original, bs?.stock || 0);
                }
            });
        });

        metricCols.push({
            id: `stock_total`,
            header: "Stock Total",
            cell: ({ row }: { row: any }) => renderStockCell(row.original, row.original.totalStock || 0)
        });

        const endCols: ColumnDef<InventoryItem>[] = [
            {
                id: "actions",
                header: "Acciones",
                cell: ({ row }: { row: any }) => {
                    const item = row.original
                    return (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                setSelectedItem(item)
                                setDialogOpen(true)
                            }}
                            className="h-8 w-8 p-0 hover:cursor-pointer"
                            title="Ajustar Stock"
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    )
                },
                meta: { className: "w-[80px] text-center" } as any
            }
        ];

        return [...baseCols, ...metricCols, ...endCols].filter(col => {
            if (col.id === 'actions') {
                const canEditManual = config?.enableManualStock !== false;
                if (!activeBranch || (currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'ADMIN') || !canEditManual) {
                    return false;
                }
            }
            return true;
        });

    }, [activeBranch, branches, currentUserRole, lowThreshold, criticalThreshold, config]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
        manualPagination: true,
    })

    const selectedRows = table.getSelectedRowModel().rows.map(r => r.original)
    const selectedCount = selectedRows.length

    return (
        <div className="space-y-4 pb-40 sm:pb-20">
           
            {selectedCount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-secondary/10 border border-secondary/30 rounded-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-secondary">
                            {selectedCount} producto(s) seleccionado(s)
                        </span>
                        {activeBranch && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && config?.enableManualStock !== false && (
                            <Button
                                size="sm"
                                onClick={() => setBulkEditOpen(true)}
                                className="h-8 gap-1.5 hover:cursor-pointer"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edición Masiva
                            </Button>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => table.resetRowSelection()}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="sm:rounded-3xl border-[1px] border-zinc-300 dark:border-zinc-800 shadow-[0_0_20px_rgba(0,0,0,0.02)] hover:shadow-[0_0_30px_rgba(0,0,0,0.04)] hover:border-borderH transition-all duration-300 bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-muted/50 border-border">
                                {headerGroup.headers.map((header) => {
                                    const meta = (header.column.columnDef as any).meta;
                                    return (
                                        <TableHead 
                                            key={header.id} 
                                            className={cn(
                                                "text-muted-foreground font-semibold",
                                                meta?.isHighlighted && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
                                                meta?.className
                                            )}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
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
                                    className={`text-foreground transition-colors border-border hover:bg-gray-800/20 hover:rounded-2xl data-[state=selected]:bg-secondary/5 ${row.original.stock <= row.original.minStock ? "bg-destructive/10" : ""}`}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const meta = (cell.column.columnDef as any).meta;
                                        return (
                                            <TableCell 
                                                key={cell.id} 
                                                className={cn(
                                                    meta?.isHighlighted && "bg-indigo-50/50 dark:bg-indigo-950/20",
                                                    meta?.className
                                                )}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                    No hay productos en esta branch.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <StockAdjustmentDialog 
                item={selectedItem}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={onRefresh}
            />

            <BulkEditDialog
                open={bulkEditOpen}
                onOpenChange={setBulkEditOpen}
                selectedItems={selectedRows}
                onSuccess={() => {
                    table.resetRowSelection()
                    onRefresh()
                }}
            />

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <span className="text-sm text-muted-foreground">
                        Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
