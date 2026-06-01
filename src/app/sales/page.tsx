"use client"

import { BranchSelector } from "@/components/admin/branch-selector"
import { HistoryTab } from "@/components/sales/history-tab"
import { MercadoPagoTab } from "@/components/sales/mercadopago-tab"
import { RegistrationTab } from "@/components/sales/registration-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { cn } from "@/lib/utils"
import { DataService } from "@/services/data-service"
import { useBranchStore } from "@/store/branch.store"
import { Sale } from "@/types/schema"
import { RefreshCw, Wifi, WifiOff } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export default function SalesPage() {
    const isOnline = useOnlineStatus()
    const { activeBranch } = useBranchStore()
    const [sales, setSales] = useState<Sale[]>([])
    const [isLoadingSales, setIsLoadingSales] = useState(false)
    const loadSalesHistory = useCallback(async () => {
        setIsLoadingSales(true)
        try {
            const data = await DataService.getSales({ branchId: activeBranch?.id })
            setSales(data as any)
        } finally {
            setIsLoadingSales(false)
        }
    }, [activeBranch])

    useEffect(() => {
        loadSalesHistory()
    }, [loadSalesHistory])

    return (
        <div className="flex flex-col h-[100dvh] bg-background overflow-hidden ">

            <Tabs defaultValue="registro" className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-background border-b border-border shadow-sm relative z-30">
                    <TabsList className="w-full justify-start h-auto md:h-12 rounded-none bg-transparent p-0 overflow-x-auto flex-wrap md:flex-nowrap">
                        <TabsTrigger value="registro" className="h-12 md:h-full rounded-none border-b-2 border-transparent px-4 md:px-6 data-[state=active]:border-secondary data-[state=active]:bg-muted hover:bg-muted/50 transition-colors whitespace-nowrap">Registrar Venta</TabsTrigger>
                        <TabsTrigger value="historial" className="h-12 md:h-full rounded-none border-b-2 border-transparent px-4 md:px-6 data-[state=active]:border-secondary  data-[state=active]:bg-muted hover:bg-muted/50  transition-colors whitespace-nowrap">Historial</TabsTrigger>
                        <TabsTrigger value="mercadopago" className="h-12 md:h-full rounded-none border-b-2 border-transparent px-4 md:px-6 data-[state=active]:border-secondary data-[state=active]:bg-muted hover:bg-muted/50 transition-colors whitespace-nowrap">Mercado Pago</TabsTrigger>

                        <div className="flex gap-2 flex-wrap md:flex-nowrap w-full justify-start md:justify-end px-4 md:px-6 py-2 md:py-0 items-center">
                            <BranchSelector />
                            <Button variant="ghost" size="sm" className=" h-8 text-muted-foreground text-xs hover:text-foreground hover:bg-muted transition-colors hover:cursor-pointer" onClick={loadSalesHistory} disabled={isLoadingSales}>
                                <RefreshCw className={cn("w-3 h-3 mr-1", isLoadingSales && "animate-spin")} /> Actualizar Datos
                            </Button>
                            <Badge variant={isOnline ? "outline" : "destructive"} className={isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : ""}>
                                {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                                {isOnline ? "Conectado" : "Offline"}
                            </Badge>
                        </div>
                    </TabsList>
                </div>

                <div className="flex-1 sm:p-4 pt-4 md:p-6 overflow-y-auto bg-background relative z-10 w-full pb-32">
                    <TabsContent value="registro" className="h-full m-0 data-[state=active]:flex flex-col animate-in fade-in-50 duration-200 overflow-y-auto">
                        <RegistrationTab />
                    </TabsContent>

                    <TabsContent value="historial" className="h-full m-0 overflow-y-auto animate-in fade-in-50 duration-200">
                        {isLoadingSales ? (
                            <div className="flex items-center justify-center h-64">
                                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground opacity-50" />
                            </div>
                        ) : (
                            <HistoryTab sales={sales} />
                        )}
                    </TabsContent>

                    <TabsContent value="mercadopago" className="h-full m-0 overflow-y-auto animate-in fade-in-50 duration-200">
                        <MercadoPagoTab sales={sales} />
                    </TabsContent>


                </div>
            </Tabs>


        </div>
    )
}
