"use client"

import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { BlogAPI } from "@/services/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2, Clock, ExternalLink, Globe, Plus, Search, Settings2, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function BlogManagementPage() {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<any>(null)
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        coverImage: "",
        authorName: "Admin",
        authorAvatar: "",
        authorBio: "",
        tags: [] as string[],
        readingTime: 5,
        published: false
    })

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        try {
            const res = await BlogAPI.getAll({ published: undefined }) 
            setPosts(res.data)
        } catch (error) {
          
        } finally {
            setLoading(false)
        }
    }

    const handleOpenCreate = () => {
        setEditingPost(null)
        setFormData({
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            coverImage: "",
            authorName: "Admin",
            authorAvatar: "",
            authorBio: "",
            tags: [],
            readingTime: 5,
            published: false
        })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (post: any) => {
        setEditingPost(post)
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            coverImage: post.coverImage || "",
            authorName: post.authorName,
            authorAvatar: post.authorAvatar || "",
            authorBio: post.authorBio || "",
            tags: post.tags || [],
            readingTime: post.readingTime,
            published: post.published
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast.error("Título y contenido son obligatorios")
            return
        }

        try {
            if (editingPost) {
                await BlogAPI.update(editingPost.id, formData)
            } else {
                await BlogAPI.create(formData)
            }
            setIsDialogOpen(false)
            loadPosts()
        } catch (error) {
          
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este post?")) return
        try {
            await BlogAPI.delete(id)
            loadPosts()
        } catch (error) {
           
        }
    }

    const filteredPosts = posts.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-6 sm:p-6 pb-40 sm:pb-20 pt-2">
               <Breadcrumb   className="px-2">
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem><BreadcrumbLink>Blog</BreadcrumbLink></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Gestión de Blog</h1>
                    <p className="text-muted-foreground">Crea y administra los artículos de tu tienda.</p>
                </div>
                <Button 
                    onClick={handleOpenCreate} 
                    className="rounded-full bg-secondary hover:bg-secondary/90 text-white px-6 font-bold shadow-lg shadow-secondary/20 hover:cursor-pointer"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Artículo
                </Button>
            </div>

            <div className="relative sm:w-[50%] w-full group mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                    placeholder="Buscar por título o etiqueta..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20 transition-all font-medium h-10"
                />
            </div>

            <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.1)] overflow-hidden bg-card">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-b-2">
                            <TableHead className="font-bold">Artículo</TableHead>
                            <TableHead className="font-bold">Estado</TableHead>
                            <TableHead className="font-bold">Fecha</TableHead>
                            <TableHead className="font-bold">Etiquetas</TableHead>
                            <TableHead className="text-right font-bold"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="relative min-h-[300px]">
                        {loading && (
                            <TableRow className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                <TableCell colSpan={5} className="border-none flex flex-col items-center gap-2">
                                    <Clock className="h-8 w-8 animate-spin text-secondary" />
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Cargando...</p>
                                </TableCell>
                            </TableRow>
                        )}
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`loading-${i}`} className="border-border">
                                    <TableCell><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredPosts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">No se encontraron artículos.</TableCell>
                            </TableRow>
                        ) : (
                            filteredPosts.map((post) => (
                                <TableRow 
                                    key={post.id} 
                                    className="group hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                    onClick={() => handleOpenEdit(post)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            {post.coverImage ? (
                                                <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                                                    <img src={post.coverImage} alt={post.title} className="object-cover w-full h-full" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                    <Globe className="w-6 h-6 text-zinc-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{post.title}</p>
                                                <p className="text-xs text-muted-foreground font-mono">/{post.slug}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {post.published ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none rounded-full px-3">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Publicado
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 rounded-full px-3">
                                                <Clock className="w-3 h-3 mr-1" /> Borrador
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        {post.publishedAt ? format(new Date(post.publishedAt), 'dd MMM, yyyy', { locale: es }) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {post.tags.slice(0, 2).map((tag: string) => (
                                                <Badge key={tag} variant="secondary" className="text-[10px] font-bold rounded-md">{tag}</Badge>
                                            ))}
                                            {post.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{post.tags.length - 2}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(post)} className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30 hover:cursor-pointer">
                                                <Settings2  className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 hover:cursor-pointer">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 hover:cursor-pointer">
                                                <a href={`http://localhost:3000/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-secondary/70 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">{editingPost ? "Editar Artículo" : "Nuevo Artículo"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Título</Label>
                                <Input 
                                    placeholder="Título del post" 
                                    value={formData.title} 
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="rounded-xl border-2 focus:ring-secondary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Slug (URL)</Label>
                                <Input 
                                    placeholder="ej: como-elegir-productos" 
                                    value={formData.slug} 
                                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                    className="rounded-xl border-2 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Extracto (Resumen)</Label>
                                <Textarea 
                                    placeholder="Una breve descripción para la lista..." 
                                    value={formData.excerpt} 
                                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                                    className="rounded-xl border-2 resize-none h-24"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">URL Imagen de Portada</Label>
                                <Input 
                                    placeholder="https://images.unsplash.com/..." 
                                    value={formData.coverImage} 
                                    onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                                    className="rounded-xl border-2"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="space-y-2 flex-1">
                                    <Label className="font-bold">Tiempo Lectura (min)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.readingTime} 
                                        onChange={(e) => setFormData({...formData, readingTime: parseInt(e.target.value)})}
                                        className="rounded-xl border-2"
                                    />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end pb-2">
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                            checked={formData.published} 
                                            onCheckedChange={(val) => setFormData({...formData, published: val})} 
                                        />
                                        <Label className="font-bold cursor-pointer">Publicar</Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 flex flex-col">
                            <Label className="font-bold">Contenido (HTML)</Label>
                            <Textarea 
                                placeholder="Escribe el contenido de tu post aquí (soporta etiquetas HTML)..." 
                                value={formData.content} 
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                className="rounded-xl border-2 flex-1 min-h-[300px] font-mono text-sm"
                            />
                            <div className="space-y-2">
                                <Label className="font-bold">Etiquetas (separadas por coma)</Label>
                                <Input 
                                    placeholder="Guía, Consejos, E-commerce" 
                                    value={formData.tags.join(", ")} 
                                    onChange={(e) => setFormData({...formData, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
                                    className="rounded-xl border-2"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full font-bold hover:cursor-pointer">Cancelar</Button>
                        <Button onClick={handleSave} className="rounded-full font-bold bg-secondary text-white px-8 hover:cursor-pointer">Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
