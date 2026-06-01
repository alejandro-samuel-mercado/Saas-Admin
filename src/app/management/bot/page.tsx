"use client";

import { BotResponseDialog } from "@/components/management/content/bot/bot-response-dialog";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChatAutoResponse, chatBotService } from "@/services/chat-bot.service";
import {
    Bot,
    Plus,
    RefreshCw,
    Search,
    Settings2,
    ToggleLeft,
    ToggleRight,
    Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function BotManagementPage() {
    const [responses, setResponses] = useState<ChatAutoResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState<ChatAutoResponse | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await chatBotService.getAll();
            setResponses(data);
        } catch (error) {
            toast.error("Error al cargar las respuestas del bot");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (data: Omit<ChatAutoResponse, "id"> & { id?: number }) => {
        try {
            if (data.id) {
                await chatBotService.update(data.id, data);
                toast.success("Respuesta actualizada correctamente");
            } else {
                await chatBotService.create(data);
                toast.success("Nueva respuesta creada");
            }
            fetchData();
        } catch (error) {
            toast.error("Error al guardar la respuesta");
            throw error;
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta respuesta automática?")) return;

        try {
            await chatBotService.delete(id);
            toast.success("Respuesta eliminada");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar la respuesta");
        }
    };

    const toggleStatus = async (response: ChatAutoResponse) => {
        try {
            await chatBotService.update(response.id, { isActive: !response.isActive });
            toast.success(response.isActive ? "Respuesta desactivada" : "Respuesta activada");
            fetchData();
        } catch (error) {
            toast.error("Error al cambiar el estado");
        }
    };

    const filteredResponses = responses.filter(r => 
        r.trigger?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.response?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateDialog = () => {
        setSelectedResponse(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (response: ChatAutoResponse) => {
        setSelectedResponse(response);
        setIsDialogOpen(true);
    };

    return (
        <div className="sm:p-8 pt-2 space-y-6 pb-40 sm:pb-20 max-w-7xl mx-auto">
            <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink>Contenido</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/management/content/bot">Asistente Bot</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-sm:px-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Bot className="h-8 w-8 text-secondary" />
                        Bot de Respuestas
                    </h1>
                    <p className="text-muted-foreground font-medium">Configura respuestas automáticas inteligentes para tus clientes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="h-11 w-11 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors hover:cursor-pointer">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={openCreateDialog} className="bg-secondary hover:bg-secondary/80 text-white rounded-xl h-11 px-8 shadow-xl shadow-secondary/20 font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95 hover:cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Respuesta
                    </Button>
                </div>
            </div>

            <div >
                <CardHeader className="max-sm:px-4 px-0">
                    <div className="flex items-center justify-between ">
                        
                        <div className="relative w-full max-w-sm ">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar disparador o respuesta..." 
                                className="pl-9 bg-gray-200 border-3 border-gray-400/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <CardDescription>
                        El sistema responderá automáticamente cuando el mensaje del cliente coincida exactamente con el disparador.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="w-full sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  p-1">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[200px]">Disparador (Trigger)</TableHead>
                                    <TableHead>Respuesta Automática</TableHead>
                                    <TableHead className="w-[120px] text-center">Estado</TableHead>
                                    <TableHead className="w-[150px] text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`skeleton-${i}`}>
                                            <TableCell><Skeleton className="h-6 w-32 bg-zinc-400/20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-full bg-zinc-400/20" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-20 mx-auto bg-zinc-400/20" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-16 ml-auto bg-zinc-400/20" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredResponses.length === 0 ? (
                                    <TableRow >
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                            {searchQuery ? "No se encontraron resultados para tu búsqueda." : "No hay respuestas automáticas configuradas."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredResponses.map((item) => (
                                        <TableRow key={item.id} className="hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-900/40 transition-all duration-200 border-b border-border  dark:border-zinc-800/50">
                                            <TableCell className="font-semibold">
                                                <Badge variant="outline" className="px-2 py-0.5 bg-secondary/5 text-secondary border-secondary/20">
                                                    {item.trigger}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[400px]">
                                                <div className="text-sm line-clamp-2 text-muted-foreground">
                                                    {item.response}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => toggleStatus(item)}
                                                    className={cn(
                                                        "h-8 px-2 transition-colors",
                                                        item.isActive ? "text-green-600 hover:text-green-700 hover:bg-green-50 hover:cursor-pointer" : "text-muted-foreground hover:bg-muted hover:cursor-pointer"
                                                    )}
                                                >
                                                    {item.isActive ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <ToggleRight className="h-5 w-5" />
                                                            <span className="text-[11px] font-bold">Activo</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <ToggleLeft className="h-5 w-5" />
                                                            <span className="text-[11px] font-bold">Inactivo</span>
                                                        </div>
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8  hover:cursor-pointer" onClick={() => openEditDialog(item)}>
                                                        <Settings2  className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:cursor-pointer" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </div>

            <BotResponseDialog 
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSave}
                response={selectedResponse}
            />
        </div>
    );
}
