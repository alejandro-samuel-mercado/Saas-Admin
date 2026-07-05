"use client";

import { cn, formatCurrency } from "@/lib/utils";
import {
    CategoriesAPI,
    ConfigAPI,
    CouponsAPI,
    ProductsAPI,
    PromosAPI,
    SalesAPI,
    ShippingAPI,
    UsersAPI,
} from "@/services/api";
import { useBranchStore } from "@/store/branch.store";
import { useCartStore } from "@/store/cart-store";
import { useDataStore } from "@/store/sync-store";
import { Product, SKU } from "@/types/schema";
import Fuse from "fuse.js";
import { Printer, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import {
    AlertCircle,
    Award,
    CreditCard,
    FileText,
    Loader2,
    Minus,
    Plus,
    Search,
    Tag,
    Trash2,
    Truck,
    User as UserIcon,
    UserPlus,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { TicketTemplate } from "./ticket-template";
import { POSCalculator } from "./pos-calculator";

const SafeNumericInput = ({
    value,
    onChange,
    placeholder,
    className,
    inputMode = "decimal",
}: {
    value: number;
    onChange: (val: number) => void;
    placeholder?: string;
    className?: string;
    inputMode?: "decimal" | "numeric";
}) => {
    const [localValue, setLocalValue] = useState(
        value === 0 ? "" : String(value),
    );

    useEffect(() => {
        const stringValue = value === 0 ? "" : String(value);
        if (parseFloat(localValue) !== value) {
            setLocalValue(stringValue);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(",", ".");
        if (raw === "" || raw === "." || /^\d*\.?\d*$/.test(raw)) {
            setLocalValue(raw);
            const parsed = parseFloat(raw);
            onChange(isNaN(parsed) ? 0 : parsed);
        }
    };

    return (
        <Input
            type="text"
            inputMode={inputMode}
            value={localValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
        />
    );
};

const POSProductCard = ({
    product,
    onAdd,
    storeConfig,
}: {
    product: Product;
    onAdd: (p: Product) => void;
    storeConfig: any;
}) => {
    const minPrice =
        product.skus?.reduce(
            (min, s) => Math.min(min, Number(s.price)),
            Infinity,
        ) || 0;
    const stock = product.skus?.[0]?.stock || 0;

    return (
        <div
            className="group bg-card border-2 border-border rounded-xl p-3 transition-all hover:shadow-xl hover:border-primary/40 cursor-pointer flex flex-col gap-3"
            onClick={() => onAdd(product)}
        >
            <div className="relative aspect-square rounded-lg bg-white border border-border overflow-hidden p-1">
                {product.images?.[0] ? (
                    <img
                        src={product.images[0]}
                        alt=""
                        className="w-full h-full object-contain transition-transform group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground/30">
                        <Tag className="w-8 h-8 opacity-20" />
                    </div>
                )}
                <div className="absolute top-1 left-1 flex flex-col gap-1">
                    {stock <= 0 && (
                        <Badge
                            variant="destructive"
                            className="text-[9px] font-black uppercase px-2 h-5"
                        >
                            Agotado
                        </Badge>
                    )}
                    {product.skus && product.skus.length > 1 && (
                        <Badge
                            variant="outline"
                            className="text-[9px] font-black bg-white/80 uppercase px-2 h-5 border-primary/20"
                        >
                            {product.skus.length} Variantes
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <h4 className="font-black text-[11px] text-foreground uppercase line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                </h4>
                <div className="mt-auto flex max-sm:flex-col items-center justify-between gap-1">
                    <span
                        className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                            stock > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700",
                        )}
                    >
                        {Number(stock).toFixed(product.allowFractional ? 2 : 0)}{" "}
                        {product.measurementUnit === "UNIT"
                            ? "UN"
                            : product.measurementUnit?.toLowerCase() || "UN"}{" "}
                        DISP.
                    </span>
                    <p className="font-black text-sm text-secondary">
                        {formatCurrency(
                            minPrice,
                            storeConfig?.baseCurrency || "USD",
                            storeConfig?.currencySymbol,
                        )}
                    </p>
                </div>
            </div>
            <Button
                size="sm"
                variant="secondary"
                className="w-full h-8 text-[9px] font-black uppercase mt-1 group-hover:bg-primary group-hover:text-white transition-colors"
            >
                AÑADIR
            </Button>
        </div>
    );
};

export function RegistrationTab() {
    const isFractional = (p: Product) => p.allowFractional ?? false;

    const { products, categories, users } = useDataStore();
    const { activeBranch } = useBranchStore();

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
        null,
    );

    const {
        items,
        addItem,
        removeItem,
        updateQuantity,
        client,
        setClient,
        deliveryType,
        setDeliveryType,
        paymentType,
        setPaymentType,
        discount,
        setDiscount,
        shippingCost,
        setShippingCost,
        clearCart,

        storeConfig,
        setStoreConfig,
        activeEvents,
        setActiveEvents,
        activeDiscounts,
        setActiveDiscounts,
        shippingZones,
        setShippingZones,
        selectedZoneId,
        setSelectedZoneId,

        pointsToUse,
        setPointsToUse,
        isProcessing,
        setIsProcessing,
    } = useCartStore();

    const [productQuery, setProductQuery] = useState("");
    const [clientQuery, setClientQuery] = useState("");
    const [isQuickSale, setIsQuickSale] = useState(false);
    const [manualTotal, setManualTotal] = useState("");
    const [manualDiscount, setManualDiscount] = useState<number>(0);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [observations, setObservations] = useState("");

    // Estado del Formulario de Usuario Rápido
    const [quickUserOpen, setQuickUserOpen] = useState(false);
    const [quickUserName, setQuickUserName] = useState("");
    const [quickUserPhone, setQuickUserPhone] = useState("");
    const [quickUserDni, setQuickUserDni] = useState("");
    const [quickUserRnt, setQuickUserRnt] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedProductForVariants, setSelectedProductForVariants] =
        useState<Product | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isDelivered, setIsDelivered] = useState(true);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [completedSale, setCompletedSale] = useState<any>(null);

    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    const [searchResults, setSearchResults] = useState<Product[]>([]);

    const trulyActiveEvents = useMemo(() => {
        return activeEvents.filter((e) => {
            const now = new Date();
            const isActiveFlag = e.active;
            const isWithinDates =
                (!e.startDate || now >= new Date(e.startDate)) &&
                (!e.endDate || now <= new Date(e.endDate));
            return isActiveFlag && isWithinDates;
        });
    }, [activeEvents]);

    const currentEvent = useMemo(
        () => trulyActiveEvents[0] || null,
        [trulyActiveEvents],
    );
    const isShippingDisabledByEvent = useMemo(
        () => currentEvent?.shippingEnabled === false,
        [currentEvent],
    );

    const ticketRef = useRef<HTMLDivElement>(null);

    const grossSubtotal = useMemo(() => {
        return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    }, [items]);

    const itemsDiscountTotal = useMemo(() => {
        const { getItemDiscount } = useCartStore.getState();
        return items.reduce((acc, item) => {
            const { amount } = getItemDiscount(item);
            return acc + amount;
        }, 0);
    }, [items, activeEvents, activeDiscounts]);

    const netItemsSubtotal = useMemo(() => {
        return Math.max(0, grossSubtotal - itemsDiscountTotal);
    }, [grossSubtotal, itemsDiscountTotal]);

    const calculatedShipping = useMemo(() => {
        if (
            deliveryType !== "DELIVERY" ||
            !storeConfig?.enableShipping ||
            isShippingDisabledByEvent
        ) {
            return 0;
        }

        let cost = shippingCost;
        const threshold = Number(storeConfig?.freeShippingThreshold);

        if (threshold > 0 && netItemsSubtotal >= threshold) {
            return 0;
        }

        if (currentEvent?.shippingConfig) {
            if (currentEvent.shippingConfig.type === "FREE") {
                return 0;
            } else if (currentEvent.shippingConfig.type === "DISCOUNT") {
                const disc = Number(currentEvent.shippingConfig.value) || 0;
                cost = Math.max(0, cost * (1 - disc / 100));
            }
        }
        return cost;
    }, [
        deliveryType,
        storeConfig,
        isShippingDisabledByEvent,
        shippingCost,
        netItemsSubtotal,
        currentEvent,
    ]);
    const calculatedTax = useMemo(() => {
        if (!storeConfig) return 0;

        const couponValue = appliedCoupon ? Number(appliedCoupon.value) || 0 : 0;
        const couponDiscount =
            appliedCoupon?.type === "PERCENTAGE"
                ? netItemsSubtotal * (couponValue / 100)
                : Math.min(couponValue, netItemsSubtotal);

        const afterC = Math.max(0, netItemsSubtotal - couponDiscount);
        const manualD =
            manualDiscount > 0
                ? parseFloat((afterC * (manualDiscount / 100)).toFixed(2))
                : 0;
        const pointsD =
            pointsToUse > 0 && storeConfig?.enablePointsRedemption
                ? pointsToUse * (Number(storeConfig.moneyPerPoint) || 0)
                : 0;

        const totalPayableForItems = Math.max(0, afterC - manualD - pointsD);
        const discountRatio =
            grossSubtotal > 0 ? totalPayableForItems / grossSubtotal : 0;

        let totalTax = 0;
        items.forEach((item) => {
            const itemTaxRate =
                item.taxRate !== undefined && item.taxRate !== null
                    ? Number(item.taxRate)
                    : 0;

            const itemGross = item.unitPrice * item.quantity;
            const itemTaxable = itemGross * discountRatio;

            if (itemTaxRate > 0) {
                totalTax += itemTaxable * (itemTaxRate / 100);
            } else if (storeConfig?.taxRate && Number(storeConfig.taxRate) > 0) {
                totalTax += itemTaxable * (Number(storeConfig.taxRate) / 100);
            }
        });

        return totalTax;
    }, [
        netItemsSubtotal,
        appliedCoupon,
        manualDiscount,
        pointsToUse,
        storeConfig,
    ]);

    const handlePrintTicket = useReactToPrint({
        contentRef: ticketRef,
    });

    const loadPOSData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [
                config,
                eventsData,
                discountsData,
                zonesData,
                productsData,
                usersData,
                categoriesData,
            ] = await Promise.all([
                ConfigAPI.get(),
                PromosAPI.getEvents(),
                PromosAPI.getDiscounts(),
                ShippingAPI.getZones(),
                ProductsAPI.getAll(),
                UsersAPI.getAll(),
                CategoriesAPI.getAll(),
            ]);

            setStoreConfig(config);

            if (eventsData?.data) {
                setActiveEvents(eventsData.data.filter((e: any) => e.active));
            }

            if (discountsData?.data) {
                const validDiscounts = discountsData.data.filter((d: any) => d.active);
                useCartStore.getState().setActiveDiscounts(validDiscounts);
            } else if (Array.isArray(discountsData)) {
                useCartStore
                    .getState()
                    .setActiveDiscounts(discountsData.filter((d: any) => d.active));
            }

            if (zonesData?.data && Array.isArray(zonesData.data)) {
                setShippingZones(zonesData.data.filter((z: any) => z.active));
            } else if (Array.isArray(zonesData)) {
                setShippingZones(zonesData.filter((z: any) => z.active));
            }

            if (productsData?.data?.data && Array.isArray(productsData.data.data)) {
                useDataStore.getState().setProducts(productsData.data.data);
            } else if (productsData?.data && Array.isArray(productsData.data)) {
                useDataStore.getState().setProducts(productsData.data);
            } else if (Array.isArray(productsData)) {
                useDataStore.getState().setProducts(productsData as any);
            }

            if (usersData) {
                const users = Array.isArray(usersData)
                    ? usersData
                    : (usersData as any)?.data?.data || (usersData as any)?.data || [];

                if (Array.isArray(users)) {
                    useDataStore.getState().setUsers(users);

                    // Auto-selección de Consumidor Final
                    const currentClient = useCartStore.getState().client;
                    if (!currentClient) {
                        let finalConsumer = users.find((u: any) =>
                            u.name.toLowerCase().includes("consumidor final"),
                        );
                        if (finalConsumer) {
                            setClient(finalConsumer);
                        } else {
                            // Intentar crear si no existe
                            try {
                                const identifier = "99999999";
                                const tempEmail = `consumidor.final@local.pos`;
                                const res = await UsersAPI.create({
                                    name: "CONSUMIDOR FINAL",
                                    email: tempEmail,
                                    password: identifier,
                                    role: "CUSTOMER",
                                    phone: "0000000000",
                                    dni: identifier,
                                });
                                let newUser = res?.data?.data || res?.data || res;
                                if (newUser?.id) {
                                    useDataStore.getState().setUsers([...users, newUser]);
                                    setClient(newUser);
                                }
                            } catch (e: any) {
                                // En caso de condición de carrera (React Strict Mode) o si el usuario
                                // existía pero no estaba en la primera página de resultados.
                                console.warn("Error creando Consumidor Final, intentando recuperarlo:", e);
                                try {
                                    const searchRes = await UsersAPI.getAll({ search: "consumidor.final@local.pos" });
                                    const foundUsers = searchRes?.data?.data || searchRes?.data || [];
                                    if (foundUsers.length > 0) {
                                        setClient(foundUsers[0]);
                                    }
                                } catch (searchErr) {
                                    console.error("No se pudo recuperar al consumidor final:", searchErr);
                                }
                            }
                        }
                    }
                }
            }

            if (categoriesData) {
                const cats = Array.isArray(categoriesData)
                    ? categoriesData
                    : (categoriesData as any).data || [];
                useDataStore.getState().setCategories(cats);
            }
        } catch (err: any) {
            setError(err.message || "Error de conexión con el servidor");
        } finally {
            setIsLoading(false);
        }
    };

    // 1. Obtener Configuración Global y Datos al Montar
    useEffect(() => {
        const state = useDataStore.getState();
        if (!Array.isArray(state.products)) {
            useDataStore.setState({ products: [] });
        }
        if (!Array.isArray(state.users)) {
            useDataStore.setState({ users: [] });
        }

        loadPOSData();
    }, []);

    useEffect(() => {
        if (!productQuery) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingProducts(true);
            try {
                const results = await ProductsAPI.getAll({
                    search: productQuery,
                    limit: 100,
                    adminView: true,
                    branchId: activeBranch?.id,
                });

                const data = results?.data?.data || results?.data || results || [];
                setSearchResults(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearchingProducts(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [productQuery, activeBranch]);

    // --- LÓGICA DEL ESCÁNER DE CÓDIGO DE BARRAS ---
    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            const target = e.target as HTMLElement;

            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

            if (currentTime - lastKeyTime > 100) {
                buffer = "";
            }
            lastKeyTime = currentTime;

            if (e.key === "Enter") {
                if (buffer.length > 0) {
                    handleBarcodeScan(buffer);
                    buffer = "";
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [products, items]);

    const handleBarcodeScan = (code: string) => {
        const allSkus: any[] = [];
        if (Array.isArray(products)) {
            products.forEach((p) => {
                if (p.skus) {
                    p.skus.forEach((s) => allSkus.push({ ...s, product: p }));
                }
            });
        }

        const foundSku = allSkus.find((s) => s.barcode === code || s.code === code);

        if (foundSku) {
            toast.success(`🔫 ${foundSku.product.name}`, { duration: 1000 });

            handleAddProduct(foundSku.product, foundSku);
        } else {
            toast.error(`Código no encontrado: ${code}`);
        }
    };

    const productFuse = useMemo(
        () =>
            new Fuse(Array.isArray(products) ? products : [], {
                keys: ["name", "skus.code", "brand"],
                threshold: 0.3,
            }),
        [products],
    );

    const filteredProducts = useMemo(() => {
        let list = products || [];
        if (selectedCategoryId) {
            list = list.filter((p) => p.categoryId === selectedCategoryId);
        }
        if (productQuery.trim()) {
            // Si hay búsqueda manual, usamos los resultados de la API de búsqueda
            // o filtramos la lista local si es pequeña
            return searchResults.length > 0
                ? searchResults
                : list.filter(
                    (p) =>
                        p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
                        p.skus?.some((s) =>
                            s.code.toLowerCase().includes(productQuery.toLowerCase()),
                        ),
                );
        }
        return list;
    }, [productQuery, products, searchResults, selectedCategoryId]);

    const filteredUsers = useMemo(() => {
        if (!users || !Array.isArray(users)) return [];
        if (!clientQuery) return [];
        return users
            .filter(
                (u) =>
                    u.name.toLowerCase().includes(clientQuery.toLowerCase()) ||
                    (u.email && u.email.includes(clientQuery)) ||
                    (u.dni && u.dni.includes(clientQuery)),
            )
            .slice(0, 5);
    }, [clientQuery, users]);

    const handleCreateQuickUser = async () => {
        if (!quickUserName || !quickUserPhone) {
            toast.error("Por favor completa Nombre y Teléfono");
            return;
        }

        const identifier = quickUserDni || quickUserPhone;
        const tempEmail = `cliente.${identifier}@local.pos`;

        const existingLocal = Array.isArray(users)
            ? users.find(
                (u) =>
                    u.email === tempEmail ||
                    (u.dni && quickUserDni && u.dni === quickUserDni),
            )
            : null;

        if (existingLocal) {
            setClient(existingLocal);
            setQuickUserOpen(false);

            setQuickUserName("");
            setQuickUserPhone("");
            setQuickUserDni("");
            setQuickUserRnt("");
            toast(`Cliente existente encontrado: ${existingLocal.name}`);
            return;
        }

        try {
            const res = await UsersAPI.create({
                name: quickUserName,
                email: tempEmail,
                password: identifier,
                role: "CUSTOMER",
                phone: quickUserPhone,
                dni: quickUserDni,
                rnt: quickUserRnt,
            });

            // Manejar estructuras típicas de respuesta de express

            let newUser = res;
            if (res.data) {
                newUser = res.data;
                if (newUser.data) newUser = newUser.data;
            }

            if (!newUser || !newUser.id) {
                toast.error("Error: El servidor no devolvió un usuario válido.");
                return;
            }

            // 3. Actualizar Store y Seleccionar
            const currentUsers = useDataStore.getState().users || [];
            useDataStore.getState().setUsers([...currentUsers, newUser]);

            setClient(newUser);
            setQuickUserOpen(false);
            toast.success(`Cliente creado y seleccionado: ${newUser.name}`);
        } catch (error) {
            toast.error("Error creando usuario: Verifique si ya existe.");
        }
    };

    const handleSaleSubmit = async () => {
        if (items.length === 0 && !isQuickSale) return;

        if (!client && !isQuickSale) {
            toast.error("REGISTRO DENEGADO", {
                description:
                    "Debes asignar un Cliente a interactuar antes de proceder con la venta.",
            });
            return;
        }

        if (!paymentType) {
            toast.error("MÉTODO DE PAGO REQUERIDO", {
                description:
                    "Debes seleccionar un método de pago antes de registrar la venta.",
            });
            return;
        }

        const zeroItems = items.filter((i) => i.quantity <= 0);
        if (zeroItems.length > 0 && !isQuickSale) {
            toast.error("CANTIDADES INVÁLIDAS", {
                description: `El producto "${zeroItems[0].productName}" tiene cantidad 0. Ajusta la cantidad o quítalo del carrito.`,
            });
            return;
        }

        setIsProcessing(true);

        const finalShipping = calculatedShipping;

        // Preparar Payload
        const saleData = {
            total: getTotal(),
            subtotal: getSubtotal(),
            discount,
            shippingCost: finalShipping,

            items: items.map((i) => ({
                skuId: i.skuId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                subtotal: i.subtotal,
                taxRate: i.taxRate,
            })),

            clientId: client?.id || null,
            paymentType,
            deliveryType,
            deliveryAddress: deliveryType === "DELIVERY" ? deliveryAddress : null,
            shippingZoneId: selectedZoneId || null,
            observations,

            // Descuentos
            couponCode: appliedCoupon?.code || null,

            manualDiscount: (() => {
                const { getItemDiscount } = useCartStore.getState();
                let netItemsTotal = 0;
                items.forEach((item) => {
                    const { amount } = getItemDiscount(item);
                    netItemsTotal += Math.max(0, item.unitPrice * item.quantity - amount);
                });

                let baseForManual = netItemsTotal;
                if (appliedCoupon) {
                    const couponValue = Number(appliedCoupon.value) || 0;
                    if (appliedCoupon.type === "PERCENTAGE")
                        baseForManual -= netItemsTotal * (couponValue / 100);
                    else baseForManual -= couponValue;
                }
                return manualDiscount > 0
                    ? parseFloat((baseForManual * (manualDiscount / 100)).toFixed(2))
                    : 0;
            })(),

            pointsToUse: pointsToUse || 0,

            branchId: activeBranch?.id || 1,

            paymentStatus: paymentType === "QR" ? "PENDING" : "PAID",
            deliveryStatus: isDelivered ? "DELIVERED" : "PENDING_DELIVERY",

            currencyCode: storeConfig?.baseCurrency || "USD",
        };
        try {
            const clientName = client?.name || "N/A";

            const response = await SalesAPI.create(saleData);

            let rawData = response?.data || response;
            const saleInfo = rawData.sale ? rawData.sale : rawData;

            setCompletedSale({ ...saleInfo, clientName });

            clearCart();
            setObservations("");
            setManualTotal("");

            setManualDiscount(0);
            setAppliedCoupon(null);
            setCouponCode("");
            setIsDelivered(true);
            setDeliveryAddress("");
            setPointsToUse(0);
            await loadPOSData();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Error al registrar venta.";
            toast.error(errorMessage);

            await loadPOSData();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddProduct = (product: Product, sku: SKU) => {
        const existing = items.find((i) => i.skuCode === sku.code);
        const currentQty = existing ? existing.quantity : 0;
        const increment = isFractional(product) ? 0 : 1;
        if (currentQty + increment > sku.stock) {
            toast.error(
                `Stock insuficiente. Disponible: ${Number(sku.stock).toFixed(isFractional(product) ? 3 : 0)}`,
            );
            return;
        }

        const realPrice = Number(sku.price);

        addItem({
            productName: product.name,
            skuCode: sku.code,
            unitPrice: realPrice,
            quantity: product.allowFractional ? 0 : 1,
            subtotal: product.allowFractional ? 0 : realPrice,
            skuId: sku.id,
            tempId: crypto.randomUUID(),
            maxStock: sku.stock,
            categoryId: product.categoryId,
            productId: product.id,
            brand: product.brand,
            pointsReward: product.pointsReward || 0,
            allowFractional: product.allowFractional,
            measurementUnit: product.measurementUnit,
            taxRate: product.taxRate,
        });
    };

    const getSubtotal = () => netItemsSubtotal;

    const getTotal = () => {
        // 1. Subtotal Neto de Ítems (ya filtrado por descuentos de eventos)
        const netItemsTotal = netItemsSubtotal;

        // 2. Envío Calculado (con reglas de evento y envío gratis)
        const effectiveShipping = calculatedShipping;

        // 3. Cupón (Aplicado ÚNICAMENTE sobre el total neto de ítems, no sobre el envío)
        let couponDiscount = 0;
        if (appliedCoupon) {
            const couponValue = Number(appliedCoupon.value) || 0;
            if (appliedCoupon.type === "PERCENTAGE") {
                couponDiscount = netItemsTotal * (couponValue / 100);
            } else {
                couponDiscount = Math.min(couponValue, netItemsTotal);
            }
        }

        // 4. Descuento Manual (sobre base posterior a cupón, solo ítems)
        const afterCoupon = Math.max(0, netItemsTotal - couponDiscount);
        const manualDiscountAmount =
            manualDiscount > 0
                ? parseFloat((afterCoupon * (manualDiscount / 100)).toFixed(2))
                : 0;

        // 5. Impuestos
        const taxAmount = calculatedTax;

        let final = afterCoupon - manualDiscountAmount;
        final += effectiveShipping + taxAmount;

        // 6. Canje de Puntos (Se resta del total final con impuestos)
        if (pointsToUse > 0 && storeConfig?.enablePointsRedemption) {
            const moneyPerPoint = Number(storeConfig.moneyPerPoint) || 0;
            const pointsValue = pointsToUse * moneyPerPoint;
            final = Math.max(0, final - pointsValue);
        }

        return Math.max(0, final);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        try {
            const res = await CouponsAPI.validate(
                couponCode,
                getSubtotal(),
                client?.id,
            );
            if (res.success) {
                setAppliedCoupon(res.data);
                toast.success(`Cupón "${couponCode}" aplicado con éxito`);
            } else {
                toast.error(res.message || "Cupón inválido");
                setAppliedCoupon(null);
            }
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || "Cupón inválido o expirado";
            toast.error(errorMessage);
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRefreshProducts = async () => {
        setIsLoading(true);
        try {
            const productsData = await ProductsAPI.getAll({
                limit: 20,
                adminView: true,
            });

            // 1. Paginado
            if (productsData?.data?.data && Array.isArray(productsData.data.data)) {
                useDataStore.getState().setProducts(productsData.data.data);
            }
            // 2. Simple
            else if (productsData?.data && Array.isArray(productsData.data)) {
                useDataStore.getState().setProducts(productsData.data);
            }
            // 3. Directo
            else if (Array.isArray(productsData)) {
                useDataStore.getState().setProducts(productsData as any);
            }
        } catch (err) {
            setError("Error al actualizar catálogo");
        } finally {
            setIsLoading(false);
        }
    };

    // Estado de UI Derivado
    const allowedPaymentMethods = (
        storeConfig &&
            Array.isArray(storeConfig.enabledPaymentMethods) &&
            storeConfig.enabledPaymentMethods.length > 0
            ? storeConfig.enabledPaymentMethods
            : ["CASH", "CARD", "DEBIT", "TRANSFER", "MERCADO_PAGO"]
    ).filter((m: string) => !["STRIPE", "PAYPAL"].includes(m.toUpperCase()));
    const shippingEnabled = storeConfig?.enableShipping ?? true;

    const total =
        isQuickSale && manualTotal ? parseFloat(manualTotal) : getTotal();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[calc(100vh)] bg-background pb-2 pt-2  lg:overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300">
            {/* COL IZQUIERDA: Búsqueda y Carrito  */}
            <div className="flex flex-col lg:h-full gap-4">
                <Card className="flex-shrink-0 border-2 border-border shadow-md bg-card rounded-xl">
                    <CardContent className="p-3 relative group">
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-black uppercase text-zinc-500 whitespace-nowrap min-w-[120px]">
                                Buscar Producto
                            </Label>
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    placeholder="NOMBRE, SKU o ESCÁNER..."
                                    className="pl-10 pr-12 h-11 font-medium rounded-lg shadow-sm bg-muted/30 border-2 border-border focus:border-primary text-sm uppercase"
                                    value={productQuery}
                                    onChange={(e) => setProductQuery(e.target.value)}
                                />
                                {isSearchingProducts && (
                                    <div className="absolute right-14 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    </div>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 text-zinc-400 hover:text-blue-600 hover:bg-white hover:cursor-pointer"
                                    onClick={handleRefreshProducts}
                                >
                                    <RefreshCcw
                                        className={cn("h-4 w-4", isLoading ? "animate-spin" : "")}
                                    />
                                </Button>
                                {true && (
                                    <div
                                        className="absolute z-[100] w-[110vw] max-w-[95vw] sm:max-w-[80vw] lg:max-w-[70vw] -left-4 sm:-left-32
                                        max-sm:-left-38
                                        p-4 mt-2 bg-popover border-4 border-primary/60 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 hidden group-focus-within:flex 
                                        flex flex-col h-[70vh] overflow-hidden"
                                    >
                                        {/* Barrita de Categorías */}
                                        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide border-b border-border flex-shrink-0">
                                            <Button
                                                variant={
                                                    selectedCategoryId === null ? "default" : "outline"
                                                }
                                                size="sm"
                                                className="rounded-full font-black uppercase text-[10px] h-8 px-4"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCategoryId(null);
                                                }}
                                            >
                                                TODO
                                            </Button>
                                            {categories.map((cat) => (
                                                <Button
                                                    key={cat.id}
                                                    variant={
                                                        selectedCategoryId === cat.id
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    className="rounded-full font-black uppercase text-[10px] h-8 px-4 whitespace-nowrap"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCategoryId(cat.id);
                                                    }}
                                                >
                                                    {cat.name}
                                                </Button>
                                            ))}
                                        </div>

                                        {/* Grilla de Productos con Scroll */}
                                        <div className="flex-1 min-h-0 overflow-y-auto p-1">
                                            {filteredProducts.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                                                    <Search className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="font-bold uppercase text-xs">
                                                        No se encontraron productos
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ">
                                                    {filteredProducts.map((product) => (
                                                        <POSProductCard
                                                            key={product.id}
                                                            product={product}
                                                            storeConfig={storeConfig}
                                                            onAdd={(p) => {
                                                                if (
                                                                    p.skus &&
                                                                    p.skus.length === 1 &&
                                                                    p.skus[0]
                                                                ) {
                                                                    handleAddProduct(p, p.skus[0]);
                                                                } else {
                                                                    setSelectedProductForVariants(p);
                                                                }
                                                                // Opcional: limpiar query al agregar
                                                                // setProductQuery("");
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* LISTA DEL CARRITO MOVIDA A LA COLUMNA IZQUIERDA */}
                <Card className="flex flex-col overflow-hidden border-2 border-border shadow-lg bg-card rounded-xl lg:h-[calc(100vh-220px)] min-h-[400px]">
                    <CardHeader className="p-3 py-2 bg-muted/50 border-b-2 border-border flex flex-row justify-between items-center rounded-t-xl">
                        <h3 className="font-black text-sm text-foreground uppercase tracking-tight">
                            Carrito
                        </h3>
                        <Button
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-100 font-bold uppercase hover:cursor-pointer"
                            onClick={clearCart}
                        >
                            VACIAR CARRO
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0 border-r-0 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                                <div className="bg-muted p-6 rounded-full border-2 border-border">
                                    <FileText className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-muted-foreground uppercase">
                                        Carrito Vacío
                                    </p>
                                    <p className="text-xs text-muted-foreground/80">
                                        Escanea o busca productos
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {items.map((item) => (
                                    <div
                                        key={item.tempId}
                                        className="p-3 hover:bg-muted/50 transition-colors group relative pr-10"
                                    >
                                        <div className="flex justify-between text-sm font-bold text-foreground">
                                            <span className="line-clamp-2 leading-tight flex-1 mr-2">
                                                {item.productName}
                                            </span>

                                            {/* Visualización de Precio */}
                                            {(() => {
                                                const { amount } = useCartStore
                                                    .getState()
                                                    .getItemDiscount(item);
                                                const unitPrice = item.unitPrice;

                                                const unitDiscount = amount / item.quantity;
                                                const finalUnitPrice = unitPrice - unitDiscount;

                                                if (amount > 0) {
                                                    return (
                                                        <div className="text-right flex flex-col">
                                                            <span className="text-xs text-muted-foreground line-through decoration-red-500 decoration-2">
                                                                {formatCurrency(
                                                                    unitPrice * item.quantity,
                                                                    storeConfig?.baseCurrency || "USD",
                                                                    storeConfig?.currencySymbol,
                                                                )}
                                                            </span>
                                                            <span className="font-mono text-lg text-emerald-600">
                                                                {formatCurrency(
                                                                    finalUnitPrice * item.quantity,
                                                                    storeConfig?.baseCurrency || "USD",
                                                                    storeConfig?.currencySymbol,
                                                                )}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="text-right flex flex-col items-end">
                                                        <span className="font-mono text-lg">
                                                            {formatCurrency(
                                                                unitPrice * item.quantity,
                                                                storeConfig?.baseCurrency || "USD",
                                                                storeConfig?.currencySymbol,
                                                            )}
                                                        </span>
                                                        {item.allowFractional && item.measurementUnit && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {formatCurrency(
                                                                    unitPrice,
                                                                    storeConfig?.baseCurrency || "USD",
                                                                    storeConfig?.currencySymbol,
                                                                )}
                                                                /
                                                                {item.measurementUnit === "KG"
                                                                    ? "kg"
                                                                    : item.measurementUnit === "LITRO"
                                                                        ? "L"
                                                                        : item.measurementUnit === "METRO"
                                                                            ? "m"
                                                                            : item.measurementUnit.toLowerCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex flex-col items-start gap-1">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] h-5 bg-muted text-muted-foreground border border-border font-mono"
                                                >
                                                    {item.skuCode}
                                                </Badge>
                                                {(() => {
                                                    const { amount, label } = useCartStore
                                                        .getState()
                                                        .getItemDiscount(item);
                                                    if (amount > 0)
                                                        return (
                                                            <Badge
                                                                variant="default"
                                                                className="text-[10px] h-5 bg-green-600/90 hover:bg-green-600 text-white border-0 flex items-center gap-1"
                                                            >
                                                                <Tag className="w-3 h-3" />{" "}
                                                                {label || "Descuento"} (-
                                                                {formatCurrency(
                                                                    amount,
                                                                    storeConfig?.baseCurrency || "USD",
                                                                    storeConfig?.currencySymbol,
                                                                )}
                                                                )
                                                            </Badge>
                                                        );
                                                })()}
                                            </div>
                                            {item.allowFractional ? (
                                                <div className="flex items-center gap-1 bg-background border-2 border-border rounded-md shadow-sm px-2 py-1">
                                                    <SafeNumericInput
                                                        value={item.quantity}
                                                        onChange={(val) =>
                                                            updateQuantity(item.skuCode, val)
                                                        }
                                                        placeholder="0.000"
                                                        className="h-7 w-20 text-xs font-bold font-mono border-none focus-visible:ring-0 p-0 text-center"
                                                    />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                        {item.measurementUnit?.toLowerCase() || "u"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-0.5 bg-background border-2 border-border rounded-md shadow-sm overflow-hidden">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 rounded-none text-muted-foreground hover:bg-muted hover:cursor-pointer"
                                                        onClick={() =>
                                                            updateQuantity(item.skuCode, item.quantity - 1)
                                                        }
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="text-xs w-8 text-center font-bold font-mono bg-muted py-1.5">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 rounded-none text-muted-foreground hover:bg-muted hover:cursor-pointer disabled:opacity-30"
                                                        onClick={() =>
                                                            updateQuantity(item.skuCode, item.quantity + 1)
                                                        }
                                                        disabled={item.quantity >= item.maxStock}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botón de Quitar */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer"
                                            onClick={() => removeItem(item.skuCode)}
                                            title="Quitar producto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* COL CENTRAL: Formulario y Configuración */}
            <div className="flex flex-col gap-4 lg:h-full lg:overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-zinc-300">
                {/* Entrega y Pago */}
                <Card className="border-2 border-border shadow-md bg-card rounded-xl">
                    <CardHeader className="p-3 py-2 bg-muted/50 border-b-2 border-border rounded-t-xl">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground uppercase">
                            <Truck className="w-5 h-5 text-blue-600" /> Venta / Entrega
                        </h3>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                        {/* Selector de Tipo de Entrega */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-zinc-500">
                                Tipo de Entrega
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-12 border-2 font-bold hover:cursor-pointer",
                                        deliveryType === "PICKUP"
                                            ? "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90"
                                            : "border-input text-muted-foreground hover:bg-muted",
                                    )}
                                    onClick={() => {
                                        setDeliveryType("PICKUP");
                                        setShippingCost(0);
                                    }}
                                >
                                    RETIRO LOCAL
                                </Button>
                                {storeConfig?.enableShipping && !isShippingDisabledByEvent && (
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-12 border-2 font-bold hover:cursor-pointer",
                                            deliveryType === "DELIVERY"
                                                ? "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90"
                                                : "border-input text-muted-foreground hover:bg-muted",
                                        )}
                                        onClick={() => {
                                            setDeliveryType("DELIVERY");
                                            if (selectedZoneId) {
                                                const zone = shippingZones.find(
                                                    (z) => z.id == selectedZoneId,
                                                );
                                                if (zone) setShippingCost(Number(zone.cost));
                                            }
                                        }}
                                    >
                                        ENVÍO DOMICILIO
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Detalles de Envío */}
                        {deliveryType === "DELIVERY" && (
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border-2 border-orange-200 dark:border-orange-900/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-orange-900 dark:text-orange-200">
                                        ZONA DE ENVÍO
                                    </Label>
                                    {shippingZones.length > 0 ? (
                                        <Select
                                            onValueChange={(val) => setSelectedZoneId(Number(val))}
                                            value={selectedZoneId?.toString()}
                                        >
                                            <SelectTrigger className="bg-background border-2 border-orange-200 dark:border-orange-800 text-orange-900 font-medium">
                                                <SelectValue placeholder="SELECCIONAR ZONA" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shippingZones.map((z) => (
                                                    <SelectItem key={z.id} value={z.id.toString()}>
                                                        <span className="font-bold">
                                                            {z.city || z.province || "Zona General"}
                                                        </span>
                                                        <span className="ml-2 text-zinc-500 font-mono">
                                                            -{" "}
                                                            {formatCurrency(
                                                                Number(z.cost),
                                                                storeConfig?.baseCurrency || "USD",
                                                                storeConfig?.currencySymbol,
                                                            )}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-xs text-amber-600 flex items-center gap-1 font-bold">
                                            <AlertCircle className="w-3 h-3" /> Sin zonas configuradas
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-orange-900 dark:text-orange-200">
                                        DIRECCIÓN EXACTA
                                    </Label>
                                    <Input
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        placeholder="Calle, Número, Piso..."
                                        className="bg-background border-2 border-orange-200 dark:border-orange-800 h-9 text-sm font-medium"
                                    />
                                </div>

                                <div className="flex gap-3 items-end">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs font-bold text-orange-900">
                                            COSTO ENVÍO
                                        </Label>
                                        <SafeNumericInput
                                            value={shippingCost}
                                            onChange={(val) => setShippingCost(val)}
                                            className="bg-background font-mono font-black border-2 border-orange-200 text-orange-900"
                                        />
                                    </div>
                                    <div className="pb-2 text-xs text-orange-600 font-bold">
                                        {storeConfig?.freeShippingThreshold
                                            ? getSubtotal() >= storeConfig.freeShippingThreshold
                                                ? "¡ENVÍO GRATIS!"
                                                : " "
                                            : ""}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Método de Pago */}
                        <div className="space-y-2 pt-2 border-t-2 border-border pt-4">
                            <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Forma de Pago
                            </Label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {allowedPaymentMethods.map((type: string) => (
                                    <div
                                        key={type}
                                        className={cn(
                                            "border-2 rounded-lg p-2 text-center text-[10px] md:text-xs cursor-pointer transition-all h-20 flex flex-col items-center justify-center gap-1 font-bold uppercase",
                                            paymentType === type
                                                ? "border-secondary bg-secondary/10 text-secondary shadow-md scale-105 z-10"
                                                : "border-border bg-card hover:bg-muted text-muted-foreground hover:border-input",
                                        )}
                                        onClick={() => setPaymentType(type as any)}
                                    >
                                        {(type == "DEBIT" && "Débito") ||
                                            (type == "CASH" && "Efectivo") ||
                                            (type == "CARD" && "Tarjeta") ||
                                            (type === "TRANSFER" && "Transferencia") ||
                                            (type === "QR" && "Pago QR") ||
                                            (type === "MERCADO_PAGO"
                                                ? "Mercado Pago"
                                                : type.replace(/_/g, " "))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Info Transferencia */}
                        {paymentType === "TRANSFER" && storeConfig?.bankAccounts && storeConfig.bankAccounts.length > 0 && (
                            <div className="space-y-2 pt-4 px-1">
                                <Label className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    Datos para Transferencia
                                </Label>
                                <div className="grid gap-2">
                                    {(storeConfig.bankAccounts as any[]).map((acc: any) => (
                                        <div key={acc.id} className="p-3 border-2 border-border rounded-lg bg-muted/20 text-xs flex flex-col gap-1.5 shadow-sm">
                                            <div className="font-bold text-sm text-indigo-700 dark:text-indigo-400">{acc.bankName}</div>
                                            <div className="font-medium text-foreground">{acc.accountName}</div>
                                            
                                            <div className="flex justify-between items-center mt-1 pt-2 border-t border-border/50">
                                                <span className="text-muted-foreground font-semibold text-[10px] uppercase">CBU/CVU</span>
                                                <span className="font-mono bg-background px-2 py-0.5 border rounded-md text-foreground select-all">{acc.cbuCvu}</span>
                                            </div>
                                            
                                            {acc.alias && (
                                                <div className="flex justify-between items-center mt-0.5">
                                                    <span className="text-muted-foreground font-semibold text-[10px] uppercase">Alias</span>
                                                    <span className="font-mono bg-background px-2 py-0.5 border rounded-md text-foreground select-all">{acc.alias}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Switch de Estado de Entrega */}
                        <div className="flex items-center justify-between pt-3 px-1">
                            <Label
                                htmlFor="delivered-switch"
                                className={cn(
                                    "text-xs font-bold cursor-pointer flex items-center gap-2",
                                    isDelivered ? "text-emerald-600" : "text-muted-foreground",
                                )}
                            >
                                <Truck className="w-4 h-4" />
                                MARCAR COMO ENTREGADO
                            </Label>
                            <Switch
                                id="delivered-switch"
                                checked={isDelivered}
                                onCheckedChange={setIsDelivered}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                        {/* Observaciones */}
                        <div className="space-y-2 pt-4 border-t-2 border-border">
                            <Label className="text-xs font-bold text-muted-foreground">
                                OBSERVACIONES
                            </Label>
                            <textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Nota interna..."
                                className="h-25 w-full text-sm bg-muted/50 border-2 border-input p-2 resize-none text-start align-top"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* COL DERECHA: Carrito y User */}
            <div className="flex flex-col gap-4 lg:h-full lg:overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-zinc-300">
                {/* Cliente */}
                <Card className="border-2 border-border shadow-md bg-card rounded-xl flex-shrink-0">
                    <CardHeader className="p-3 py-2 bg-muted/50 border-b-2 border-border flex flex-row items-center justify-between rounded-t-xl">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground uppercase">
                            <UserIcon className="w-5 h-5 text-blue-600" /> Cliente
                        </h3>
                        {client && (
                            <Badge
                                variant="default"
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                            >
                                OK
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {!client ? (
                            <div className="relative space-y-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        placeholder="BUSCAR CLIENTE (DNI, TEL, NOMBRE)..."
                                        value={clientQuery}
                                        onChange={(e) => setClientQuery(e.target.value)}
                                        className="pl-10 pr-4 h-10 font-medium rounded-full shadow-sm transition-all bg-gray-200 border-3 border-gray-400/20"
                                    />
                                    {/* RESULTADOS DESPLEGABLES */}
                                    {filteredUsers.length > 0 && (
                                        <div className="absolute z-50 w-full bg-popover border-2 border-border rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto">
                                            {filteredUsers.map((u) => (
                                                <div
                                                    key={u.id}
                                                    className="p-3 border-b border-border last:border-0 hover:bg-muted cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        setClient(u);
                                                        setClientQuery("");
                                                    }}
                                                >
                                                    <p className="font-bold text-sm text-foreground">
                                                        {u.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground flex justify-between font-mono">
                                                        <span>{u.email}</span>
                                                        <span>{u.dni}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500 font-bold">O</span>
                                    <Dialog open={quickUserOpen} onOpenChange={setQuickUserOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-2 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 font-bold hover:cursor-pointer"
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" /> NUEVO CLIENTE
                                                RÁPIDO
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px] border-2 border-border bg-background shadow-2xl z-50">
                                            <DialogHeader>
                                                <DialogTitle>Nuevo Cliente Rápido</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name" className="font-bold">
                                                        Nombre Completo
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        className="border-2 border-zinc-300"
                                                        value={quickUserName}
                                                        onChange={(e) => setQuickUserName(e.target.value)}
                                                        placeholder="Ej: Juan Perez"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="phone" className="font-bold">
                                                            Teléfono (Celular)
                                                        </Label>
                                                        <Input
                                                            id="phone"
                                                            inputMode="tel"
                                                            className="border-2 border-zinc-300"
                                                            value={quickUserPhone}
                                                            onChange={(e) =>
                                                                setQuickUserPhone(e.target.value)
                                                            }
                                                            placeholder="Ej: 1122334455"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="dni" className="font-bold">
                                                            DNI (Opcional)
                                                        </Label>
                                                        <Input
                                                            id="dni"
                                                            inputMode="numeric"
                                                            className="border-2 border-zinc-300"
                                                            value={quickUserDni}
                                                            onChange={(e) => setQuickUserDni(e.target.value)}
                                                            placeholder="Ej: 30123456"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="rnt" className="font-bold">
                                                        RNT (Opcional)
                                                    </Label>
                                                    <Input
                                                        id="rnt"
                                                        className="border-2 border-zinc-300"
                                                        value={quickUserRnt}
                                                        onChange={(e) => setQuickUserRnt(e.target.value)}
                                                        placeholder="Número Tributario..."
                                                    />
                                                </div>
                                                <div className="text-xs text-zinc-500 bg-zinc-100 p-3 rounded border border-zinc-200">
                                                    <strong>Credenciales Automáticas:</strong> <br />
                                                    Email: cliente.[tel/dni]@local.pos <br />
                                                    Pass: [tel/dni]
                                                </div>
                                                <Button
                                                    onClick={handleCreateQuickUser}
                                                    className="w-full font-bold hover:cursor-pointer"
                                                >
                                                    Crear y Asignar
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 dark:border-emerald-700 rounded-lg flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-black text-base text-emerald-900 dark:text-emerald-100 uppercase">
                                        {client.name}
                                    </p>
                                    <p className="text-xs text-emerald-800 dark:text-emerald-400 font-mono mt-1 font-bold">
                                        {client.email}
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {client.dni && (
                                            <Badge
                                                variant="outline"
                                                className="mt-2 text-[10px] border-emerald-600 text-emerald-800 bg-white/50 font-bold"
                                            >
                                                DNI: {client.dni}
                                            </Badge>
                                        )}
                                        {client.rnt && (
                                            <Badge
                                                variant="outline"
                                                className="mt-2 text-[10px] border-blue-600 text-blue-800 bg-white/50 font-bold uppercase"
                                            >
                                                RNT: {client.rnt}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setClient(null)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 font-bold border border-red-200 hover:cursor-pointer"
                                >
                                    QUITAR
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card flex-1 flex flex-col justify-between text-card-foreground shadow-2xl relative overflow-hidden border-4 border-border rounded-xl z-20">
                    {/* Banner de Evento Activo */}
                    {activeEvents.map((event) => (
                        <div
                            key={event.id}
                            className="bg-gradient-to-r from-pink-600 to-purple-600 p-3 text-center shadow-lg relative z-10"
                        >
                            <p className="text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2">
                                <Tag className="w-4 h-4 animate-pulse" /> {event.name}
                            </p>
                        </div>
                    ))}

                    <CardContent className="p-6 relative flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300">
                        <div className="space-y-4">
                            {/* Subtotal */}
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span className="text-xs font-bold uppercase">Subtotal</span>
                                <span className="font-mono text-sm">
                                    {formatCurrency(
                                        getSubtotal(),
                                        storeConfig?.baseCurrency || "USD",
                                        storeConfig?.currencySymbol,
                                    )}
                                </span>
                            </div>

                            {/* Envío */}
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span className="text-xs font-bold uppercase">Envío</span>
                                {calculatedShipping === 0 && deliveryType === "DELIVERY" ? (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold border-0">
                                        GRATIS
                                    </Badge>
                                ) : (
                                    <span className="font-mono text-foreground">
                                        {formatCurrency(
                                            calculatedShipping,
                                            storeConfig?.baseCurrency || "USD",
                                            storeConfig?.currencySymbol,
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* Impuestos */}
                            {((storeConfig?.taxRate && Number(storeConfig.taxRate) > 0) ||
                                items.some((i) => i.taxRate && Number(i.taxRate) > 0)) && (
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span className="text-xs font-bold uppercase">Impuestos</span>
                                        <span className="font-mono text-foreground">
                                            +
                                            {formatCurrency(
                                                (() => {
                                                    const { getItemDiscount } = useCartStore.getState();
                                                    let netItemsTotal = 0;
                                                    items.forEach((item) => {
                                                        const { amount } = getItemDiscount(item);
                                                        netItemsTotal += Math.max(
                                                            0,
                                                            item.unitPrice * item.quantity - amount,
                                                        );
                                                    });

                                                    let totalTax = 0;
                                                    const globalTaxRate = Number(storeConfig?.taxRate) || 0;

                                                    let totalGlobalDiscount = 0;
                                                    if (appliedCoupon) {
                                                        const couponValue = Number(appliedCoupon.value) || 0;
                                                        if (appliedCoupon.type === "PERCENTAGE")
                                                            totalGlobalDiscount +=
                                                                netItemsTotal * (couponValue / 100);
                                                        else totalGlobalDiscount += couponValue;
                                                    }
                                                    const manualDiscountAmount =
                                                        manualDiscount > 0
                                                            ? (netItemsTotal - totalGlobalDiscount) *
                                                            (manualDiscount / 100)
                                                            : 0;
                                                    totalGlobalDiscount += manualDiscountAmount;
                                                    const pointsDiscountAmount =
                                                        pointsToUse > 0 && storeConfig?.enablePointsRedemption
                                                            ? pointsToUse *
                                                            (Number(storeConfig.moneyPerPoint) || 0)
                                                            : 0;
                                                    totalGlobalDiscount += pointsDiscountAmount;

                                                    const discountRatio =
                                                        netItemsTotal > 0
                                                            ? Math.min(1, totalGlobalDiscount / netItemsTotal)
                                                            : 0;

                                                    items.forEach((item) => {
                                                        const { amount: itemEventDiscount } =
                                                            getItemDiscount(item);
                                                        const itemOriginalSubtotal =
                                                            item.unitPrice * item.quantity;
                                                        const itemNetSubtotal = Math.max(
                                                            0,
                                                            itemOriginalSubtotal - itemEventDiscount,
                                                        );
                                                        const itemFinalSubtotal =
                                                            itemNetSubtotal * (1 - discountRatio);
                                                        const itemTaxRate =
                                                            item.taxRate !== undefined && item.taxRate !== null
                                                                ? Number(item.taxRate)
                                                                : globalTaxRate;
                                                        totalTax += itemFinalSubtotal * (itemTaxRate / 100);
                                                    });

                                                    return totalTax;
                                                })(),
                                                storeConfig?.baseCurrency || "USD",
                                                storeConfig?.currencySymbol,
                                            )}
                                        </span>
                                    </div>
                                )}

                            <div className="space-y-4 pt-4 border-t border-border">
                                {/* ENTRADA DE CUPÓN */}
                                {storeConfig?.enableCoupons !== false && (
                                    <div className="flex gap-2">
                                        <Input
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="CÓDIGO CUPÓN"
                                            className="bg-input border-input text-foreground uppercase font-bold placeholder:text-muted-foreground h-8 text-xs"
                                            disabled={
                                                !!appliedCoupon || isValidatingCoupon || isProcessing
                                            }
                                        />
                                        {appliedCoupon ? (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setAppliedCoupon(null);
                                                    setCouponCode("");
                                                }}
                                                disabled={isProcessing}
                                                className="hover:cursor-pointer"
                                            >
                                                X
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={handleApplyCoupon}
                                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold h-8 text-xs hover:cursor-pointer"
                                                disabled={
                                                    isValidatingCoupon || isProcessing || !couponCode
                                                }
                                            >
                                                {isValidatingCoupon ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    "APLICAR"
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {/* Detalles de Descuentos */}
                                {(activeEvents.length > 0 ||
                                    appliedCoupon ||
                                    manualDiscount > 0) && (
                                        <div className="space-y-1 text-xs text-muted-foreground bg-muted p-2 rounded">
                                            {activeEvents.map((e) => (
                                                <div
                                                    key={e.id}
                                                    className="flex justify-between text-pink-400"
                                                >
                                                    <span>★ {e.name}</span>
                                                    <span className="font-bold">EVENTO ACTIVO</span>
                                                </div>
                                            ))}
                                            {appliedCoupon && (
                                                <div className="flex justify-between text-emerald-400">
                                                    <span>🎫 CUPÓN: {appliedCoupon.code}</span>
                                                    <span>
                                                        -
                                                        {appliedCoupon.type === "PERCENTAGE"
                                                            ? `${Number(appliedCoupon.value)}%`
                                                            : formatCurrency(
                                                                Number(appliedCoupon.value),
                                                                storeConfig?.baseCurrency || "USD",
                                                                storeConfig?.currencySymbol,
                                                            )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}


                            </div>
                        </div>
                    </CardContent>
                    <div className="p-4 bg-muted/50 border-t border-border flex flex-col gap-4">
                        {/* TOTAL FINAL */}
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-muted-foreground uppercase block">
                                Total Final
                            </span>
                            <span className="font-black text-3xl xl:text-4xl tracking-tighter text-foreground">
                                {formatCurrency(
                                    total,
                                    storeConfig?.baseCurrency || "USD"
                                )}
                            </span>
                        </div>


                        <POSCalculator
                            total={total}
                            currencyCode={storeConfig?.baseCurrency || "USD"}
                            currencySymbol={storeConfig?.currencySymbol}
                        />

                        <Button
                            className="w-full font-black text-lg h-14 shadow-orange-500/20 shadow-lg hover:shadow-orange-500/40 hover:scale-[1.02] transition-all bg-orange-600 hover:bg-orange-500 text-white rounded-lg uppercase tracking-wide hover:cursor-pointer"
                            size="lg"
                            disabled={items.length === 0 && !isQuickSale}
                            onClick={handleSaleSubmit}
                        >
                            CONFIRMAR VENTA
                        </Button>
                    </div>
                </Card>
            </div>
            {/* Diálogo de Selección de Variantes */}
            <Dialog
                open={!!selectedProductForVariants}
                onOpenChange={(open) => !open && setSelectedProductForVariants(null)}
            >
                <DialogContent className="sm:max-w-[600px] bg-background border-2 border-border">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">
                            {selectedProductForVariants?.name}
                        </DialogTitle>
                        <p className="text-muted-foreground text-sm font-medium">
                            Selecciona una variante para agregar al carrito
                        </p>
                    </DialogHeader>

                    <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
                        {selectedProductForVariants?.skus?.map((sku) => (
                            <div
                                key={sku.id}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer",
                                    sku.stock > 0
                                        ? "border-border hover:border-secondary hover:bg-muted"
                                        : "border-destructive/20 bg-destructive/10 opacity-60 cursor-not-allowed",
                                )}
                                onClick={() => {
                                    if (sku.stock > 0) {
                                        handleAddProduct(selectedProductForVariants, sku);
                                        setSelectedProductForVariants(null);
                                    }
                                }}
                            >
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="font-mono bg-muted text-muted-foreground border-border"
                                        >
                                            {sku.code}
                                        </Badge>
                                        <span className="uppercase text-foreground">
                                            {sku.variantOptions
                                                ?.map((a) => `${a.name}: ${a.value}`)
                                                .join(" | ") || "Estándar"}
                                        </span>
                                    </div>
                                    <p
                                        className={cn(
                                            "text-xs font-bold mt-1",
                                            sku.stock > 0 ? "text-emerald-600" : "text-red-500",
                                        )}
                                    >
                                        {sku.stock > 0
                                            ? `${Number(sku.stock).toFixed(selectedProductForVariants?.allowFractional ? 3 : 0)} ${selectedProductForVariants?.measurementUnit === "KG" ? "kg" : selectedProductForVariants?.measurementUnit === "LITRO" ? "L" : selectedProductForVariants?.measurementUnit === "METRO" ? "m" : "unidades"} disponibles`
                                            : "AGOTADO"}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    {(() => {
                                        const realSkuPrice = Number(sku.price);
                                        const { getItemDiscount } = useCartStore.getState();
                                        const { amount } = getItemDiscount({
                                            productId: selectedProductForVariants.id,
                                            categoryId: selectedProductForVariants.categoryId,
                                            brand: selectedProductForVariants.brand,
                                            skuCode: sku.code,
                                            quantity: 1,
                                            subtotal: realSkuPrice,
                                        } as any);

                                        if (amount > 0) {
                                            return (
                                                <div className="flex flex-col items-end leading-tight mb-1">
                                                    <span className="text-[10px] text-muted-foreground line-through decoration-red-500/50">
                                                        {formatCurrency(
                                                            realSkuPrice,
                                                            storeConfig?.baseCurrency || "USD",
                                                            storeConfig?.currencySymbol,
                                                        )}
                                                    </span>
                                                    <span className="font-black text-lg text-emerald-600">
                                                        {formatCurrency(
                                                            realSkuPrice - amount,
                                                            storeConfig?.baseCurrency || "USD",
                                                            storeConfig?.currencySymbol,
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return (
                                            <p className="font-black text-lg text-foreground">
                                                {formatCurrency(
                                                    realSkuPrice,
                                                    storeConfig?.baseCurrency || "USD",
                                                    storeConfig?.currencySymbol,
                                                )}
                                            </p>
                                        );
                                    })()}
                                    {selectedProductForVariants?.allowFractional &&
                                        selectedProductForVariants?.measurementUnit &&
                                        selectedProductForVariants?.measurementUnit !==
                                        "UNIDAD" && (
                                            <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                                                /
                                                {selectedProductForVariants.measurementUnit === "KG"
                                                    ? "kg"
                                                    : selectedProductForVariants.measurementUnit ===
                                                        "LITRO"
                                                        ? "L"
                                                        : selectedProductForVariants.measurementUnit ===
                                                            "METRO"
                                                            ? "m"
                                                            : selectedProductForVariants.measurementUnit.toLowerCase()}
                                            </span>
                                        )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-[10px] bg-secondary/80  font-bold uppercase text-white hover:bg-secondary hover:text-white mt-1 hover:cursor-pointer"
                                        disabled={sku.stock <= 0}
                                    >
                                        Seleccionar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* SUPERPOSICIÓN DE PROCESAMIENTO */}
            {isProcessing && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Card className="w-[400px] border-4 border-secondary shadow-2xl bg-background animate-in zoom-in-95 duration-300">
                        <CardContent className="flex flex-col items-center justify-center p-10 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                                <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black uppercase text-foreground tracking-tight">
                                    Procesando Pago
                                </h2>
                                <p className="text-muted-foreground font-bold text-sm">
                                    Por favor espere, no cierre la ventana...
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Diálogo de Éxito de Venta */}
            <Dialog
                open={!!completedSale}
                onOpenChange={(open) => !open && setCompletedSale(null)}
            >
                <DialogContent className="sm:max-w-md border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-emerald-700 dark:text-emerald-400 text-xl font-black uppercase flex flex-col items-center gap-2">
                            <div className="p-3 bg-emerald-200 dark:bg-emerald-900 rounded-full">
                                <Award className="w-8 h-8 text-emerald-700 dark:text-emerald-400" />
                            </div>
                            ¡Venta Registrada!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 text-center">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-muted-foreground uppercase">
                                Cliente
                            </p>
                            <p className="text-lg font-black text-foreground">
                                {completedSale?.clientName || "Consumidor Final"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-muted-foreground uppercase">
                                Total Cobrado
                            </p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(
                                    completedSale?.total || 0,
                                    storeConfig?.baseCurrency || "USD",
                                    storeConfig?.currencySymbol,
                                )}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-muted-foreground uppercase">
                                Ticket
                            </p>
                            <p className="text-lg font-mono text-foreground">
                                {completedSale?.ticketNumber ||
                                    completedSale?.receipt?.ticketNumber ||
                                    "GENERANDO..."}
                            </p>
                        </div>

                        {/* Plantilla de Ticket Oculta para Impresión */}
                        <div className="hidden">
                            {completedSale && (
                                <TicketTemplate
                                    ref={ticketRef}
                                    sale={completedSale}
                                    branch={activeBranch}
                                />
                            )}
                        </div>

                        <div className="flex gap-3 justify-center mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setCompletedSale(null)}
                                className="font-bold border-2 hover:cursor-pointer"
                            >
                                Nueva Venta
                            </Button>
                            <Button
                                onClick={handlePrintTicket}
                                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none hover:cursor-pointer"
                            >
                                <Printer className="w-4 h-4 mr-2" /> IMPRIMIR TICKET
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
