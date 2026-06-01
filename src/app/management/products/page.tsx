"use client";

import { ProductForm } from "@/components/management/products/product-form";
import { ProductTable } from "@/components/management/products/product-table";
import { BulkImportDialog } from "@/components/management/products/bulk-import-dialog";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { exportToCSV } from "@/lib/export-utils";
import { ProductsAPI } from "@/services/api";
import { useBranchStore } from "@/store/branch.store";
import { useAuthStore } from "@/store/use-auth-store";
import { Product, UserRole } from "@/types/schema";
import {
    Barcode,
    ChevronDown,
    Download,
    Loader2,
    Package,
    Plus,
    QrCode,
    RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(
    undefined,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const { activeBranch } = useBranchStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const currentUserRole = (user?.role?.name || "EMPLOYEE") as UserRole;

  const loadProducts = useCallback(
    async (pageNum = page) => {
      setLoading(true);
      try {
        const response = await ProductsAPI.getAll({
          branchId: activeBranch?.id,
          page: pageNum,
          limit,
          search,
          adminView: "true",
        });
        const paginatedData = response.data;
        setProducts(paginatedData?.data || []);
        setTotalPages(paginatedData?.totalPages || 1);
        setPage(paginatedData?.page || 1);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [activeBranch, limit, toast, search],
  );

  useEffect(() => {
    setPage(1);
    loadProducts(1);
  }, [activeBranch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`¿Eliminar ${product.name}?`)) {
      try {
        await ProductsAPI.delete(product.id, activeBranch?.id);
        toast({
          title: "Producto eliminado",
          description: `El producto ${product.name} ha sido eliminado.`,
        });
        loadProducts(page);
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Error al eliminar producto";
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    }
  };

  const handleExport = () => {
    const dataToExport: any[] = [];

    products.forEach((p) => {
      // Si el producto no tiene SKUs (no debería pasar), crear una fila básica
      if (!p.skus || p.skus.length === 0) {
        dataToExport.push({
          ID: p.id,
          Nombre: p.name,
          Marca: p.brand || "-",
          Categoria: p.category?.name || "General",
          Descripcion: p.description || "",
          Tipo: p.type,
          Precio_Base: p.basePrice,
          Unidad_Medida: p.measurementUnit || "UNIDAD",
          Codigo_SKU: "-",
          Precio_SKU: p.basePrice,
          Stock_Inicial: 0,
          Codigo_Barras: "-",
          Puntos_Recompensa: p.pointsReward,
          Estado: p.isActive ? "ACTIVE" : "INACTIVO",
        });
      } else {
        // Una fila por cada SKU para que sea compatible con el importador masivo
        p.skus.forEach((sku) => {
          dataToExport.push({
            ID: p.id,
            Nombre: p.name,
            Marca: p.brand || "-",
            Categoria: p.category?.name || "General",
            Descripcion: p.description || "",
            Tipo: p.type,
            Precio_Base: p.basePrice,
            Unidad_Medida: p.measurementUnit || "UNIDAD",
            Codigo_SKU: sku.code,
            Precio_SKU: sku.price,
            Stock_Inicial: sku.stock || 0,
            Codigo_Barras: sku.barcode || "-",
            Puntos_Recompensa: p.pointsReward,
            Estado: p.isActive ? "ACTIVE" : "INACTIVO",
          });
        });
      }
    });

    exportToCSV(dataToExport, "catalogo_productos_completo");

    toast({
      title: "Exportación completa",
      description: `Se han exportado ${dataToExport.length} variantes de ${products.length} productos.`,
    });
  };

  const handleExportCodes = async (type: "QR" | "BARCODE") => {
    if (!selectedIds.length) {
      toast({
        title: "Atención",
        description: "Debes seleccionar al menos un producto para exportar.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: `Generando PDF (${type})`,
      description: "Esto puede demorar unos segundos. Por favor, espera.",
    });

    try {
      const response = await ProductsAPI.exportCodes({
        type,
        selectAll: false,
        selectedIds,
        filters: {},
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      let fileName = `etiquetas_${type.toLowerCase()}.pdf`;
      const cd = response.headers?.["content-disposition"];
      if (cd) {
        const match = cd.match(/filename=(.+)/);
        if (match && match.length === 2)
          fileName = match[1].replace(/["']/g, "");
      }
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "¡Éxito!",
        description: "El PDF se generó y descargó correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al generar las etiquetas.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async (data: Partial<Product>, manualPrices?: any[]) => {
    try {
      let savedProduct;
      if (editingProduct) {
        savedProduct = await ProductsAPI.update(
          editingProduct.id,
          data,
          activeBranch?.id,
        );
        toast({
          title: "Producto actualizado",
          description: "Los cambios se guardaron correctamente.",
        });
      } else {
        savedProduct = await ProductsAPI.create(data, activeBranch?.id);
        toast({
          title: "Producto creado",
          description: "El nuevo producto se ha creado.",
        });
      }

      if (manualPrices) {
        await ProductsAPI.updatePrices(savedProduct.id, manualPrices);
      }

      setIsFormOpen(false);
      loadProducts(page);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Error al guardar producto";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className=" p-0 sm:p-8 pt-2 space-y-6 mb-20">
      <Breadcrumb className="px-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Productos</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row  items-center justify-between px-4">
        <div className="sm:mb-0 mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Catálogo de Productos
          </h1>
          <p className="text-muted-foreground">
            Gestiona el inventario, precios y variantes.
          </p>
        </div>
        <div className="flex items-center sm:gap-2 gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={loading || products.length === 0 || isExporting}
                className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Exportar Lote</span>
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExport}>
                Tabla a Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExportCodes("QR")}
                disabled={selectedIds.length === 0}
              >
                <QrCode className="mr-2 h-4 w-4" /> Códigos QR (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExportCodes("BARCODE")}
                disabled={selectedIds.length === 0}
              >
                <Barcode className="mr-2 h-4 w-4" /> Cód. Barras (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={() => loadProducts()}
            disabled={loading}
            className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <BulkImportDialog onSuccess={() => loadProducts(1)} />

          {currentUserRole !== "EMPLOYEE" && (
            <Button
              onClick={() => {
                setEditingProduct(undefined);
                setIsFormOpen(true);
              }}
              className="bg-secondary hover:bg-secondary/80 shadow-sm text-white hover:cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      <ProductTable
        data={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelectionChange={setSelectedIds}
        currentUserRole={currentUserRole}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        pagination={{
          page,
          totalPages,
          onPageChange: (newPage: number) => {
            setPage(newPage);
            loadProducts(newPage);
          },
        }}
      />

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={editingProduct}
        onSave={handleSave}
      />
    </div>
  );
}
