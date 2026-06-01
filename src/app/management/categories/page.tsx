"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { GenericTable } from '@/components/ui/generic-table'
import { Category } from '@/types/schema'
import { ColumnDef } from '@tanstack/react-table'
import { RefreshCw, Tags, Trash } from 'lucide-react'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/components/ui/use-toast'
import { CategoriesAPI } from '@/services/api'
import { useBranchStore } from '@/store/branch.store'
import { useAuthStore } from '@/store/use-auth-store'
import { useCallback, useEffect, useState } from 'react'
export default function CategoriesPage() {
    const { user } = useAuthStore()
    const { activeBranch } = useBranchStore()
    const userRole = user?.role?.name || ''
    const [categories, setCategories] = useState<Category[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
    const [formData, setFormData] = useState({ name: '', slug: '', parentId: null as number | null })
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()



    useEffect(() => {
        if (editingCategory) {
            setFormData({ name: editingCategory.name, slug: editingCategory.slug, parentId: editingCategory.parentId || null })
        } else {
            setFormData({ name: '', slug: '', parentId: null })
        }
    }, [editingCategory])

    const loadCategories = useCallback(async () => {
        setLoading(true)
        try {
            const data = await CategoriesAPI.getAll()
            setCategories(Array.isArray(data) ? data : [])
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las categorías.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    const handleSave = async () => {
        try {
            if (editingCategory) {
                await CategoriesAPI.update(editingCategory.id, formData, activeBranch?.id)
                toast({ title: "Categoría actualizada", description: "Los cambios se guardaron correctamente." })
            } else {
                await CategoriesAPI.create(formData, activeBranch?.id)
                toast({ title: "Categoría creada", description: "La nueva categoría se ha creado." })
            }
            setIsDialogOpen(false)
            loadCategories()
        } catch (error: any) {
            const message = error.response?.data?.message || "No se pudo guardar la categoría."
            toast({ title: "Error", description: message, variant: "destructive" })
        }
    }

    const handleDelete = async (category: Category) => {
        if(confirm(`¿Eliminar ${category.name}?`)) {
            try {
                await CategoriesAPI.delete(category.id, activeBranch?.id)
                toast({ title: "Categoría eliminada", description: `La categoría ${category.name} ha sido eliminada.` })
                loadCategories()
            } catch (error: any) {
                const message = error.response?.data?.message || "Error al eliminar categoría"
                toast({ title: "No se puede eliminar", description: message, variant: "destructive" })
            }
            finally{
                  setEditingCategory(undefined)
                  setIsDialogOpen(false)
            }
        }
    }

    const openEdit = (category: Category) => {
        setEditingCategory(category)
        setIsDialogOpen(true)
    }

    const openCreate = () => {
        setEditingCategory(undefined)
        setIsDialogOpen(true)
    }

    const columns: ColumnDef<Category>[] = [
         {
            accessorKey: "name",
            header: "Nombre",
        },
        {
            accessorKey: "slug",
            header: "Slug (URL)",
        },
        {
            accessorKey: "parentId",
            header: "Categoría Padre",
            cell: ({ row }) => {
                const parentId = row.original.parentId;
                if (!parentId) return <span className="text-muted-foreground italic text-xs">Principal</span>;
                const parent = categories.find(c => c.id === parentId);
                return <span className="text-xs">{parent ? parent.name : parentId}</span>;
            }
        },
    ]

    return (
        <div className="sm:p-8  pt-2 space-y-6 pb-40 sm:pb-20 max-w-5xl mx-auto">
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Categorías</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Tags className="h-6 w-6" />
                        Categorías
                    </h1>
                    <p className="text-muted-foreground">Organiza los productos en secciones.</p>
                </div>
                 <Button variant="outline" onClick={loadCategories} disabled={loading} title="Recargar" className="hover:cursor-pointer">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="ml-2 hidden sm:inline">Actualizar</span>
                </Button>
            </div>

            <div className="max-w-full mx-auto">
                <GenericTable 
                    data={categories}
                    columns={columns}
                    searchKey="name"
                    onCreate={userRole === 'EMPLOYEE' ? undefined : openCreate}
                    onEdit={userRole === 'EMPLOYEE' ? undefined : openEdit} 
                    onDelete={userRole === 'EMPLOYEE' ? undefined : handleDelete as any}
                    createText="Nueva Categoría"
                    loading={loading}
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-background border-4 border-secondary/60 text-foreground sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nombre</Label>
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                className="bg-background border-input"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Slug (URL)</Label>
                            <Input 
                                value={formData.slug} 
                                onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                                className="bg-background border-input font-mono text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Categoría Padre</Label>
                            <Select
                                value={formData.parentId ? formData.parentId.toString() : "0"}
                                onValueChange={(val) => setFormData({...formData, parentId: val === "0" ? null : parseInt(val)})}
                            >
                                <SelectTrigger className="bg-background border-input">
                                    <SelectValue placeholder="Sin categoría padre" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0" className="text-muted-foreground italic">Ninguna (Categoría Principal)</SelectItem>
                                    {categories
                                        .filter(c => !editingCategory || c.id !== editingCategory.id)
                                        .map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:gap-0">
                         {editingCategory && (
                            <Button variant="destructive" onClick={() => handleDelete(editingCategory)} className="mr-auto hover:cursor-pointer">
                                <Trash className="w-4 h-4 mr-2" /> Eliminar
                            </Button>
                        )}
                        <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90 shadow-sm text-secondary-foreground hover:cursor-pointer">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
         </div>
    )
}
