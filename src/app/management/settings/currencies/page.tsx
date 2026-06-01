"use client"

import { CurrencyDialog } from "@/components/admin/currency-dialog"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { CurrenciesAPI } from "@/services/api"
import { Currency } from "@/types/schema"
import { Coins, Edit, Loader2, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export default function CurrenciesPage() {
    const { toast } = useToast()
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [loading, setLoading] = useState(true)
    
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)

    const loadCurrencies = useCallback(async () => {
        setLoading(true)
        try {
            const data = await CurrenciesAPI.getAll(false)
            setCurrencies(data)
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las monedas", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadCurrencies()
    }, [loadCurrencies])



    const handleCreate = () => {
        setSelectedCurrency(null)
        setDialogOpen(true)
    }

    const handleEdit = (currency: Currency) => {
        setSelectedCurrency(currency)
        setDialogOpen(true)
    }

    const handleDelete = async (currency: Currency) => {
        if (!confirm(`¿Eliminar moneda ${currency.code}?`)) return;

        try {
            await CurrenciesAPI.delete(currency.id)
            toast({ title: "Moneda eliminada" })
            loadCurrencies()
        } catch (error: any) {
            toast({ 
                title: "Error", 
                description: error.response?.data?.message || "No se pudo eliminar la moneda", 
                variant: "destructive" 
            })
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
             <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink href="/management/settings">Configuración</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Monedas</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Monedas</h1>
                    <p className="text-muted-foreground">Gestiona las monedas activas y sus tasas de cambio respecto a la moneda base.</p>
                </div>
                <Button onClick={handleCreate} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Moneda
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Símbolo</TableHead>
                                    <TableHead>Tasa (vs Base)</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currencies.map((currency) => (
                                    <TableRow 
                                        key={currency.id} 
                                        className="hover:bg-muted/50 transition-colors cursor-pointer" 
                                        onClick={() => handleEdit(currency)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Coins className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-bold">{currency.code}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-lg">{currency.symbol}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 font-mono font-medium">
                                                {currency.exchangeRateToBase}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={currency.isActive ? "default" : "secondary"}>
                                                {currency.isActive ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" className="hover:cursor-pointer" onClick={(e) => { e.stopPropagation(); handleEdit(currency); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(currency); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {currencies.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No hay monedas configuradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CurrencyDialog 
                key={selectedCurrency?.id ? `edit-${selectedCurrency.id}` : 'create-new'}
                open={dialogOpen} 
                onOpenChange={setDialogOpen} 
                currency={selectedCurrency} 
                onSuccess={loadCurrencies} 
            />
        </div>
    )
}
