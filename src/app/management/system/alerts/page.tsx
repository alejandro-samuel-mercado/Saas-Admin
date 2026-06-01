"use client";

import { AlertDetailsDialog } from "@/components/management/system/alert-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertLog, SystemService } from "@/services/system-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

export default function SystemAlertsPage() {
    const [alerts, setAlerts] = useState<AlertLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("OPEN");
    const [severityFilter, setSeverityFilter] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<string>("updatedAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedAlert, setSelectedAlert] = useState<AlertLog | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await SystemService.getAlerts({ 
                status: statusFilter, 
                severity: severityFilter === "ALL" ? undefined : severityFilter,
                page,
                pageSize: 20,
                sortBy,
                sortOrder,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            if (res.success) {
                setAlerts(res.data);
                setTotalPages(res.pagination.totalPages);
            }
        } catch (error) {
      
        } finally {
            setLoading(false);
        }
    }, [statusFilter, severityFilter, page, sortBy, sortOrder, startDate, endDate]);

    useEffect(() => {
        fetchAlerts();
    }, [statusFilter, severityFilter, sortBy, sortOrder, page, startDate, endDate, fetchAlerts]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "CRITICAL": return "destructive";
            case "HIGH": return "orange"; 
            case "MEDIUM": return "secondary";
            case "LOW": return "outline";
            default: return "default";
        }
    };

    const handleResolve = async (id: number) => {
        try {
            const res = await SystemService.resolveAlert(id);
            if (res.success) {
                fetchAlerts();
            }
        } catch (error) {
          
        }
    };

    const openDetails = (alert: AlertLog) => {
        setSelectedAlert(alert);
        setDetailsOpen(true);
    };

    return (
        <div className="sm:p-6 pt-6 space-y-6 pb-40 sm:pb-20">
            <div className="flex justify-between items-center px-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Alertas del Sistema</h1>
                    <p className="text-muted-foreground">Monitoreo de errores y estado de salud.</p>
                </div>
                <Button onClick={fetchAlerts} variant="outline" size="sm" className="hover:cursor-pointer">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Filtros y Controles */}
            <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-1 bg-muted p-1 rounded-lg">
                        <Button 
                            variant={statusFilter === "OPEN" ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => { setStatusFilter("OPEN"); setPage(1); }}
                            className="rounded-md hover:cursor-pointer"
                        >
                            Pendientes
                        </Button>
                        <Button 
                            variant={statusFilter === "RESOLVED" ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => { setStatusFilter("RESOLVED"); setPage(1); }}
                            className="rounded-md hover:cursor-pointer"
                        >
                            Resueltos
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-border hidden md:block" />

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Severidad:</span>
                        <Select value={severityFilter} onValueChange={(val) => { setSeverityFilter(val); setPage(1); }}>
                            <SelectTrigger className="w-[130px] h-9">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas</SelectItem>
                                <SelectItem value="CRITICAL">Crítica</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="MEDIUM">Media</SelectItem>
                                <SelectItem value="LOW">Baja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
                        <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
                            <SelectTrigger className="w-[150px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="updatedAt">Fecha actualización</SelectItem>
                                <SelectItem value="occurrences">Ocurrencias</SelectItem>
                                <SelectItem value="severity">Severidad</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 hover:cursor-pointer"
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        >
                            <SlidersHorizontal className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-border hidden lg:block" />

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Desde:</span>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="h-9 rounded-full border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/50 text-foreground text-foreground"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Hasta:</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="h-9 rounded-full border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/50 text-foreground text-foreground"
                        />
                    </div>
                </div>
            </div>

            <div className="">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Incidentes Recientes</CardTitle>
                </CardHeader>
                <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  overflow-hidden">
                    <Table >
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-muted/50 border-border">
                                <TableHead className="text-muted-foreground font-semibold">Severidad</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Código</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Mensaje</TableHead>
                                <TableHead className="text-center text-muted-foreground font-semibold">Ocurrencias</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Fecha</TableHead>
                                <TableHead className="text-right text-muted-foreground font-semibold"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-secondary opacity-50" />
                                        <p className="mt-2 text-muted-foreground">Cargando incidentes...</p>
                                    </TableCell>
                                </TableRow>
                            ) : alerts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
                                        <p className="text-muted-foreground">No se encontraron alertas en este estado.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                alerts.map((alert) => (
                                    <TableRow key={alert.id} className="group transition-all hover:bg-gray-800/20 hover:rounded-2xl border-border text-foreground hover:cursor-pointer">
                                        <TableCell>
                                            <Badge variant={getSeverityColor(alert.severity) as any} className="capitalize shadow-none">
                                                {alert.severity.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-[10px] text-muted-foreground">{alert.code}</TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm line-clamp-1" title={alert.message}>{alert.message}</span>
                                                {alert.context && (alert.context as any).url && (
                                                    <span className="text-[10px] text-muted-foreground truncate opacity-70">
                                                        {(alert.context as any).url}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold">
                                                {alert.occurrences}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                                            {format(new Date(alert.updatedAt), "dd MMM, HH:mm", { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {alert.status === 'OPEN' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleResolve(alert.id)}
                                                        className="h-8 px-3 text-xs border-green-200 bg-primary/90 text-gray-200 hover:bg-green-100 hover:text-green-800 hover:border-green-300 transition-all font-medium hover:cursor-pointer"
                                                        title="Marcar como resuelto"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                        Resolver
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    onClick={() => openDetails(alert)}
                                                    className="h-8 px-3 text-xs font-medium hover:bg-secondary/80 hover:cursor-pointer"
                                                >
                                                    Detalles
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    
                </div>
                {/* Controles de Paginación */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                            <div className="text-xs text-muted-foreground font-medium">
                                Página {page} de {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="h-8 w-8 p-0 hover:cursor-pointer"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex gap-1">
                                    {[...Array(Math.max(0, totalPages))].map((_, i) => {
                                        const p = i + 1;
                                      
                                        if (totalPages > 5 && Math.abs(p - page) > 1 && p !== 1 && p !== totalPages) {
                                            if (p === 2 || p === totalPages - 1) return <span key={p} className="flex items-center px-1 text-muted-foreground">...</span>;
                                            return null;
                                        }
                                        return (
                                            <Button
                                                key={p}
                                                variant={page === p ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setPage(p)}
                                                className="h-8 w-8 p-0 text-xs hover:cursor-pointer"
                                            >
                                                {p}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm" 
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="h-8 w-8 p-0 hover:cursor-pointer"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
            </div>

            <AlertDetailsDialog 
                alert={selectedAlert}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
