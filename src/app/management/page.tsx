"use client";

import { DashboardCurrencyToggle } from "@/components/features/dashboard/DashboardCurrencyToggle";
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
import { formatCurrency } from "@/lib/utils";
import { AdminAPI, ConfigAPI, CurrenciesAPI } from "@/services/api";
import { useBranchStore } from "@/store/branch.store";
import { useConfigStore, useRubro } from "@/store/config.store";
import {
    DollarSign,
    LayoutDashboard,
    RefreshCcw,
    ShoppingBag,
    TrendingUp,
    Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export default function ManagementPage() {
    const [timeRange, setTimeRange] = useState("month");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState("");
    const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
    const { activeBranch } = useBranchStore();
    const rubro = useRubro();
    const { config } = useConfigStore();

    const currency = useMemo(
        () => availableCurrencies.find((c) => c.code === displayCurrency),
        [availableCurrencies, displayCurrency],
    );

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const [currencies, config] = await Promise.all([
                CurrenciesAPI.getAll(true),
                ConfigAPI.get()
            ]);
            const baseCode = config?.baseCurrency || 'ARS';
            const filteredCurrencies = currencies.filter((c: any) => c.code === baseCode || c.code === 'USD');

            setAvailableCurrencies(filteredCurrencies);
            const base = currencies.find((c: any) => c.code === baseCode) || currencies[0];
            if (!displayCurrency && base) setDisplayCurrency(base.code);

            const params: any = { timeRange };
            if (activeBranch) {
                params.branchId = activeBranch.id;
            }
            const data = await AdminAPI.getStats(params);

            setStats(data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [timeRange, activeBranch, displayCurrency]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const formatValue = (value: number) => {
        const currency = availableCurrencies.find(
            (c) => c.code === displayCurrency,
        );
        const rate = currency ? Number(currency.exchangeRateToBase) : 1;
        const converted = value * rate;

        return formatCurrency(converted, displayCurrency || "USD");
    };

    const convertedStats = useMemo(() => {
        if (!stats) return null;
        const currency = availableCurrencies.find(
            (c) => c.code === displayCurrency,
        );
        const rate = currency ? Number(currency.exchangeRateToBase) : 1;

        return {
            ...stats,
            totalRevenue: (stats.totalRevenue || 0) * rate,
            avgTicket: (stats.avgTicket || 0) * rate,
            chartData: stats.chartData?.map((d: any) => ({
                ...d,
                total: (d.total || 0) * rate,
            })),
            paymentMethodsData: stats.paymentMethods?.map((m: any) => ({
                ...m,
                value: (m.value || 0) * rate,
            })),
            topProducts: stats.topProducts?.map((p: any) => ({
                ...p,
                revenue: (p.revenue || 0) * rate,
            })),
            topUsers: stats.topUsers?.map((u: any) => ({
                ...u,
                revenue: (u.revenue || 0) * rate,
            })),
            topEmployees: stats.topEmployees?.map((e: any) => ({
                ...e,
                revenue: (e.revenue || 0) * rate,
            })),
        };
    }, [stats, displayCurrency, availableCurrencies]);




    return (
        <div className="p-1 sm:p-4 md:p-8 pt-2 mb-20 space-y-4 md:space-y-8 ">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="h-6 w-6" />
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Resumen general del estado del negocio.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <DashboardCurrencyToggle
                        currentCurrency={displayCurrency}
                        currencies={availableCurrencies}
                        onToggle={setDisplayCurrency}
                    />
                    <div className="flex items-center gap-1 sm:gap-2 ">
                        <div className="flex items-center gap-1 sm:gap-2  bg-background rounded-md border p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={loadStats}
                                disabled={loading}
                                title="Actualizar datos"
                                className="hover:cursor-pointer"
                            >
                                <RefreshCcw
                                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                                />
                            </Button>
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-[130px] sm:w-[180px] border-none shadow-none focus:ring-0">
                                    <SelectValue placeholder="Periodo" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-950 border shadow-md z-[200]">
                                    <SelectItem value="today">Hoy</SelectItem>
                                    <SelectItem value="yesterday">Ayer</SelectItem>
                                    <SelectItem value="week">Última Semana</SelectItem>
                                    <SelectItem value="month">Último Mes</SelectItem>
                                    <SelectItem value="year">Último Año</SelectItem>
                                    <SelectItem value="total">Histórico Total</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <RefreshCcw className="h-12 w-12 animate-spin text-secondary opacity-20" />
                    <p className="text-muted-foreground animate-pulse">
                        Cargando estadísticas...
                    </p>
                </div>
            ) : !stats ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-full">
                        <LayoutDashboard className="h-12 w-12 text-amber-500 opacity-50" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg">Sin datos para mostrar</p>
                        <p className="text-muted-foreground text-sm">
                            No se pudieron recuperar las estadísticas en este momento.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4 hover:cursor-pointer"
                            onClick={loadStats}
                        >
                            Reintentar
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {(rubro?.cartEnabled ?? true) && (
                            <Card className="p-6 relative overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                            Total Recaudado
                                        </p>
                                        <h3
                                            className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate"
                                            title={formatValue(stats?.totalRevenue || 0)}
                                        >
                                            {formatValue(stats?.totalRevenue || 0)}
                                        </h3>
                                    </div>
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    {stats?.revenueGrowth !== undefined &&
                                        stats?.revenueGrowth !== 0 && (
                                            <span
                                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${stats.revenueGrowth > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"}`}
                                            >
                                                {stats.revenueGrowth > 0 ? "+" : ""}
                                                {stats.revenueGrowth?.toFixed(1)}%
                                            </span>
                                        )}
                                    <span className="text-xs text-muted-foreground">
                                        vs periodo anterior
                                    </span>
                                </div>
                            </Card>
                        )}

                        {/* Card Ventas / Leads */}
                        <Card className="p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        {(rubro?.cartEnabled ?? true) ? "Ventas" : "Consultas / Leads"}
                                    </p>
                                    <h3 className="text-3xl font-bold tracking-tight">
                                        {stats?.totalSalesCount || 0}
                                    </h3>
                                </div>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                                    {(rubro?.cartEnabled ?? true) ? "Ventas" : "Contactos"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    en el periodo
                                </span>
                            </div>
                        </Card>

                        {/* Card Clientes */}
                        <Card className="p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        Clientes
                                    </p>
                                    <h3 className="text-3xl font-bold tracking-tight">
                                        {stats?.newUsersPeriod || 0}
                                    </h3>
                                </div>
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                                    Nuevos
                                </span>
                                <span className="text-xs text-muted-foreground">usuarios</span>
                            </div>
                        </Card>

                        {/* Card Ticket Promedio */}
                        <Card className="p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        Ticket Promedio
                                    </p>
                                    <h3 className="text-3xl font-bold tracking-tight">
                                        {formatValue(stats?.avgTicket || 0)}
                                    </h3>
                                </div>
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
                                    Valor medio
                                </span>
                                <span className="text-xs text-muted-foreground">por venta</span>
                            </div>
                        </Card>
                    </div>

                    {/* Seccion de Graficos */}
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Evolución de Ingresos</CardTitle>
                                <CardDescription>
                                    {timeRange === "today"
                                        ? "Por hora"
                                        : timeRange === "year"
                                            ? "Por mes"
                                            : "Por día"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={convertedStats?.chartData || []}>
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
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                                    return String(value);
                                                }}
                                                fontSize={12}
                                                stroke="#71717a"
                                            />
                                            <Tooltip
                                                cursor={{ fill: "transparent" }}
                                                contentStyle={{
                                                    borderRadius: "8px",
                                                    border: "1px solid var(--border)",
                                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                                    backgroundColor: "hsl(var(--card))",
                                                    color: "hsl(var(--card-foreground))",
                                                }}
                                                formatter={(value: any) => [
                                                    formatCurrency(Number(value), displayCurrency || 'USD'),
                                                    "Total",
                                                ]}
                                            />
                                            <Bar
                                                dataKey="total"
                                                fill="#0ea5e9"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Métodos de Pago</CardTitle>
                                <CardDescription>Distribución en el periodo.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={convertedStats?.paymentMethodsData || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {(convertedStats?.paymentMethodsData || []).map(
                                                    (entry: any, index: number) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899"][
                                                                index % 4
                                                                ]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [
                                                    formatCurrency(Number(value), displayCurrency || 'USD'),
                                                    "Volumen",
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-4 flex-wrap">
                                    {(convertedStats?.paymentMethodsData || []).map(
                                        (item: any, index: number) => (
                                            <div key={item.name} className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor: [
                                                            "#22c55e",
                                                            "#3b82f6",
                                                            "#f59e0b",
                                                            "#ec4899",
                                                        ][index % 4],
                                                    }}
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {item.name === "CASH"
                                                        ? "EFECTIVO"
                                                        : item.name === "CREDIT_CARD"
                                                            ? "TARJETA DE CRÉDITO"
                                                            : item.name === "DEBIT_CARD"
                                                                ? "TARJETA DE DÉBITO"
                                                                : item.name === "TRANSFER"
                                                                    ? "TRANSFERENCIA"
                                                                    : item.name === "CHECK"
                                                                        ? "CHEQUE"
                                                                        : item.name === "MERCADO_PAGO"
                                                                            ? "MERCADO PAGO"
                                                                            : item.name}{" "}
                                                    ({item.count})
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Seccion de Listas */}
                    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
                        <Card className="p-6 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">Top Productos</h3>
                            </div>
                            <div className="space-y-4">
                                {(convertedStats?.topProducts || []).map(
                                    (product: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 font-bold text-xs ring-4 ring-white dark:ring-zinc-950">
                                                    #{i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm truncate max-w-[150px]">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {product.sales} sales •
                                                        <span className="text-emerald-500 font-medium ml-1">
                                                            {formatCurrency(product.revenue || 0, displayCurrency || 'USD')}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )}
                                {(!stats?.topProducts || stats.topProducts.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay datos disponibles.
                                    </p>
                                )}
                            </div>
                        </Card>

                        <Card className="p-6 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">Top Clientes</h3>
                            </div>
                            <div className="space-y-4">
                                {(convertedStats?.topUsers || []).map(
                                    (user: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs ring-4 ring-white dark:ring-zinc-950">
                                                    {user.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm truncate max-w-[150px]">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {user.orders} orders •
                                                        <span className="text-blue-500 font-medium ml-1">
                                                            {formatCurrency(user.totalSpent || 0, displayCurrency || 'USD')}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )}
                                {(!stats?.topUsers || stats.topUsers.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay datos disponibles.
                                    </p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {stats?.topEmployees && stats.topEmployees.length > 0 && (
                        <Card className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-none">
                            <CardHeader>
                                <CardTitle className="text-white">Mejores Vendedores</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Ranking en el periodo seleccionado.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(convertedStats?.topEmployees || []).map(
                                        (emp: any, i: number) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between border-b border-zinc-700 pb-4 last:border-0 last:pb-0"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold border border-secondary/50">
                                                        EM
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{emp.name}</p>
                                                        <p className="text-xs text-zinc-400">
                                                            {emp.salesCount} ventas cerradas
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-emerald-400">
                                                    {formatCurrency(
                                                        emp.revenue,
                                                        displayCurrency || "USD",
                                                    )}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                    {(!convertedStats?.topEmployees ||
                                        convertedStats?.topEmployees.length === 0) && (
                                            <p className="text-sm text-zinc-400 text-center py-4">
                                                No hay datos en este periodo.
                                            </p>
                                        )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
