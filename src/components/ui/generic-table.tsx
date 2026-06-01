"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ColumnDef, ColumnFiltersState, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Loader2, Plus, Search, Settings2, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Skeleton } from "./skeleton"

interface GenericTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    searchKey: string
    onEdit?: (item: T) => void
    onDelete?: (item: T) => void
    onCreate?: () => void
    onRowClick?: (item: T) => void
    createText?: string
    search?: string
    onSearchChange?: (val: string) => void
    pagination?: {
        page: number
        totalPages: number
        onPageChange: (page: number) => void
    }
    loading?: boolean
}

export function GenericTable<T>({ 
    data, 
    columns, 
    searchKey, 
    onEdit, 
    onDelete, 
    onCreate, 
    onRowClick,
    createText = "Crear Nuevo",
    search,
    onSearchChange,
    pagination,
    loading
}: GenericTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const tableColumns = useMemo(() => {
        const cols = [...columns]
        if (onEdit || onDelete) {
            cols.push({
                id: "actions",
                header: "",
                cell: ({ row }) => {
                    const item = row.original
                    return (
                        <div className="flex items-center gap-2">
                            {onEdit && (
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="hover:cursor-pointer" title="Configurar / Editar">
                                    <Settings2 className="h-4 w-4 " />
                                </Button>
                            )}
                            {onDelete && (
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="hover:cursor-pointer hover:bg-red-500/10 hover:text-red-500" title="Eliminar">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                    )
                }
            })
        }
        return cols
    }, [columns, onEdit, onDelete])

    const table = useReactTable({
        data,
        columns: tableColumns,
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
        <div className="space-y-4 ">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Buscar por ${searchKey}...`}
                            value={pagination ? (search ?? "") : (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                pagination ? onSearchChange?.(event.target.value) : table.getColumn(searchKey)?.setFilterValue(event.target.value)
                            }
                            className="pl-10 pr-4 rounded-full shadow-sm w-full bg-background border-2 border-border"
                        />
                    </div>
                </div>
                {onCreate && (
                    <Button onClick={onCreate} className="rounded-xl shadow-sm hover:cursor-pointer flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {createText}
                    </Button>
                )}
            </div>
            
            <div className="sm:rounded-3xl rounded-none border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
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
                                <TableCell colSpan={tableColumns.length} className="border-none flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Cargando...</p>
                                </TableCell>
                            </TableRow>
                        )}
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`}>
                                    {tableColumns.map((_, j) => (
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
                                    onClick={(onEdit || onRowClick) ? () => (onEdit || onRowClick)?.(row.original) : undefined}
                                    className={`${(onEdit || onRowClick) ? "cursor-pointer" : ""} hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors`}
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
                                <TableCell colSpan={tableColumns.length} className="h-24 text-center text-muted-foreground font-medium uppercase tracking-widest italic opacity-50">
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
                        <span>{table.getFilteredRowModel().rows.length} resultados</span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination ? pagination.onPageChange(pagination.page - 1) : table.previousPage()}
                        disabled={pagination ? pagination.page <= 1 : !table.getCanPreviousPage()}
                        className="hover:cursor-pointer disabled:cursor-not-allowed"
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination ? pagination.onPageChange(pagination.page + 1) : table.nextPage()}
                        disabled={pagination ? pagination.page >= pagination.totalPages : !table.getCanNextPage()}
                        className="hover:cursor-pointer disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    )
}
