"use client"
import React from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/store/use-auth-store"
import { User, UserRole } from "@/types/schema"
import { CellContext, ColumnDef, ColumnFiltersState, HeaderContext, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Loader2, Search, Settings2, ShoppingCart, Trash } from "lucide-react"
import { useState } from "react"

interface UserTableProps {
   data: User[]
   currentUserRole: UserRole
   currentFilter?: string | null
   onView: (user: User) => void
   onEdit: (user: User) => void
   onDelete: (user: User) => void
   onViewCart: (user: User) => void
   search?: string
   onSearchChange?: (val: string) => void
   pagination?: {
       page: number
       totalPages: number
       onPageChange: (page: number) => void
   }
   loading?: boolean
}

export function UserTable({ data, currentUserRole, currentFilter, onView, onEdit, onDelete, onViewCart, search, onSearchChange, pagination, loading }: UserTableProps) {
   const [sorting, setSorting] = useState<SortingState>([])
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
   const rawColumns: ColumnDef<User>[] = [
       {
           accessorKey: "name",
           header: ({ column }: HeaderContext<User, unknown>) => {
               return (
                   <Button className="hover:cursor-pointer" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                       Nombre
                       <ArrowUpDown className="ml-2 h-4 w-4" />
                   </Button>
               )
           },
       },
       {
           accessorKey: "email",
           header: "Email",
       },
       {
           accessorKey: "dni",
           header: "DNI",
           cell: ({ row }: CellContext<User, unknown>) => <span className="font-mono text-muted-foreground">{row.getValue("dni") || "-"}</span>
       },
       {
           accessorKey: "phone",
           header: "Teléfono",
           cell: ({ row }: CellContext<User, unknown>) => <span className="text-muted-foreground">{row.getValue("phone") || "-"}</span>
       },
       {
           id: "branches",
           header: "Branch(es)",
           cell: ({ row }: CellContext<User, unknown>) => {
               const user = row.original;
               if (user.roleId === 1 || user.roleId === 2) {
                   if (user.roleId === 1 && (!user.adminBranches || user.adminBranches.length === 0)) {
                        return <Badge variant="outline" className="border-borderH text-purple-600 dark:text-purple-400 text-[10px]">Global</Badge>
                   }
                   if (user.adminBranches && user.adminBranches.length > 0) {
                       return (
                           <div className="flex flex-wrap gap-1 max-w-[200px]">
                               {user.adminBranches.map((as: { branchId: number; branch?: { name: string } }) => (
                                   <Badge key={as.branchId} variant="outline" className="text-[10px] bg-muted border-border text-muted-foreground">
                                       {as.branch?.name || `#${as.branchId}`}
                                   </Badge>
                               ))}
                           </div>
                       )
                   }
                    return <span className="text-muted-foreground text-xs italic">Sin asignar</span>
               }
              
               if (user.roleId === 3) {
                    if (user.branch) {
                        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">{user.branch.name}</Badge>
                    }
                    return <Badge variant="destructive" className="text-[10px]">Sin Asignar</Badge>
               }

               return <span className="text-muted-foreground">-</span>
           }
       },
       {
           accessorKey: "status",
           header: "Estado",
           cell: ({ row }: CellContext<User, unknown>) => {
               const status = row.getValue("status") as string
               return (
                    <Badge variant={status === 'ACTIVE' ? 'outline' : 'destructive'}
                           className={status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : ''}>
                       {status}
                    </Badge>
               )
           }
       },
       {
           id: "actions",
           cell: ({ row }: CellContext<User, unknown>) => {
               const user = row.original
              
               const targetIsAdmin = user.role?.name === 'ADMIN' || user.role?.name === 'SUPER_ADMIN'
               const isTargetSuperAdmin = user.role?.name === 'SUPER_ADMIN'
               const isCurrentSuperAdmin = currentUserRole === 'SUPER_ADMIN'

               const canEdit = (isCurrentSuperAdmin && (!isTargetSuperAdmin || user.id === useAuthStore.getState().user?.id)) ||
                              (currentUserRole === 'ADMIN' && !targetIsAdmin) ||
                              (currentUserRole === 'EMPLOYEE' && (user.role?.name === 'CUSTOMER'))

               return (
                   <DropdownMenu>
                       <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                           <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:cursor-pointer">
                               <span className="sr-only">Open menu</span>
                              <Settings2 className="h-4 w-4" />
                           </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground shadow-xl z-50 min-w-[200px]">
                           <DropdownMenuLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider px-4 py-2"></DropdownMenuLabel>

                           {canEdit && (
                               <>
                                   <DropdownMenuItem
                                       onClick={(e) => {
                                           e.stopPropagation()
                                           onEdit(user)
                                       }}
                                       className="hover:bg-secondary/5 cursor-pointer p-3 text-sm font-medium transition-colors text-secondary"
                                   >
                                       <Edit className="mr-3 h-5 w-5" /> Editar
                                   </DropdownMenuItem>
                                  
                                   {(currentUserRole !== 'EMPLOYEE' || user.roleId === 4) && (
                                       <>
                                           <DropdownMenuItem
                                               onClick={(e) => {
                                                   e.stopPropagation()
                                                   onViewCart(user)
                                               }}
                                               className="hover:bg-blue-500/5 cursor-pointer p-3 text-sm font-medium transition-colors text-blue-500"
                                           >
                                               <ShoppingCart className="mr-3 h-5 w-5" /> Ver Carrito
                                           </DropdownMenuItem>
                                           <DropdownMenuSeparator className="bg-border" />
                                           <DropdownMenuItem
                                               className="hover:bg-destructive/5 text-destructive cursor-pointer p-3 text-sm font-medium transition-colors"
                                               onClick={(e) => {
                                                   e.stopPropagation()
                                                   onDelete(user)
                                               }}
                                           >
                                               <Trash className="mr-3 h-5 w-5" /> Eliminar
                                           </DropdownMenuItem>
                                       </>
                                   )}
                               </>
                           )}
                       </DropdownMenuContent>
                   </DropdownMenu>
               )
           },
       },
   ]

   const columns = React.useMemo(() => {
       if (currentFilter === 'CUSTOMER') {
           return rawColumns.filter(col => col.id !== 'branches');
       }
       return rawColumns;
   
   }, [currentFilter]);

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
        
           <div className="flex flex-col sm:flex-row items-center justify-between py-4 sm:px-0 px-6 gap-6 sm:gap-0">
               <div className="relative w-full max-w-sm group ">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary">
                       <Search className="h-4 w-4" />
                   </div>
                    <Input
                        placeholder="Buscar por Nombre, DNI, Email o Teléfono..."
                        value={search ?? ""}
                        onChange={(event) => onSearchChange?.(event.target.value)}
                         className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20 text-foreground"
                    />
               </div>
              
               {/* Removed duplicate button, handled in parent page */}
           </div>
          
           <div className="sm:rounded-3xl rounded-none border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  overflow-hidden">
               <Table >
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
                                   className="hover:bg-gray-800/20  hover:rounded-2xl    transition-colors border-border cursor-pointer"
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
                               <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                   No hay resultados.
                               </TableCell>
                           </TableRow>
                       )}
                   </TableBody>
               </Table>
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
