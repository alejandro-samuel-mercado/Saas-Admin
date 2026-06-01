"use client"

import SupplierDetailsClient from "@/components/admin/suppliers/supplier-details"
import { SupplierForm } from "@/components/admin/suppliers/supplier-form"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Supplier, supplierService } from "@/services/supplier.service"
import { useAuthStore } from "@/store/use-auth-store"
import { Loader2, Plus, Search, Settings2, Truck } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export default function SuppliersPage() {
    const { user } = useAuthStore()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [limit] = useState(25)
    
    const [isNewModalOpen, setIsNewModalOpen] = useState(false)
    const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null)

    const fetchSuppliers = useCallback(async (pageNum = page) => {
        try {
            setLoading(true)
            const result = await supplierService.getAll({ 
                search, 
                page: pageNum, 
                limit 
            })
            setSuppliers(result.data || [])
            setTotalPages(result.totalPages || 1)
            setPage(result.page || 1)
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }, [search, limit])

    useEffect(() => {
        fetchSuppliers(1)
    }, [search])

    useEffect(() => {
        fetchSuppliers(page)
    }, [fetchSuppliers])

    if (user?.role?.name !== 'SUPER_ADMIN') {
        return <div className="p-8 text-center text-slate-400">Acceso restringido a Super Administradores</div>
    }

    return (
        <div className="sm:p-8 space-y-8  pt-2 pl-0 sm:pb-20 pb-40">
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Compras</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Proveedores</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Truck className="h-6 w-6" />
                        Proveedores
                    </h1>
                    <p className="text-muted-foreground">
                        Gestión global de proveedores y catálogo de productos.
                    </p>
                </div>
                <Button className="hover:cursor-pointer" onClick={() => setIsNewModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Proveedor
                </Button>
            </div>

            <div className="flex items-center justify-between py-4 px-4">
                <div className="relative w-full max-w-sm group ">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary">
                        <Search className="h-4 w-4" />
                    </div>
                    <Input 
                        placeholder="Buscar por nombre, razón social o CUIT..." 
                        className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
            </div>

            <div className="relative sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-purple-500 hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card   overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-muted/50 border-border">
                            <TableHead className="text-muted-foreground font-semibold">Nombre Comercial</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Razón Social</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">CUIT</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Contacto</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="relative min-h-[200px]">
                        {loading && (
                            <TableRow className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                <TableCell colSpan={6} className="border-none flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Cargando...</p>
                                </TableCell>
                            </TableRow>
                        )}
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`} className="border-border">
                                    <TableCell><Skeleton className="h-6 w-32 bg-zinc-400/20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-40 bg-zinc-400/20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 bg-zinc-400/20" /></TableCell>
                                    <TableCell>
                                        <div className="space-y-2">
                                            <Skeleton className="h-3 w-32 bg-zinc-400/20" />
                                            <Skeleton className="h-3 w-24 bg-zinc-400/20" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 bg-zinc-400/20" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto bg-zinc-400/20" /></TableCell>
                                </TableRow>
                            ))
                        ) : suppliers && suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No se encontraron proveedores.
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers && suppliers.map((supplier) => (
                                <TableRow 
                                    key={supplier.id} 
                                    className="hover:bg-gray-800/20  hover:rounded-2xl    text-foreground transition-colors border-border hover:cursor-pointer"
                                    onClick={() => setSelectedSupplierId(supplier.id)} 
                                >
                                    <TableCell className="font-medium">{supplier.tradeName}</TableCell>
                                    <TableCell>{supplier.legalName}</TableCell>
                                    <TableCell className="font-mono text-xs">{supplier.taxId}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs text-muted-foreground">
                                            <span>{supplier.email}</span>
                                            <span>{supplier.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={supplier.isActive ? "outline" : "destructive"} className={supplier.isActive ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : ""}>
                                            {supplier.isActive ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" className="hover:cursor-pointer"   onClick={(e) => { e.stopPropagation(); setSelectedSupplierId(supplier.id); }}>
                                                <Settings2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between py-4 px-2">
                <div className="text-sm text-muted-foreground">
                    <span>Página {page} de {totalPages}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page <= 1 || loading}
                        className="border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page >= totalPages || loading}
                        className="border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>

            <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
                <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh] text-foreground border-4 border-secondary/60 shadow-2xl  transition-all duration-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Nuevo Proveedor</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <SupplierForm onSuccess={() => { setIsNewModalOpen(false); fetchSuppliers(); }} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={selectedSupplierId !== null} onOpenChange={(open) => !open && setSelectedSupplierId(null)}>
                <DialogContent className="sm:max-w-[1200px] overflow-y-auto max-h-[90vh] w-[95vw] bg-background text-foreground border-4 border-secondary/60 shadow-2xl  transition-all duration-200">
                    {selectedSupplierId && (
                        <div className="py-2">
                            <SupplierDetailsClient 
                                id={selectedSupplierId} 
                                onClose={() => { setSelectedSupplierId(null); fetchSuppliers(); }} 
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
