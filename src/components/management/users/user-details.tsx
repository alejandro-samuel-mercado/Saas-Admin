"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCSV } from "@/lib/export-utils";
import { formatCurrency } from "@/lib/utils";
import { SalesAPI, UsersAPI } from "@/services/api";
import { useAuthStore } from "@/store/use-auth-store";
import { Sale, User } from "@/types/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRightLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Download,
  Edit2,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SaleDetailsDialog } from "../sales/sale-details-dialog";
import { UserForm } from "./user-form";

interface UserDetailsProps {
  user: User;
  onClose: () => void;
}

export function UserDetails({ user: initialUser, onClose }: UserDetailsProps) {
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user: currentUserSession } = useAuthStore();

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const response = await SalesAPI.getAll({ userId: currentUser.id });
      let fetchedSales: Sale[] = [];
      if (response.data && Array.isArray(response.data)) {
        fetchedSales = response.data;
      } else if (Array.isArray(response)) {
        fetchedSales = response;
      }
      const userSales = fetchedSales.filter((s) => s.userId === currentUser.id);
      setSales(userSales);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const { CommentsAPI } = await import("@/services/api");
      const allComments = await CommentsAPI.getAll();
      const userComments = allComments.filter(
        (c: any) => c.userId === currentUser.id,
      );
      setComments(userComments);
    } catch (error) {
    } finally {
      setLoadingComments(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (currentUser?.id) {
      loadSales();
      loadComments();
    }
  }, [currentUser?.id, loadSales, loadComments]);

  useEffect(() => {
    if (initialUser) setCurrentUser(initialUser);
  }, [initialUser]);

  const handleUpdateSuccess = async (updatedData: Partial<User>) => {
    setCurrentUser({ ...currentUser, ...updatedData } as User);
    setIsEditing(false);
  };

  const stats = useMemo(() => {
    if (!sales.length) return null;
    const totalSpent = sales.reduce(
      (acc, s) => acc + (Number(s.total) || 0),
      0,
    );
    const avgTicket = totalSpent / sales.length;
    const lastPurchase = sales.reduce((latest, s) => {
      const d = new Date(s.createdAt || 0);
      return d > latest ? d : latest;
    }, new Date(0));

    const productCount: Record<string, number> = {};
    sales.forEach((s) => {
      s.items?.forEach((item) => {
        productCount[item.productName] =
          (productCount[item.productName] || 0) + item.quantity;
      });
    });
    const topProduct = Object.entries(productCount).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return { totalSpent, avgTicket, lastPurchase, topProduct };
  }, [sales]);

  const filteredPurchases = useMemo(() => {
    if (!searchQuery.trim()) return sales;
    const q = searchQuery.toLowerCase();
    return sales.filter(
      (s) =>
        String(s.id).includes(q) ||
        s.paymentType?.toLowerCase().includes(q) ||
        s.paymentStatus?.toLowerCase().includes(q) ||
        s.items?.some((item) => item.productName?.toLowerCase().includes(q)),
    );
  }, [sales, searchQuery]);

  const payments = sales.filter((s) => s.paymentStatus === "PAID");
  const transfers = sales.filter(
    (s) => s.paymentType === "CASH" || s.paymentType === "TRANSFER",
  );

  const handleExportCSV = () => {
    const rows = sales.flatMap((sale) =>
      (sale.items || []).map((item) => ({
        Venta_ID: sale.id,
        Fecha: format(
          new Date(sale.createdAt || new Date()),
          "dd/MM/yyyy HH:mm",
        ),
        Producto: item.productName,
        SKU: item.skuCode,
        Cantidad: item.quantity,
        Precio_Unitario: item.unitPrice,
        Subtotal: item.subtotal,
        Total_Venta: sale.total,
        Metodo_Pago: sale.paymentType,
        Estado: sale.paymentStatus,
      })),
    );
    exportToCSV(rows, `historial_${currentUser.name?.replace(/\s+/g, "_")}`);
  };

  if (!currentUser) return null;

  if (isEditing) {
    return (
      <UserForm
        open={true}
        onOpenChange={(open) => !open && setIsEditing(false)}
        user={currentUser}
        currentUserRole={
          (useAuthStore.getState().user?.role?.name as any) || "EMPLOYEE"
        }
        onSave={async (data) => {
          try {
            await UsersAPI.update(currentUser.id, data);
            handleUpdateSuccess(data);
          } catch (error: any) {
            const message =
              error.response?.data?.message || "Error al actualizar usuario";
            throw error;
          }
        }}
      />
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-900/60 via-secondary/20 to-primary/70 flex flex-col overflow-y-auto">
      <div className="relative w-full bg-primary/30 border-b border-border p-8 shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative shrink-0">
            <div className="h-24 w-24 md:h-28 md:w-28 bg-gradient-to-tr from-indigo-900/50 to-purple-900/50 rounded-[2rem] flex items-center justify-center text-4xl font-black text-indigo-300 shadow-xl border border-white/10 transform -rotate-3 transition-transform hover:rotate-0">
              <div className="transform rotate-3 text-white/90">
                {currentUser.name?.charAt(0) || "U"}
              </div>
            </div>
            <div
              className={`absolute -bottom-2 -right-2 h-6 w-6 rounded-full border-4 border-card shadow-lg ${currentUser.status === "ACTIVE" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-destructive shadow-destructive/50"}`}
            ></div>
          </div>

          <div className="flex-1 text-center md:text-left flex flex-col justify-center">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
              <h2 className="text-3xl font-bold text-gray-200 tracking-tight">
                {currentUser.name}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge
                  variant="outline"
                  className="bg-background/50 backdrop-blur-sm text-muted-foreground"
                >
                  ID: {currentUser.id}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-indigo-500/30 bg-indigo-500/10 text-gray-200 uppercase"
                >
                  {currentUser.role?.name || "ROL DESCONOCIDO"}
                </Badge>
                {currentUser.isGuest && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  >
                    Invitado
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-gray-200 font-medium text-lg">
              {currentUser.email}
            </p>
          </div>

          {(() => {
            const sessionRole = currentUserSession?.role?.name || "";
            const targetRole = currentUser.role?.name || "";

            const canEdit =
              (sessionRole === "SUPER_ADMIN" &&
                (targetRole !== "SUPER_ADMIN" ||
                  currentUser.id === currentUserSession?.id)) ||
              (sessionRole === "ADMIN" &&
                targetRole !== "ADMIN" &&
                targetRole !== "SUPER_ADMIN") ||
              (sessionRole === "EMPLOYEE" && targetRole === "CUSTOMER");

            return canEdit ? (
              <Button
                className="sm:mr-20   shrink-0 bg-secondary/70 border border-white/10 text-white  hover:bg-secondary backdrop-blur-md rounded-xl hover:cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={16} className="mr-2" />
                Editar Perfil
              </Button>
            ) : null;
          })()}
        </div>
      </div>

      {/* Main Content*/}
      <div className="flex-1 sm:p-6 pt-6 px-0 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6 px-4">
          <div className="grid sm:grid-cols-2 grid-cols-1 gap-4 px-2">
            <div className="bg-card border border-border rounded-3xl p-5 flex flex-col items-center justify-center hover:border-border/80 transition-all shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Star size={12} className="text-amber-500" /> Puntos
              </p>
              <p className="text-3xl font-black text-foreground drop-shadow-sm">
                {currentUser.points || 0}
              </p>
            </div>
            <div className="bg-primary/80 border border-emerald-500/20 rounded-3xl p-5 flex flex-col items-center justify-center hover:bg-emerald-500/10 transition-all shadow-sm overflow-hidden text-center relative">
              <p className="text-[10px] font-bold text-gray-300 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <DollarSign size={12} className="text-gray-300" /> Gastado
              </p>
              <p className="text-2xl font-black text-gray-300 dark:text-emerald-400 drop-shadow-sm break-all leading-none">
                {formatCurrency(
                  sales.reduce(
                    (acc, curr) => acc + (Number(curr.total) || 0),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>

          {stats && (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm w-full ">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>{" "}
                Actividad Comercial
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-2xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="bg-background p-1.5 rounded-lg shadow-sm">
                      <ShoppingBag size={14} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Compras
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground pl-1">
                    {sales.length}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-2xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="bg-background p-1.5 rounded-lg shadow-sm">
                      <TrendingUp size={14} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Promedio
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground pl-1">
                    {formatCurrency(stats.avgTicket)}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-2xl p-4 flex flex-col gap-1.5 col-span-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="bg-background p-1.5 rounded-lg shadow-sm">
                      <Calendar size={14} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Última Adquisición
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground pl-1">
                    {stats.lastPurchase.getTime() > 0
                      ? format(stats.lastPurchase, "d 'de' MMMM, yyyy", {
                          locale: es,
                        })
                      : "Sin registro"}
                  </p>
                </div>
                {stats.topProduct && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-2 col-span-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                      <div className="bg-background p-1.5 rounded-lg shadow-sm">
                        <Star size={14} className="fill-amber-500/50" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Producto Favorito
                      </span>
                    </div>
                    <div className="pl-1">
                      <p className="text-sm font-bold text-foreground line-clamp-1">
                        {stats.topProduct[0]}
                      </p>
                      <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 font-medium mt-0.5">
                        {stats.topProduct[1]} unidades adquiridas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información Personal & Ubicación */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>{" "}
                Detalles Personales
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0 text-muted-foreground shadow-sm">
                    <CreditCard size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                      DNI / Documento
                    </p>
                    <p className="text-sm font-bold text-foreground truncate">
                      {currentUser.dni || "No registrado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0 text-muted-foreground shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                      Teléfono
                    </p>
                    <p className="text-sm font-bold text-foreground truncate">
                      {currentUser.phone || "No registrado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0 text-muted-foreground shadow-sm">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                      Fecha de Registro
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {currentUser.createdAt
                        ? format(
                            new Date(currentUser.createdAt),
                            "d MMMM, yyyy",
                            { locale: es },
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>{" "}
                Ubicación Geográfica
              </h3>
              <div className="bg-muted/40 rounded-2xl p-4">
                <div className="flex gap-3 mb-4">
                  <div className="bg-background shadow-sm p-2 rounded-xl text-muted-foreground flex-shrink-0 h-9 w-9 flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug mt-1.5">
                    {currentUser.address ||
                      "Sin dirección principal registrada"}
                  </p>
                </div>
                {(currentUser.city ||
                  currentUser.state ||
                  currentUser.country ||
                  currentUser.zipCode) && (
                  <div className="pl-12 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                        Ciudad
                      </p>
                      <p className="text-xs font-bold text-foreground">
                        {currentUser.city || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                        Provincia
                      </p>
                      <p className="text-xs font-bold text-foreground">
                        {currentUser.state || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                        País
                      </p>
                      <p className="text-xs font-bold text-foreground">
                        {currentUser.country || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                        C. Postal
                      </p>
                      <p className="text-xs font-bold text-foreground">
                        {currentUser.zipCode || "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/*  Actividad del Usuario */}
        <div className="xl:col-span-2 flex flex-col h-full bg-card border border-border rounded-3xl overflow-hidden shadow-sm sm:mx-auto mx-2 sm:px-6 px-2 ">
          <div className="p-8 pb-0 shrink-0">
            <div className="flex items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold text-foreground">
                Actividad del Usuario
              </h3>
              <div className="text-sm text-muted-foreground">
                Última actualización:{" "}
                {currentUser.updatedAt
                  ? format(new Date(currentUser.updatedAt), "d MMM, HH:mm", {
                      locale: es,
                    })
                  : "-"}
              </div>
            </div>
          </div>

          <Tabs
            defaultValue="purchases"
            className="flex-1 flex flex-col sm:px-8 px-2 pb-8 overflow-hidden"
          >
            <TabsList className="bg-muted p-1 rounded-xl border border-border self-start mb-6 w-full sm:w-auto shadow-sm">
              <TabsTrigger
                value="purchases"
                className="px-6 data-[state=active]:bg-primary/50 data-[state=active]:text-foreground text-muted-foreground"
              >
                Compras{" "}
                {sales.length > 0 && (
                  <span className="ml-1.5 bg-secondary/10 text-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {sales.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="px-6 data-[state=active]:bg-primary/50 data-[state=active]:text-foreground text-muted-foreground"
              >
                Pagos
              </TabsTrigger>

              <TabsTrigger
                value="comments"
                className="px-6 data-[state=active]:bg-primary/50 data-[state=active]:text-foreground text-muted-foreground"
              >
                Comentarios
              </TabsTrigger>
            </TabsList>

            {/* Compras */}
            <TabsContent
              value="purchases"
              className="flex-1 flex flex-col overflow-hidden m-0 min-h-0"
            >
              {/* Buscador */}
              {sales.length > 0 && (
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por producto, método de pago..."
                      className="pl-9 h-9 rounded-xl bg-gray-200 border-3 border-gray-400/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="rounded-xl border-slate-300 dark:border-zinc-800 shrink-0 hover:cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    CSV
                  </Button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-0">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <div className="animate-spin h-8 w-8 border-4 border-muted border-t-foreground rounded-full"></div>
                    <p>Obteniendo historial...</p>
                  </div>
                ) : filteredPurchases.length > 0 ? (
                  filteredPurchases.map((sale) => {
                    const isExpanded = expandedSaleId === sale.id;
                    return (
                      <div
                        key={sale.id}
                        className="bg-card rounded-xl border border-border hover:border-secondary/40 transition-all overflow-hidden"
                      >
                        <div
                          className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between cursor-pointer group"
                          onClick={() =>
                            setExpandedSaleId(
                              isExpanded ? null : (sale.id ?? null),
                            )
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors shrink-0">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-sm">
                                Orden #{sale.id}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(sale.createdAt || new Date()),
                                    "dd/MM/yyyy · HH:mm",
                                    { locale: es },
                                  )}{" "}
                                  hs
                                </span>
                                {sale.items?.length > 0 && (
                                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                                    {sale.items.length}{" "}
                                    {sale.items.length === 1
                                      ? "artículo"
                                      : "artículos"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={
                                  sale.paymentStatus === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                    : sale.paymentStatus === "CANCELLED"
                                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                                }
                              >
                                {sale.paymentStatus}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                              >
                                {sale.paymentType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-bold text-foreground">
                                {formatCurrency(sale.total)}
                              </p>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detalle de productos */}
                        {isExpanded && (
                          <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2 animate-in slide-in-from-top-1 duration-150">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Detalle de productos
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-secondary hover:text-secondary hover:cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSale(sale);
                                }}
                              >
                                Ver comprobante →
                              </Button>
                            </div>
                            {sale.items?.length > 0 ? (
                              sale.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-background rounded-lg flex items-center justify-center border border-border shrink-0">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-foreground">
                                        {item.productName}
                                      </p>
                                      <p className="text-xs text-muted-foreground font-mono">
                                        SKU: {item.skuCode}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-foreground">
                                      {formatCurrency(item.subtotal)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.quantity} ×{" "}
                                      {formatCurrency(item.unitPrice)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                Sin detalle de productos disponible
                              </p>
                            )}

                            {/* Total de la venta */}
                            <div className="pt-2 space-y-1">
                              {sale.discount > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Descuento
                                  </span>
                                  <span className="text-emerald-600 font-medium">
                                    -{formatCurrency(sale.discount)}
                                  </span>
                                </div>
                              )}
                              {sale.shippingCost > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Envío
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(sale.shippingCost)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-bold border-t border-border pt-1 mt-1">
                                <span>Total</span>
                                <span>{formatCurrency(sale.total)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="font-medium">
                      {searchQuery
                        ? "No se encontraron compras con ese criterio"
                        : "No hay compras registradas para este usuario"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Pagos */}
            <TabsContent
              value="payments"
              className="flex-1 overflow-y-auto pr-2 m-0 min-h-0 space-y-4"
            >
              {payments.length > 0 ? (
                payments.map((sale) => (
                  <div
                    key={"payment-" + sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="bg-card rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Pago Recibido
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Venta #{sale.id} •{" "}
                          {format(
                            new Date(sale.createdAt || new Date()),
                            "d MMM",
                            { locale: es },
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      + {formatCurrency(sale.total)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="font-medium">
                    No hay pagos registrados para este usuario
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Transferencias */}
            <TabsContent
              value="transfers"
              className="flex-1 overflow-y-auto pr-2 m-0 min-h-0 space-y-4"
            >
              {transfers.length > 0 ? (
                transfers.map((sale) => (
                  <div
                    key={"transfer-" + sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="bg-card rounded-xl border border-blue-200 dark:border-blue-800 p-4 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <ArrowRightLeft size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Transferencia / {sale.paymentType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Venta #{sale.id} •{" "}
                          {format(
                            new Date(sale.createdAt || new Date()),
                            "d MMM",
                            { locale: es },
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-foreground">
                      {formatCurrency(sale.total)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
                  <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="font-medium">
                    No hay transferencias registradas para este usuario
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Comentarios */}
            <TabsContent
              value="comments"
              className="flex-1 overflow-y-auto pr-2 m-0 min-h-0 space-y-4"
            >
              {loadingComments ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-muted animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-card rounded-xl border border-border p-4 hover:border-secondary/30 transition-all flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < (comment.rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(comment.createdAt),
                            "d 'de' MMM, yyyy",
                            { locale: es },
                          )}
                        </span>
                      </div>
                      <Badge
                        variant={comment.approved ? "outline" : "secondary"}
                        className={
                          comment.approved
                            ? "text-emerald-600 border-emerald-200"
                            : "text-amber-600 border-amber-200"
                        }
                      >
                        {comment.approved ? "Aprobado" : "Pendiente"}
                      </Badge>
                    </div>
                    <p className="text-sm italic text-foreground">
                      "{comment.content}"
                    </p>
                    {comment.product && (
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        En: {comment.product.name}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="font-medium">
                    No hay comentarios registrados para este usuario
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Detalle de venta */}
      {selectedSale && (
        <SaleDetailsDialog
          sale={selectedSale}
          open={!!selectedSale}
          onOpenChange={(open) => !open && setSelectedSale(null)}
          onSaleUpdated={loadSales}
        />
      )}
    </div>
  );
}
