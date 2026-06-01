"use client";

import { StockPDFReport } from "@/components/management/stock/stock-pdf-report";
import { StockTable } from "@/components/management/stock/stock-table";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { exportToCSV } from "@/lib/export-utils";
import { formatCurrency } from "@/lib/utils";
import api from "@/services/api";
import {
    InventoryItem,
    StockControlService,
} from "@/services/stock-control.service";
import { useBranchStore } from "@/store/branch.store";
import { useConfigStore } from "@/store/config.store";
import { Download, Package, RefreshCw, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
}

export default function StockControlPage() {
  const { config: storeConfig } = useConfigStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeBranch } = useBranchStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [stockLevel, setStockLevel] = useState("ALL");
  const [categoryId, setCategoryId] = useState<string>("ALL");
  const [supplierId, setSupplierId] = useState<string>("ALL");
  const [brand, setBrand] = useState<string>("ALL");
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  const [config, setConfig] = useState<any>(null);

  const { fetchConfig: refreshGlobalConfig } = useConfigStore();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        setCategories(data.data || data || []);
      } catch {}
    };
    const fetchSuppliers = async () => {
      try {
        const { data } = await api.get("/suppliers");
        setSuppliers(data?.data?.data || data?.data || data || []);
      } catch {}
    };
    const fetchConfigLocal = async () => {
      try {
        const data = await api.get("/config");
        setConfig(data.data || data);
      } catch {}
    };
    
    fetchCategories();
    fetchSuppliers();
    fetchConfigLocal();
    refreshGlobalConfig(); 
  }, [refreshGlobalConfig]);

  const loadInventory = useCallback(
    async (pageNum = page) => {
      setLoading(true);
      try {
        const response = await StockControlService.getInventory(
          activeBranch?.id || null,
          {
            search,
            stockLevel: stockLevel === "ALL" ? undefined : stockLevel,
            categoryId: categoryId !== "ALL" ? parseInt(categoryId) : undefined,
            supplierId: supplierId !== "ALL" ? parseInt(supplierId) : undefined,
            brand: brand !== "ALL" ? brand : undefined,
            page: pageNum,
            limit,
          },
        );
        setInventory(response.data);
        setTotalPages(response.totalPages);
        setPage(response.page);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el inventario.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      activeBranch,
      search,
      stockLevel,
      categoryId,
      supplierId,
      brand,
      limit,
      toast,
    ],
  );

  useEffect(() => {
    loadInventory(1);
    setPage(1);
  }, [search, stockLevel, categoryId, supplierId, brand, loadInventory]);


  useEffect(() => {
    if (page > 1) {
        loadInventory(page);
    }
  }, [page]);

  const handleExportCSV = () => {
    const low = config?.lowStockThreshold ?? 10;
    const critical = config?.criticalStockThreshold ?? 5;

    const dataToExport = (Array.isArray(inventory) ? inventory : []).map(
      (item) => ({
        SKU: item.skuCode,
        Producto: item.productName,
        Marca: (item as any).brand || "-",
        Categoria: item.categoryName,
        Variante: item.variant || "Standard",
        Stock: item.stock,
        Stock_Minimo: item.minStock,
        Precio: formatCurrency(item.price, storeConfig?.baseCurrency || "USD", storeConfig?.currencySymbol),
        Estado:
          item.stock <= 0
            ? "AGOTADO"
            : item.stock < critical
              ? "CRÍTICO"
              : item.stock < low
                ? "BAJO"
                : "NORMAL",
      }),
    );
    exportToCSV(dataToExport, `inventario_${activeBranch?.name || "branch"}`);
  };

  const hasActiveFilters =
    stockLevel !== "ALL" ||
    categoryId !== "ALL" ||
    supplierId !== "ALL" ||
    brand !== "ALL" ||
    search !== "";

  const clearFilters = () => {
    setSearch("");
    setStockLevel("ALL");
    setCategoryId("ALL");
    setSupplierId("ALL");
    setBrand("ALL");
  };

  return (
    <div className="sm:p-5 p-0 pt-2 space-y-8 ">
      <Breadcrumb className=" px-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Inventario</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Control de Stock</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 items-center justify-between px-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Control de Stock
          </h1>
          <p className="text-muted-foreground">
            Visión general del inventario en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StockPDFReport
            inventory={inventory}
            branchName={activeBranch?.name || "Branch"}
            disabled={loading || inventory.length === 0}
          />
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={loading || inventory.length === 0}
            className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => loadInventory(page)}
            disabled={loading}
            className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="ml-2">Actualizar</span>
          </Button>
        </div>
      </div>

      <div className="flex  flex-wrap sm:items-center gap-3 px-3 ">
        {/* Search */}
        <div className="relative flex-1  min-w-[200px] max-w-sm group mx-auto sm:mx-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="Buscar SKU o Producto..."
            className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filtro de Envío */}
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="sm:w-[180px] w-[80%] mx-auto sm:mx-0 rounded-xl border-slate-300 dark:border-zinc-800">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Categorías: Todas</SelectItem>
            {(Array.isArray(categories) ? categories : []).map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Proveedor */}
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger className="sm:w-[180px] w-[80%] mx-auto sm:mx-0 rounded-xl border-slate-300 dark:border-zinc-800">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Proveedores: Todos</SelectItem>
            {(Array.isArray(suppliers) ? suppliers : []).map((sup) => (
              <SelectItem key={sup.id} value={String(sup.id)}>
                {sup.tradeName || sup.businessName || sup.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Marca */}
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="sm:w-[180px] w-[80%] mx-auto sm:mx-0 rounded-xl border-slate-300 dark:border-zinc-800">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Marcas: Todas</SelectItem>
            {Array.from(
              new Set(
                (Array.isArray(inventory) ? inventory : [])
                  .filter((i) => (i as any).brand)
                  .map((i) => (i as any).brand),
              ),
            )
              .sort()
              .map((b) => (
                <SelectItem key={b as string} value={b as string}>
                  {b as string}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Filtro de Stock */}
        <Select value={stockLevel} onValueChange={setStockLevel}>
          <SelectTrigger className="sm:w-[180px] w-[80%] mx-auto sm:mx-0 rounded-xl border-slate-300 dark:border-zinc-800">
            <SelectValue placeholder="Nivel de Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Niveles: Todos</SelectItem>
            <SelectItem value="LOW">
              Stock Bajo (&lt; {config?.lowStockThreshold ?? 10})
            </SelectItem>
            <SelectItem value="CRITICAL">
              Stock Crítico (&lt; {config?.criticalStockThreshold ?? 5})
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Botón para limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold hover:cursor-pointer"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}

        {/* Cantidad de resultados */}
        <span className="hidden sm:block ml-auto text-sm text-muted-foreground">
          {inventory.length} resultado(s)
        </span>
      </div>

      <div>
        <StockTable
          data={inventory}
          onRefresh={() => loadInventory(page)}
          lowThreshold={config?.lowStockThreshold}
          criticalThreshold={config?.criticalStockThreshold}
          loading={loading}
          pagination={{
            page,
            totalPages,
            onPageChange: (newPage) => {
              setPage(newPage);
            },
          }}
        />
      </div>
    </div>
  );
}
