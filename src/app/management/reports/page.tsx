"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatCurrency } from "@/lib/utils";
import { ConfigAPI } from "@/services/api";
import reportService, {
    FinancialStats,
    StockValuation,
} from "@/services/report.service";
import { useBranchStore } from "@/store/branch.store";
import { StoreConfig } from "@/types/extended";
import {
    ArrowDown,
    ArrowUp,
    DollarSign,
    Receipt,
    RefreshCcw,
    TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("financial");
    const { activeBranch } = useBranchStore();

    const { hasAccess } = useRequireRole(["SUPER_ADMIN", "ADMIN"]);

    const [financialRange, setFinancialRange] = useState("month");
    const [financialStats, setFinancialStats] = useState<FinancialStats | null>(
        null,
    );
    const [loadingFinancial, setLoadingFinancial] = useState(false);

    const [stockValuation, setStockValuation] = useState<StockValuation | null>(
        null,
    );
    const [loadingStock, setLoadingStock] = useState(false);

    const [config, setConfig] = useState<StoreConfig | null>(null);

    const loadConfig = async () => {
        try {
            const data = await ConfigAPI.get();
            setConfig(data);
        } catch (error) { }
    };

    const loadFinancials = useCallback(async () => {
        setLoadingFinancial(true);
        try {
            const now = new Date();
            let start = new Date();
            let end = new Date();

            if (financialRange === "month") {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (financialRange === "year") {
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
            } else if (financialRange === "last_month") {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
            }

            const data = await reportService.getFinancialStats({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                branchId: activeBranch?.id,
            });
            setFinancialStats(data);
        } catch (error) {
        } finally {
            setLoadingFinancial(false);
        }
    }, [financialRange, activeBranch]);

    const loadStockValuation = useCallback(async () => {
        setLoadingStock(true);
        try {
            const data = await reportService.getStockValuation({
                branchId: activeBranch?.id,
            });
            setStockValuation(data);
        } catch (error) {
        } finally {
            setLoadingStock(false);
        }
    }, [activeBranch]);

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        if (activeTab === "financial") {
            loadFinancials();
        } else if (activeTab === "stock") {
            loadStockValuation();
        }
    }, [activeTab, loadFinancials, loadStockValuation]);

    return (
        <div className="p-1 sm:p-4 md:p-8 pt-2 mb-20 space-y-8 ">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" />
                        Reportes y Finanzas
                    </h1>
                    <p className="text-muted-foreground">
                        Análisis financiero y valoración de inventario.
                    </p>
                </div>
            </div>

            <Tabs
                defaultValue="financial"
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4 px-2 "
            >
                <TabsList className="gap-4">
                    <TabsTrigger
                        className="border-2 border-gray-300 data-[state=active]:bg-secondary/30 data-[state=active]:border-secondary/80"
                        value="financial"
                    >
                        Resumen Financiero
                    </TabsTrigger>
                    <TabsTrigger
                        className="border-2 border-gray-300 data-[state=active]:bg-secondary/30 data-[state=active]:border-secondary/80"
                        value="stock"
                    >
                        Valuación de Stock
                    </TabsTrigger>
                </TabsList>

                {/* TABLA FINANCIERA */}
                <TabsContent value="financial" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Select value={financialRange} onValueChange={setFinancialRange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Periodo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="month">Este Mes</SelectItem>
                                    <SelectItem value="last_month">Mes Pasado</SelectItem>
                                    <SelectItem value="year">Este Año</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={loadFinancials}
                                disabled={loadingFinancial}
                                className="hover:cursor-pointer"
                            >
                                <RefreshCcw
                                    className={`h-4 w-4 ${loadingFinancial ? "animate-spin" : ""}`}
                                />
                            </Button>
                        </div>
                    </div>

                    {financialStats && (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Ingresos Totales
                                        </CardTitle>
                                        <ArrowUp className="h-4 w-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(
                                                financialStats.totalGrossRevenue || 0,
                                                config?.baseCurrency || "USD",
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Ventas cobradas (en moneda base)
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Costo de Ventas (COGS)
                                        </CardTitle>
                                        <ArrowDown className="h-4 w-4 text-rose-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(
                                                financialStats.totalCOGS || 0,
                                                config?.baseCurrency || "USD",
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Costo de mercadería ya vendida
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Pagos a Proveedores
                                        </CardTitle>
                                        <ArrowDown className="h-4 w-4 text-orange-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(
                                                financialStats.totalCashOutflow || 0,
                                                config?.baseCurrency || "USD",
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Egresos reales (órdenes pagadas)
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Gastos Operativos
                                        </CardTitle>
                                        <Receipt className="h-4 w-4 text-rose-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-rose-600">
                                            {formatCurrency(
                                                financialStats.totalOperatingExpenses || 0,
                                                config?.baseCurrency || "USD",
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Servicios, sueldos y otros
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Ganancia Neta
                                        </CardTitle>
                                        <DollarSign className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                                        >
                                            {formatCurrency(
                                                financialStats.netProfit || 0,
                                                config?.baseCurrency || "USD",
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Utilidad final (post-gastos)
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Margen
                                        </CardTitle>
                                        <TrendingUp className="h-4 w-4 text-borderH" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {financialStats.netMargin?.toFixed(1)}%
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            % de ganancia sobre ingresos
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Flujo de Caja</CardTitle>
                                    <CardDescription>
                                        Evolución de ingresos y egresos en el periodo.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={financialStats.chartData || []}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    stroke="#E4E4E7"
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickMargin={10}
                                                    fontSize={12}
                                                    stroke="#71717a"
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value) =>
                                                        `${config?.currencySymbol || "$"}${value / 1000}k`
                                                    }
                                                    fontSize={12}
                                                    stroke="#71717a"
                                                />
                                                <Tooltip
                                                    cursor={{ fill: "transparent" }}
                                                    contentStyle={{
                                                        borderRadius: "8px",
                                                        border: "none",
                                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                                    }}
                                                />
                                                <Legend />
                                                <Bar
                                                    dataKey="revenue"
                                                    name="Ingresos"
                                                    fill="#10b981"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="cogs"
                                                    name="Costo de Ventas"
                                                    fill="#f43f5e"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="operatingExpenses"
                                                    name="Gastos Op."
                                                    fill="#e11d48"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="profit"
                                                    name="Ganancia Neta"
                                                    fill="#3b82f6"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="cashOutflow"
                                                    name="Pagos Emitidos"
                                                    fill="#f97316"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* TABLA DE STOCK*/}
                <TabsContent value="stock" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div></div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={loadStockValuation}
                            disabled={loadingStock}
                            className="hover:cursor-pointer"
                        >
                            <RefreshCcw
                                className={`h-4 w-4 ${loadingStock ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>

                    {stockValuation && (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Valuación Total
                                        </CardTitle>
                                        <DollarSign className="h-4 w-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(
                                                stockValuation.totalValue || 0,
                                                config?.baseCurrency || "ARS",
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Costo estimado (en moneda base)
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Total de Unidades
                                        </CardTitle>
                                        <ArrowUp className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {stockValuation.totalItems?.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Productos físicos en stock
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Variedad (SKUs)
                                        </CardTitle>
                                        <TrendingUp className="h-4 w-4 text-amber-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {stockValuation.totalSkus?.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Códigos únicos con stock
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Valuación por Categoría</CardTitle>
                                        <CardDescription>
                                            Distribución del valor del inventario.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    layout="vertical"
                                                    data={stockValuation.byCategory.slice(0, 10)}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        horizontal={true}
                                                        stroke="#E4E4E7"
                                                    />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="name"
                                                        type="category"
                                                        width={100}
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: "transparent" }}
                                                        formatter={(value: any) =>
                                                            formatCurrency(
                                                                value,
                                                                config?.baseCurrency || "ARS",
                                                            )
                                                        }
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        fill="#8b5cf6"
                                                        radius={[0, 4, 4, 0]}
                                                        barSize={20}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Top Productos (Valor)</CardTitle>
                                        <CardDescription>
                                            Productos con mayor capital inmovilizado.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="text-right">Stock</TableHead>
                                                    <TableHead className="text-right">Costo U.</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {stockValuation.topItems.map((item, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium text-xs">
                                                            {item.name}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {item.stock}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(
                                                                item.unitCost,
                                                                config?.baseCurrency || "ARS",
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {formatCurrency(
                                                                item.totalValue,
                                                                config?.baseCurrency || "ARS",
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
