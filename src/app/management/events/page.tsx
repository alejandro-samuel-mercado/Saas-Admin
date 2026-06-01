"use client"

import { EventForm } from "@/components/management/promos/event-form";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GenericTable } from "@/components/ui/generic-table";
import { useToast } from "@/components/ui/use-toast";
import { PromosAPI } from "@/services/api";
import { useAuthStore } from '@/store/use-auth-store';
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calendar, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function EventsPage() {
    const { user } = useAuthStore()
    const userRole = user?.role?.name || ''
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [formOpen, setFormOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const { toast } = useToast()



    const loadEvents = useCallback(async () => {
        setLoading(true)
        try {
            const data = await PromosAPI.getEvents()
            setEvents(data.data || [])
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los eventos", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadEvents()
    }, [loadEvents])

    const handleDeleteItem = async (item: any) => {
        if (!confirm("¿Eliminar este evento?")) return
        try {
            await PromosAPI.deleteEvent(item.id)
            toast({ title: "Evento eliminado" })
            loadEvents()
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el evento", variant: "destructive" })
        }
    }

    const handleEdit = (event: any) => {
        setSelectedEvent(event)
        setFormOpen(true)
    }

    const handleCreate = () => {
        setSelectedEvent(null)
        setFormOpen(true)
    }

    const handleSuccess = () => {
        setFormOpen(false)
        loadEvents()
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "name",
            header: "Nombre del Evento",
            cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>
        },
        {
            accessorKey: "startDate",
            header: "Inicio",
            cell: ({ row }) => <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {format(new Date(row.original.startDate), "dd/MM/yyyy HH:mm")}</div>
        },
        {
            accessorKey: "endDate",
            header: "Fin",
            cell: ({ row }) => <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {format(new Date(row.original.endDate), "dd/MM/yyyy HH:mm")}</div>
        },
        {
            accessorKey: "active",
            header: "Estado",
            cell: ({ row }) => {
                const isActive = row.original.active
                const now = new Date()
                const start = new Date(row.original.startDate)
                const end = new Date(row.original.endDate)
                const isRunning = isActive && now >= start && now <= end

                return (
                    <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                        {isRunning ? "EN CURSO" : isActive ? "PROGRAMADO" : "INACTIVO"}
                    </Badge>
                )
            }
        },
    ]

    return (
        <div className=" sm:p-8 pt-2 space-y-6 pb-40 sm:pb-20">
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Eventos</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex sm:flex-row flex-col gap-3 sm:gap-0 justify-between items-center px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Gestión de Eventos
                    </h1>
                    <p className="text-muted-foreground">Configura eventos especiales, CyberMonday, BlackFriday, etc.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadEvents} disabled={loading} title="Recargar" className="hover:cursor-pointer">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                         <span className="ml-2 hidden sm:inline">Actualizar</span>
                    </Button>
                    {userRole !== 'EMPLOYEE' && (
                        <Button onClick={handleCreate} className="bg-secondary hover:bg-secondary/90 shadow-sm text-secondary-foreground hover:cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Evento
                        </Button>
                    )}
                </div>
            </div>

            <GenericTable 
                columns={columns} 
                data={events} 
                searchKey="name" 
                loading={loading}
                onEdit={userRole === 'EMPLOYEE' ? undefined : handleEdit}
                onDelete={userRole === 'EMPLOYEE' ? undefined : handleDeleteItem}
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-4 border-secondary/60 text-foreground">
                    <EventForm 
                        initialData={selectedEvent} 
                        onSuccess={handleSuccess} 
                        onCancel={() => setFormOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
