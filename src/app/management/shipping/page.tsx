"use client"

import { ShippingZoneDialog } from "@/components/admin/shipping-zone-dialog"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { GenericTable } from '@/components/ui/generic-table'
import { useToast } from "@/components/ui/use-toast"
import { ShippingAPI } from '@/services/api'
import { useAuthStore } from '@/store/use-auth-store'
import { ShippingZone } from '@/types/extended'
import { ColumnDef } from '@tanstack/react-table'
import { Truck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'


export default function ShippingPage() {
    const { user } = useAuthStore()
    const userRole = user?.role?.name || ''
    const [zones, setZones] = useState<ShippingZone[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null)
    const { toast } = useToast()

    // Estados para búsqueda y paginación
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Debounce para búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1) // Resetear a la primera página al buscar
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const loadZones = useCallback(async () => {
        setLoading(true)
        try {
            const result = await ShippingAPI.getZones({
                search: debouncedSearch,
                page,
                limit: 10
            })
            setZones(result.data)
            setTotalPages(result.meta.totalPages)
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las zonas de envío.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast, debouncedSearch, page])

    useEffect(() => {
        loadZones()
    }, [loadZones])

    const handleCreate = () => {
        setSelectedZone(null)
        setDialogOpen(true)
    }

    const handleEdit = (zone: ShippingZone) => {
        setSelectedZone(zone)
        setDialogOpen(true)
    }

    const handleDelete = async (zone: ShippingZone) => {
        if (confirm(`¿Eliminar zona de envío para ${zone.city || zone.province || zone.country || 'Global'}?`)) {
            try {
                await ShippingAPI.deleteZone(zone.id)
                toast({ title: "Zona eliminada", description: "La zona de envío ha sido eliminada." })
                loadZones()
            } catch (error: any) {
                const message = error.response?.data?.message || "Error al eliminar zona"
                toast({ title: "Error", description: message, variant: "destructive" })
            }
        }
    }

    const columns: ColumnDef<ShippingZone>[] = [
        {
            accessorKey: "location",
            header: "Zona",
            cell: ({ row }) => {
                const { country, province, city } = row.original
                const parts = [city, province, country].filter(Boolean)
                return parts.length > 0 ? parts.join(", ") : "Global (Default)"
            }
        },
        {
            accessorKey: "cost",
            header: "Costo de Envío",
            cell: ({ row }) => `$${row.original.cost}`
        },
        {
            accessorKey: "active",
            header: "Estado",
            cell: ({ row }) => <Badge variant={row.original.active ? 'default' : 'secondary'}>{row.original.active ? 'Activo' : 'Inactivo'}</Badge>
        },
        
    ]

    return (
        <div className="sm:p-8 pt-2 space-y-6 max-w-5xl mx-auto">
            <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Envíos</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Truck className="h-6 w-6" />
                        Zonas de Envío
                    </h1>
                    <p className="text-muted-foreground">Configura precios de envío por ubicación (País, Provincia, Ciudad).</p>
                </div>
              
            </div>
 
            <GenericTable 
                data={zones}
                columns={columns}
                searchKey="location" // Se mantiene pero GenericTable usará onSearchChange al detectar pagination
                onCreate={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                createText="Nueva Zona"
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                pagination={{
                    page,
                    totalPages,
                    onPageChange: setPage
                }}
            />

            <ShippingZoneDialog 
                key={selectedZone?.id ? `edit-${selectedZone.id}` : 'create-new'}
                open={dialogOpen} 
                onOpenChange={setDialogOpen} 
                zone={selectedZone as any} 
                onSuccess={loadZones} 
            />
        </div>
    )
}
