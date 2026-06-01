"use client";

import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { GenericTable } from "@/components/ui/generic-table";
import { ColumnDef } from "@tanstack/react-table";
import { RefreshCw, Save, Ticket, Trash } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CouponsAPI } from "@/services/api";
import { useAuthStore } from "@/store/use-auth-store";
import { useCallback, useEffect, useState } from "react";
import { useConfigStore } from "@/store/config.store";

export default function CouponsPage() {
  const { config } = useConfigStore();
  const { user } = useAuthStore();
  const userRole = user?.role?.name || "";

  const [coupons, setCoupons] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(undefined);
  const [formData, setFormData] = useState<any>({
    code: "",
    type: "PERCENTAGE",
    value: 0,
    maxUses: 100,
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  useEffect(() => {
    if (editingCoupon) {
      setFormData({
        ...editingCoupon,
        minPurchase: editingCoupon.minPurchase || 0,
        maxDiscount: editingCoupon.maxDiscount || 0,
      });
    } else {
      setFormData({
        code: "",
        type: "PERCENTAGE",
        value: 0,
        maxUses: 100,
        active: true,
        minPurchase: 0,
        maxDiscount: 0,
      });
    }
  }, [editingCoupon]);

  const loadCoupons = useCallback(
    async (pageNum = page) => {
      setLoading(true);
      try {
        const response = await CouponsAPI.getAll({
          page: pageNum,
          limit,
          search,
        });
        const paginatedData = response.data;
        setCoupons(paginatedData?.data || []);
        setTotalPages(paginatedData?.totalPages || 1);
        setPage(paginatedData?.page || 1);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los cupones.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast, page, limit, search],
  );
  useEffect(() => {
    loadCoupons(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCoupons(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSave = async () => {
    if (formData.validFrom && formData.validUntil) {
      const start = new Date(formData.validFrom).getTime();
      const end = new Date(formData.validUntil).getTime();
      if (end < start) {
        toast({
          title: "Error de Fechas",
          description:
            "La fecha de expiración no puede ser anterior a la fecha de inicio.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (editingCoupon) {
        await CouponsAPI.update(editingCoupon.id, formData);
        toast({
          title: "Cupón actualizado",
          description: "Cambios guardados.",
        });
      } else {
        await CouponsAPI.create(formData);
        toast({
          title: "Cupón creado",
          description: "El cupón se ha creado correctamente.",
        });
      }
      setIsDialogOpen(false);
      loadCoupons(page);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "No se pudo guardar el cupón.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!editingCoupon) return;
    if (confirm("¿Eliminar cupón?")) {
      try {
        await CouponsAPI.delete(editingCoupon.id);
        toast({
          title: "Cupón eliminado",
          description: "El cupón ha sido eliminado.",
        });
        setIsDialogOpen(false);
        loadCoupons(page);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el cupón.",
          variant: "destructive",
        });
      }
    }
  };

  const openEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingCoupon(undefined);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    { accessorKey: "code", header: "Código" },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <p>Porcentaje</p>,
    },
    { accessorKey: "value", header: "Valor" },
    {
      accessorKey: "validUntil",
      header: "Expira",
      cell: ({ row }) =>
        row.original.validUntil
          ? new Date(row.original.validUntil).toLocaleDateString()
          : "Nunca",
    },
    {
      accessorKey: "active",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="sm:p-8  pt-2 space-y-6 pb-40 sm:pb-20 max-w-5xl mx-auto">
      <Breadcrumb className="px-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Cupones</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between px-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            Cupones de Descuento
          </h1>
          <p className="text-muted-foreground">
            Gestiona códigos promocionales.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadCoupons()}
          disabled={loading}
          title="Recargar"
          className="hover:cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="ml-2 hidden sm:inline">Actualizar</span>
        </Button>
      </div>

      <GenericTable
        data={coupons}
        columns={columns}
        searchKey="code"
        onEdit={userRole === "EMPLOYEE" ? undefined : openEdit}
        onDelete={userRole === "EMPLOYEE" ? undefined : handleDelete}
        onCreate={userRole === "EMPLOYEE" ? undefined : openCreate}
        createText="Nuevo Cupón"
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        pagination={{
          page,
          totalPages,
          onPageChange: (newPage: number) => {
            setPage(newPage);
            loadCoupons(newPage);
          },
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background border-4 border-secondary/60 text-foreground sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Código</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="bg-background border-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={formData.type} disabled>
                  <SelectTrigger className="bg-muted border-input cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-input">
                    <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Valor (%)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={formData.value || ""}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 0;
                    if (val > 100) val = 100;
                    if (val < 0) val = 0;
                    setFormData({ ...formData, value: val });
                  }}
                  className="bg-background border-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Límite Usos Total</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={formData.maxUses || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUses: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Sin límite"
                  className="bg-background border-input"
                />
              </div>
              <div className="grid gap-2">
                <Label>Límite por Cliente</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={formData.maxUsesPerUser || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUsesPerUser: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  placeholder="Sin límite"
                  className="bg-background border-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Válido Desde</Label>
                <Input
                  type="date"
                  value={
                    formData.validFrom ? formData.validFrom.split("T")[0] : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validFrom: e.target.value
                        ? new Date(e.target.value + "T12:00:00").toISOString()
                        : null,
                    })
                  }
                  className="bg-background border-input block"
                />
              </div>
              <div className="grid gap-2">
                <Label>Expira (Opcional)</Label>
                <Input
                  type="date"
                  value={
                    formData.validUntil ? formData.validUntil.split("T")[0] : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validUntil: e.target.value
                        ? new Date(e.target.value + "T12:00:00").toISOString()
                        : null,
                    })
                  }
                  className="bg-background border-input block"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Compra Mínima ({config?.currencySymbol || "\$"}) (Opcional)</Label>
                <Input
                  type="number" step="any"
                  value={formData.minPurchase || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPurchase: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="bg-background border-input"
                  placeholder="Sin mínimo"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tope Reintegro ({config?.currencySymbol || "\$"}) (Opcional)</Label>
                <Input
                  type="number" step="any"
                  value={formData.maxDiscount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscount: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="bg-background border-input"
                  placeholder="Sin límite"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between gap-3 sm:gap-0">
            {editingCoupon ? (
              <Button
                variant="destructive"
                onClick={handleDelete}
                type="button"
                className="hover:cursor-pointer"
              >
                <Trash className="mr-2 h-4 w-4" /> Eliminar
              </Button>
            ) : (
              <div></div>
            )}
            <Button
              onClick={handleSave}
              className="bg-secondary hover:bg-secondary/90 shadow-sm text-secondary-foreground hover:cursor-pointer"
            >
              <Save className="mr-2 h-4 w-4" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
