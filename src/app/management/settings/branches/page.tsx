"use client"

import { BranchDialog } from "@/components/admin/branch-dialog"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import branchService from "@/services/branch.service"
import { Branch } from "@/types/schema"
import { Edit, Loader2, MapPin, Plus, Settings2, Store, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export default function BranchesPage() {
    const { toast } = useToast()
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(true)
    
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)

    const loadBranches = useCallback(async () => {
        setLoading(true)
        try {
            const data = await branchService.getAll()
            setBranches(data)
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las branches", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadBranches()
    }, [loadBranches])



    const handleCreate = () => {
        setSelectedBranch(null)
        setDialogOpen(true)
    }

    const handleEdit = (branch: Branch) => {
        setSelectedBranch(branch)
        setDialogOpen(true)
    }

    const handleDelete = async (branch: Branch) => {
        if (!confirm(`¿Eliminar branch ${branch.name}? Esta acción no se puede deshacer si tiene ventas asociadas.`)) return;

        try {
            await branchService.delete(branch.id)
            toast({ title: "Branch eliminada" })
            loadBranches()
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "No se pudo eliminar", variant: "destructive" })
        }
    }

    return (
        <div className="p-0 sm:p-4 md:p-8 pt-2 mb-20 space-y-8  ">
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink href="/management/settings">Configuración</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Sucursales</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Sucursales</h1>
                    <p className="text-muted-foreground">Configura las ubicaciones físicas y puntos de venta.</p>
                </div>
                <Button onClick={handleCreate} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Sucursal
                </Button>
            </div>

            <div >   
                <CardContent className=" pl-0 p-0">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                     <div className="sm:rounded-3xl rounded-none border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card overflow-hidden w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Dirección</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.map((branch) => (
                                    <TableRow key={branch.id} className="hover:bg-gray-800/20  hover:rounded-2xl    transition-colors border-border cursor-pointer">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4 text-muted-foreground" />
                                                {branch.name}
                                                {branch.isHeadquarters && <Badge variant="secondary" className="text-[10px]">Central</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{branch.code}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <MapPin className="h-3 w-3" />
                                                {branch.address}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={branch.isActive ? "default" : "destructive"}>
                                                {branch.isActive ? "Activa" : "Inactiva"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" className="hover:cursor-pointer" onClick={() => handleEdit(branch)}>
                                                    <Settings2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer" onClick={() => handleDelete(branch)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {branches.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No hay branches registradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </div>

            <BranchDialog 
                open={dialogOpen} 
                onOpenChange={setDialogOpen} 
                branch={selectedBranch} 
                onSuccess={loadBranches} 
            />
        </div>
    )
}
