"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
    Card
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import api from "@/services/api"
import { useBranchStore } from "@/store/branch.store"
import { useConfigStore } from "@/store/config.store"
import { format } from "date-fns"
import { Plus, RefreshCcw, Trash2, ExternalLink } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const CATEGORIES = [
    "Luz", "Agua", "Gas", "Internet", "Sueldos",
    "Transporte", "Mantenimiento", "Alquiler", "Impuestos", "Otros"
]

export default function ExpensesPage() {
    const { toast } = useToast()
    const { activeBranch } = useBranchStore()
    const { config } = useConfigStore()
    const [expenses, setExpenses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [openAdd, setOpenAdd] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [formLoading, setFormLoading] = useState(false)

    const [formData, setFormData] = useState({
        amount: "",
        currencyCode: config?.baseCurrency || "ARS",
        category: "",
        notes: "",
        expenseDate: new Date().toISOString().split('T')[0]
    })
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        category: "ALL"
    })

    useEffect(() => {
        if (config?.baseCurrency) {
            setFormData(prev => ({ ...prev, currencyCode: config.baseCurrency || "ARS" }));
        }
    }, [config])

    const fetchExpenses = useCallback(async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (activeBranch) params.branchId = activeBranch.id
            if (filters.startDate) params.startDate = filters.startDate
            if (filters.endDate) params.endDate = filters.endDate
            if (filters.category && filters.category !== 'ALL') params.category = filters.category

            const { data } = await api.get('/expenses', { params })
            setExpenses(data.data || [])
        } catch (error) {
            toast({ title: "Error al cargar gastos", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [activeBranch, filters, toast])

    useEffect(() => {
        fetchExpenses()
    }, [fetchExpenses])

    const handleAddExpense = async () => {
        if (!formData.amount || !formData.category) {
            return toast({ title: "Monto y Categoría son obligatorios", variant: "destructive" })
        }
        setFormLoading(true)
        try {
            const formDataPayload = new FormData()
            formDataPayload.append('amount', formData.amount)
            formDataPayload.append('currencyCode', formData.currencyCode)
            formDataPayload.append('category', formData.category)
            formDataPayload.append('notes', formData.notes)
            formDataPayload.append('expenseDate', new Date(formData.expenseDate).toISOString())
            if (activeBranch) formDataPayload.append('branchId', activeBranch.id.toString())
            
            if (invoiceFile) {
                formDataPayload.append('invoice', invoiceFile)
            }

            await api.post('/expenses', formDataPayload)
            toast({ title: "Gasto registrado exitosamente" })
            setOpenAdd(false)
            setFormData({ amount: "", currencyCode: config?.baseCurrency || "ARS", category: "", notes: "", expenseDate: new Date().toISOString().split('T')[0] })
            setInvoiceFile(null)
            fetchExpenses()
        } catch (error: any) {
            toast({ title: "Error al registrar gasto", description: error.response?.data?.message, variant: "destructive" })
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingId) return
        try {
            await api.delete(`/expenses/${deletingId}`)
            toast({ title: "Gasto eliminado" })
            fetchExpenses()
        } catch (error) {
            toast({ title: "Error al eliminar gasto", variant: "destructive" })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="p-0 sm:p-8 pt-2 space-y-6 mb-20 ">

            <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink>Expensas</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
                        Otros Gastos
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchExpenses}
                            disabled={loading}
                            className="hover:cursor-pointer"
                        >
                            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </h1>
                    <p className="text-muted-foreground">Registra servicios, salarios y costos operativos</p>
                </div>
                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                    <DialogTrigger asChild>
                        <Button className="hover:cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" /> Registrar Gasto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Nuevo Gasto Operativo</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Monto</Label>
                                <Input type="number" step="any"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Moneda</Label>
                                <Input
                                    value={formData.currencyCode}
                                    onChange={e => setFormData({ ...formData, currencyCode: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.category === "Otros" && (
                                <div className="space-y-2">
                                    <Label>Escribe la Categoría</Label>
                                    <Input
                                        placeholder="Ej: Gas, Internet, etc."
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Fecha del Gasto</Label>
                                <Input type="date"
                                    value={formData.expenseDate}
                                    onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Notas adicionales</Label>
                                <Input
                                    placeholder="Detalles sobre el gasto..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Factura (PDF o Imagen)</Label>
                                <Input 
                                    type="file" 
                                    accept="application/pdf,image/*"
                                    onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
                                    className="hover:cursor-pointer"
                                />
                            </div>
                        </div>
                        <Button onClick={handleAddExpense} disabled={formLoading} className="w-full">
                            {formLoading ? "Guardando..." : "Guardar Gasto"}
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            {/* BARRA DE FILTROS */}
            <Card className="p-4 border-2 border-border shadow-sm bg-card rounded-xl">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Desde</Label>
                        <Input
                            type="date"
                            className="h-9 w-40"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Hasta</Label>
                        <Input
                            type="date"
                            className="h-9 w-40"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Categoría</Label>
                        <Select
                            value={filters.category}
                            onValueChange={val => setFilters({ ...filters, category: val })}
                        >
                            <SelectTrigger className="h-9 w-40">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas</SelectItem>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 px-4 hover:cursor-pointer"
                        onClick={() => setFilters({ startDate: "", endDate: "", category: "ALL" })}
                    >
                        Limpiar Filtros
                    </Button>
                </div>
            </Card>

            <div className="sm:rounded-3xl rounded-none border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Notas</TableHead>
                            <TableHead>Registrado Por</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={6} className="text-center py-4">Cargando gastos...</TableCell></TableRow>}
                        {!loading && expenses.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No se encontraron gastos en este periodo.</TableCell></TableRow>
                        )}
                        {!loading && expenses.map(expense => (
                            <TableRow key={expense.id} className="hover:cursor-pointer hover:bg-gray-300">
                                <TableCell>{format(new Date(expense.expenseDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="font-medium">{expense.category}</TableCell>
                                <TableCell className="text-muted-foreground max-w-[200px] truncate">{expense.notes || '-'}</TableCell>
                                <TableCell>{expense.admin?.name || 'Admin'}</TableCell>
                                <TableCell className="text-right font-bold text-rose-600">
                                    -{formatCurrency(Number(expense.amount), expense.currencyCode || config?.baseCurrency || 'ARS', config?.currencySymbol)}
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    {expense.invoiceUrl && (() => {
                                        let fileUrl = expense.invoiceUrl;
                                        if (fileUrl.includes('cloudinary.com') && fileUrl.endsWith('.pdf') && !fileUrl.includes('fl_attachment')) {
                                            fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
                                        }
                                        return (
                                            <Button variant="outline" size="icon" asChild title="Ver Factura" className="hover:cursor-pointer h-8 w-8">
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" /> 
                                                </a>
                                            </Button>
                                        );
                                    })()}
                                    <Button variant="ghost" size="icon" onClick={() => setDeletingId(expense.id)} className="text-destructive hover:bg-destructive/10 hover:cursor-pointer h-8 w-8">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={deletingId !== null}
                onOpenChange={(v) => !v && setDeletingId(null)}
                title="Eliminar Gasto"
                description="¿Estás seguro de que deseas eliminar este registro? Esto recalculará las métricas de ingresos."
                confirmText="Eliminar"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </div>
    )
}
