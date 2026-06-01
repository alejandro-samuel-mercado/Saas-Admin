"use client"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GenericTable } from '@/components/ui/generic-table'
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CommentsAPI } from "@/services/api"
import { ColumnDef } from '@tanstack/react-table'
import { format } from "date-fns"
import { Check, MessageSquare, RefreshCw, Trash, X } from 'lucide-react'
import { useCallback, useEffect, useState } from "react"

export default function CommentsPage() {
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [limit] = useState(20)
    const [search, setSearch] = useState("")
    const { toast } = useToast()

    const [viewOpen, setViewOpen] = useState(false)
    const [selectedComment, setSelectedComment] = useState<any>(null)



    const loadComments = useCallback(async (pageNum = page) => {
        setLoading(true)
        try {
            const response = await CommentsAPI.getAll({
                page: pageNum,
                limit,
                search
            })
            const paginatedData = response.data
            setComments(paginatedData?.data || [])
            setTotalPages(paginatedData?.totalPages || 1)
            setPage(paginatedData?.page || 1)
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast, page, limit, search])

    useEffect(() => {
        loadComments(1)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            loadComments(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const handleModerate = async (id: number, approved: boolean) => {
        try {
            await CommentsAPI.moderate(id, approved)
            toast({ title: approved ? "Comentario Aprobado" : "Comentario Rechazado", description: "El estado ha sido actualizado." })
            loadComments()
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el comentario.", variant: "destructive" })
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar comentario?")) return
        try {
            await CommentsAPI.delete(id)
            toast({ title: "Eliminado", description: "Comentario eliminado correctamente." })
            loadComments()
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el comentario.", variant: "destructive" })
        }
    }

    const handleView = (comment: any) => {
        setSelectedComment(comment)
        setViewOpen(true)
    }

    const handleReply = (comment: any) => {
        if (comment.user?.email) {
            window.location.href = `mailto:${comment.user.email}?subject=Respuesta a tu comentario sobre ${comment.product?.name}`
        } else {
            toast({ title: "Sin Email", description: "El usuario no tiene email registrado para responder." })
        }
    }

    const columns: ColumnDef<any>[] = [
         { 
             id: "userName",
             accessorFn: (row) => `${row.user?.name || ''} ${row.user?.email || ''}`,
             header: "Usuario",
             cell: ({ row }) => (
                 <div className="flex flex-col">
                     <span className="font-medium">{row.original.user?.name || 'Anónimo'}</span>
                     <span className="text-xs text-muted-foreground">{row.original.user?.email}</span>
                 </div>
             )
         },
         { 
             accessorKey: "product.name", 
             header: "Producto",
             cell: ({ row }) => <span className="text-sm">{row.original.product?.name || '---'}</span>
         },
         { 
             accessorKey: "rating", 
             header: "Valoración", 
             cell: ({ row }) => <span className="text-yellow-500 font-bold">★ {row.original.rating ?? '-'}</span> 
         },
         { 
            accessorKey: "content", 
            header: "Comentario", 
            cell: ({ row }) => <p className="text-sm text-muted-foreground truncate max-w-[300px]" title={row.original.content}>{row.original.content}</p> 
        },
        { 
            accessorKey: "createdAt", 
            header: "Fecha", 
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.createdAt ? format(new Date(row.original.createdAt), 'dd/MM/yyyy') : '-'}</span> 
        },
         { 
             accessorKey: "approved", 
             header: "Estado", 
             cell: ({ row }) => (
                <Badge variant={row.original.approved ? 'default' : 'secondary'} className={row.original.approved ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'}>
                    {row.original.approved ? 'Aprobado' : 'Pendiente'}
                </Badge>
             ) 
         }
    ]

    return (
        <div className="sm:p-8 pt-2 space-y-6 pb-40 sm:pb-20">
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Comentarios</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <MessageSquare className="h-6 w-6" />
                        Comentarios y Reseñas
                    </h1>
                    <p className="text-muted-foreground">Modera las opiniones de los usuarios.</p>
                </div>
                <Button variant="outline" className="hover:cursor-pointer" onClick={() => loadComments()} disabled={loading} title="Recargar">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="ml-2 hidden sm:inline">Actualizar</span>
                </Button>
            </div>
            <GenericTable 
                data={comments}
                columns={columns}
                searchKey="content"
                onEdit={handleView}
                search={search}
                onSearchChange={setSearch}
                loading={loading}
                pagination={{
                    page,
                    totalPages,
                    onPageChange: (newPage: number) => {
                        setPage(newPage)
                        loadComments(newPage)
                    }
                }}
            />

            {/*Modal */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-4 border-secondary/60">
                    <DialogHeader>
                        <DialogTitle>Gestión de Comentario</DialogTitle>
                    </DialogHeader>
                    {selectedComment && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Usuario</Label>
                                    <div className="mt-1">
                                        <p className="text-sm font-semibold">{selectedComment.user?.name || 'Desconocido'}</p>
                                        <p className="text-xs text-muted-foreground">{selectedComment.user?.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Fecha</Label>
                                    <p className="text-sm mt-1">{selectedComment.createdAt ? format(new Date(selectedComment.createdAt), 'dd MMMM yyyy, HH:mm') : '-'}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-b border-border py-4">
                                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Producto</Label>
                                <p className="text-base font-medium mt-1">{selectedComment.product?.name || 'Producto Eliminado'}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Valoración:</Label>
                                <div className="flex text-yellow-500 text-lg">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i}>{i < (selectedComment.rating || 0) ? '★' : '☆'}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg border border-border">
                                <Label className="text-xs text-muted-foreground uppercase font-bold mb-2 block tracking-wide">Comentario</Label>
                                <p className="text-sm text-foreground italic leading-relaxed">&quot;{selectedComment.content}&quot;</p>
                            </div>

                            <div>
                                 <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Estado Actual</Label>
                                 <div className="mt-2">
                                    <Badge variant={selectedComment.approved ? 'default' : 'secondary'} className={`px-3 py-1 ${selectedComment.approved ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                        {selectedComment.approved ? 'Aprobado / Visible' : 'Pendiente de Aprobación'}
                                    </Badge>
                                 </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                         {selectedComment && (
                             <>
                                <Button 
                                    variant="destructive" 
                                    onClick={() => { handleDelete(selectedComment.id); setViewOpen(false); }}
                                    className="sm:mr-auto bg-red-600 hover:bg-red-700 hover:cursor-pointer"
                                >
                                    <Trash className="mr-2 h-4 w-4" /> Eliminar
                                </Button>

                                {!selectedComment.approved ? (
                                    <Button onClick={() => { handleModerate(selectedComment.id, true); setViewOpen(false); }} className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600 hover:cursor-pointer">
                                        <Check className="mr-2 h-4 w-4" /> Aprobar
                                    </Button>
                                ) : (
                                    <Button onClick={() => { handleModerate(selectedComment.id, false); setViewOpen(false); }} className="bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-500 hover:cursor-pointer">
                                        <X className="mr-2 h-4 w-4" /> Rechazar
                                    </Button>
                                )}
                             </>
                         )}
                        <Button variant="outline" className="hover:cursor-pointer" onClick={() => setViewOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
         </div>
    )
}
