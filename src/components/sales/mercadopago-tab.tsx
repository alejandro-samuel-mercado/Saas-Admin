"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Sale } from "@/types/schema"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, FilterX, Search } from "lucide-react"
import { useState } from "react"
import { SaleDetailsDialog } from "../management/sales/sale-details-dialog"
import { SalesTable } from "../management/sales/sales-table"

interface MercadoPagoTabProps {
    sales: Sale[]
}

export function MercadoPagoTab({ sales }: MercadoPagoTabProps) {
     const [globalFilter, setGlobalFilter] = useState("")
     const [date, setDate] = useState<Date | undefined>(undefined)
     const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
     const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>("all")
     const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>("all")
     const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "maxPrice" | "minPrice">("recent")
     const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

   
     const salesArray = (Array.isArray(sales) ? sales : ((sales as any)?.data || [])) as Sale[];

     const mpSales = salesArray.filter((sale: Sale) => 
        sale.paymentType === "MERCADO_PAGO"
     )

     const filteredSales = mpSales.filter((sale: Sale) => {
        const searchTerm = globalFilter.toLowerCase();
        const matchesGlobal = 
            (sale.id?.toString() || "").includes(searchTerm) ||
            (sale.uuid?.toLowerCase() || "").includes(searchTerm) || 
            (sale.user?.name?.toLowerCase() || "").includes(searchTerm) ||
            (sale.user?.email?.toLowerCase() || "").includes(searchTerm) ||
            (sale.user?.phone?.toString() || "").includes(searchTerm) ||
            (sale.user?.dni?.toString() || "").includes(searchTerm) ||
            false 
            
        const saleDate = new Date(sale.createdAt || 0)
        const matchesDate = date ? saleDate.toDateString() === date.toDateString() : true
        const matchesPayment = paymentStatusFilter === "all" || sale.paymentStatus === paymentStatusFilter
        const matchesDeliveryStatus = deliveryStatusFilter === "all" || sale.deliveryStatus === deliveryStatusFilter
        const matchesDeliveryType = deliveryTypeFilter === "all" || sale.deliveryType === deliveryTypeFilter

        return matchesGlobal && matchesDate && matchesPayment && matchesDeliveryStatus && matchesDeliveryType
    }).sort((a: Sale, b: Sale) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        
        switch (sortOrder) {
            case "recent": return dateB - dateA
            case "oldest": return dateA - dateB
            case "maxPrice": return Number(b.total) - Number(a.total)
            case "minPrice": return Number(a.total) - Number(b.total)
            default: return 0
        }
    })

     return (
        <div className="bg-card rounded-lg border border-border sm:p-4 pt-4 md:p-6 shadow-sm space-y-4 md:space-y-6 flex flex-col">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4">
                <div>
                     <h2 className="text-lg font-bold">Pagos Mercado Pago</h2>
                     <p className="text-sm text-muted-foreground">Ventas procesadas a través de la pasarela.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                     <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                             placeholder="Buscar por ID, Cliente..." 
                             className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20" 
                             value={globalFilter}
                             onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                     </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn(!date && "text-muted-foreground", "rounded-full hover:cursor-pointer")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: es }) : "Fecha"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                        <SelectTrigger className="w-[150px] rounded-full">
                            <SelectValue placeholder="Estado Pago" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">PAGO: Todos</SelectItem>
                            <SelectItem value="PAID">Pagada</SelectItem>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="CANCELLED">Cancelada</SelectItem>
                            <SelectItem value="REJECTED">Rechazada</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={deliveryStatusFilter} onValueChange={setDeliveryStatusFilter}>
                        <SelectTrigger className="w-[170px] rounded-full">
                            <SelectValue placeholder="Estado Entrega" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ENTREGA: Todos</SelectItem>
                            <SelectItem value="PENDING_DELIVERY">Pendiente</SelectItem>
                            <SelectItem value="SHIPPED">Enviada</SelectItem>
                            <SelectItem value="DELIVERED">Entregada</SelectItem>
                            <SelectItem value="CANCELLED">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={deliveryTypeFilter} onValueChange={setDeliveryTypeFilter}>
                        <SelectTrigger className="w-[170px] rounded-full">
                            <SelectValue placeholder="Tipo de Entrega" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">TIPO: Todos</SelectItem>
                            <SelectItem value="DELIVERY">Envío a domicilio</SelectItem>
                            <SelectItem value="PICKUP">Retiro por local</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                        <SelectTrigger className="w-full md:w-[150px] rounded-full">
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Más Recientes</SelectItem>
                            <SelectItem value="oldest">Más Antiguas</SelectItem>
                            <SelectItem value="maxPrice">Mayor Precio</SelectItem>
                            <SelectItem value="minPrice">Menor Precio</SelectItem>
                        </SelectContent>
                    </Select>

                    {(date || paymentStatusFilter !== "all" || deliveryStatusFilter !== "all" || deliveryTypeFilter !== "all" || globalFilter) && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full text-muted-foreground hover:text-foreground hover:cursor-pointer"
                            onClick={() => {
                                setDate(undefined)
                                setPaymentStatusFilter("all")
                                setDeliveryStatusFilter("all")
                                setDeliveryTypeFilter("all")
                                setGlobalFilter("")
                            }}
                            title="Limpiar filtros"
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="-mx-2 px-2">
                <SalesTable data={filteredSales} onView={setSelectedSale} hideSearch={true} />
            </div>

            {selectedSale && (
                <SaleDetailsDialog 
                    open={!!selectedSale} 
                    onOpenChange={(open) => !open && setSelectedSale(null)} 
                    sale={selectedSale} 
                    onSaleUpdated={() => {}}
                />
            )}
        </div>
     )
}
