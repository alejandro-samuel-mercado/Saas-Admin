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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ThemeColorsManager } from "@/components/admin/theme-colors-manager";
import { AccessControlManager } from "@/components/admin/access-control-manager";
import { BankAccountsManager } from "@/components/admin/bank-accounts-manager";
import { ConfigAPI, CurrenciesAPI } from "@/services/api";
import { useConfigStore } from "@/store/config.store";
import { useAuthStore } from "@/store/use-auth-store";
import { StoreConfig } from "@/types/extended";
import {
    AlertCircle,
    Archive,
    ArrowLeftRight,
    Award,
    Coins,
    CreditCard,
    FileText,
    LayoutGrid,
    Loader2,
    Printer,
    Ruler,
    Save,
    Settings,
    Settings2,
    ShieldCheck,
    StopCircle,
    Store,
    Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function SettingsPage() {
    const [config, setConfig] = useState<Partial<StoreConfig>>({
        storeName: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        socialInstagram: "",
        socialFacebook: "",
        socialTwitter: "",
        currencySymbol: "$",
        taxRate: 0,
        lowStockThreshold: 10,
        criticalStockThreshold: 5,
        preventStockout: true,
        enablePoints: true,
        pointsPerCurrency: 0.1,
        enableShipping: true,
        freeShippingThreshold: 0,
        maintenanceMode: false,
        enablePointsRedemption: false,
        moneyPerPoint: 1,
        webSafetyStock: 0,
        logoUrl: "",
        ticketFooter: "¡Gracias por su compra!",
        showLogoOnTicket: true,
        showLogoOnInvoice: true,
        adImage: "",
        adText: "",
        enableAutoBackup: false,
        backupFrequency: "WEEKLY",
        enableManualStock: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const { user } = useAuthStore();
    const router = useRouter();
    const [activeEvent, setActiveEvent] = useState<any>(null);
    const [currencies, setCurrencies] = useState<any[]>([]);

    const loadConfig = useCallback(async () => {
        try {
            const [data, currData] = await Promise.all([
                ConfigAPI.get({ t: Date.now() }),
                CurrenciesAPI.getAll(),
            ]);

            setCurrencies(currData || []);

            const fullOpeningHours = data.openingHours || {};
            [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ].forEach((day) => {
                if (!fullOpeningHours[day]) {
                    fullOpeningHours[day] = {
                        open: "09:00",
                        close: "20:00",
                        closed: false,
                    };
                }
            });
            data.openingHours = fullOpeningHours;

            if (data.customMeasurementUnits) {
                if (typeof data.customMeasurementUnits === "string") {
                    try {
                        data.customMeasurementUnits = JSON.parse(
                            data.customMeasurementUnits,
                        );
                    } catch (e) {
                        data.customMeasurementUnits = [data.customMeasurementUnits];
                    }
                } else if (!Array.isArray(data.customMeasurementUnits)) {
                    data.customMeasurementUnits = [];
                }
            } else {
                data.customMeasurementUnits = [];
            }

            if (data.activeEvent) {
                setActiveEvent(data.activeEvent);
                const { activeEvent, ...rest } = data;
                setConfig(rest);
            } else {
                setConfig(data);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo cargar la configuración.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const { updateConfig: updateGlobalConfig, config: globalConfig } = useConfigStore();

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                ConfigAPI.update(config),
                ...currencies
                    .filter((c) => c.id)
                    .map((c) => CurrenciesAPI.update(c.id, c)),
            ]);

            // Sincronizar store global
            await updateGlobalConfig(config);

            toast({
                title: "Configuración guardada",
                description: "Los cambios se han aplicado correctamente.",
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadBackup = async () => {
        try {
            toast({
                title: "Generando respaldo",
                description:
                    "Esto puede demorar unos segundos. Por favor, no cierres la ventana.",
            });
            const response = await ConfigAPI.downloadBackup();

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;

            let fileName = "backup.zip";
            const contentDisposition = response.headers?.["content-disposition"];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename=(.+)/);
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
                description:
                    "El respaldo se ha descargado correctamente, revisa tu carpeta local.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo descargar el respaldo manual.",
                variant: "destructive",
            });
        }
    };

    if (loading)
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin" />
            </div>
        );

    return (
        <div className="sm:p-8 pt-2 space-y-8 max-w-6xl mx-auto pb-40 sm:pb-20">
            <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink>Configuración</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex sm:flex-row flex-col gap-3 sm:gap-0 items-center justify-between sm:sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        Configuración Global
                    </h1>
                    <p className="text-muted-foreground">
                        Administra los parámetros y módulos de tu tienda.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="lg"
                    className="bg-secondary hover:bg-secondary/60 shadow-sm text-white hover:cursor-pointer"
                >
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Cambios
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="flex flex-wrap w-full justify-start md:justify-center border-2 border-gray-300 dark:border-gray-700 mb-8 text-slate-700 dark:text-slate-400 p-1 rounded-lg h-auto gap-1">
                    <TabsTrigger
                        className="flex-1 min-w-[140px] text-xs sm:text-sm hover:cursor-pointer data-[state=active]:bg-secondary/60 dark:data-[state=active]:bg-secondary/60"
                        value="general"
                    >
                        Información General
                    </TabsTrigger>
                    <TabsTrigger
                        className="flex-1 min-w-[140px] text-xs sm:text-sm hover:cursor-pointer data-[state=active]:bg-secondary/60 dark:data-[state=active]:bg-secondary/60"
                        value="payments"
                    >
                        Monedas y Pagos
                    </TabsTrigger>
                    <TabsTrigger
                        className="flex-1 min-w-[140px] text-xs sm:text-sm hover:cursor-pointer data-[state=active]:bg-secondary/60 dark:data-[state=active]:bg-secondary/60"
                        value="features"
                    >
                        Módulos y Caract.
                    </TabsTrigger>
                    {config.planInfo?.enabledModules?.includes('custom_ticket') && (
                        <TabsTrigger
                            className="flex-1 min-w-[140px] text-xs sm:text-sm hover:cursor-pointer data-[state=active]:bg-secondary/60 dark:data-[state=active]:bg-secondary/60"
                            value="ticket"
                        >
                            Ticket y Factura
                        </TabsTrigger>
                    )}
                    {config.planInfo?.enabledModules?.includes('backups') && (
                        <TabsTrigger
                            className="flex-1 min-w-[140px] text-xs sm:text-sm hover:cursor-pointer data-[state=active]:bg-secondary/60 dark:data-[state=active]:bg-secondary/60"
                            value="security"
                        >
                            Seguridad
                        </TabsTrigger>
                    )}
                    {config.planInfo?.enabledModules?.includes('custom_theme') && (
                        <TabsTrigger
                            className="flex-1 min-w-[140px] text-xs sm:text-sm hover:cursor-pointer data-[state=active]:bg-secondary/60 dark:data-[state=active]:bg-secondary/60"
                            value="appearance"
                        >
                            Apariencia
                        </TabsTrigger>
                    )}
                    {user?.role?.name === 'SUPER_ADMIN' && config.planInfo?.enabledModules?.includes('access_control') && (
                        <TabsTrigger
                            className="flex-1 min-w-[140px] text-xs sm:text-sm hover:cursor-pointer data-[state=active]:bg-secondary/60 dark:data-[state=active]:bg-secondary/60"
                            value="access"
                        >
                            Control de Acceso
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* TAB 1: GENERAL (Identidad, Horarios, Unidades) */}
                <TabsContent value="general" className="space-y-6">
                    {/* IDENTIDAD */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Identidad del Negocio</CardTitle>
                            <CardDescription>
                                Información pública que se mostrará en tickets y footer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre de la Tienda</Label>
                                    <Input
                                        value={config.storeName || ""}
                                        onChange={(e) =>
                                            setConfig({ ...config, storeName: e.target.value })
                                        }
                                        placeholder="Ej: Mi Supermercado"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email de Contacto</Label>
                                    <Input
                                        value={config.contactEmail || ""}
                                        onChange={(e) =>
                                            setConfig({ ...config, contactEmail: e.target.value })
                                        }
                                        placeholder="contacto@mitienda.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input
                                        value={config.contactPhone || ""}
                                        onChange={(e) =>
                                            setConfig({ ...config, contactPhone: e.target.value })
                                        }
                                        placeholder="+54 9 11..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dirección Física</Label>
                                    <Input
                                        value={config.address || ""}
                                        onChange={(e) =>
                                            setConfig({ ...config, address: e.target.value })
                                        }
                                        placeholder="Av. Siempre Viva 123"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>País del Negocio</Label>
                                    <Select
                                        value={config.country || "AR"}
                                        onValueChange={(val) =>
                                            setConfig({ ...config, country: val })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar país" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AG">Antigua y Barbuda</SelectItem>
                                            <SelectItem value="AR">Argentina</SelectItem>
                                            <SelectItem value="BS">Bahamas</SelectItem>
                                            <SelectItem value="BB">Barbados</SelectItem>
                                            <SelectItem value="BZ">Belice</SelectItem>
                                            <SelectItem value="BO">Bolivia</SelectItem>
                                            <SelectItem value="BR">Brasil</SelectItem>
                                            <SelectItem value="CA">Canadá</SelectItem>
                                            <SelectItem value="CL">Chile</SelectItem>
                                            <SelectItem value="CO">Colombia</SelectItem>
                                            <SelectItem value="CR">Costa Rica</SelectItem>
                                            <SelectItem value="CU">Cuba</SelectItem>
                                            <SelectItem value="DM">Dominica</SelectItem>
                                            <SelectItem value="EC">Ecuador</SelectItem>
                                            <SelectItem value="SV">El Salvador</SelectItem>
                                            <SelectItem value="US">Estados Unidos</SelectItem>
                                            <SelectItem value="GD">Granada</SelectItem>
                                            <SelectItem value="GT">Guatemala</SelectItem>
                                            <SelectItem value="GY">Guyana</SelectItem>
                                            <SelectItem value="HT">Haití</SelectItem>
                                            <SelectItem value="HN">Honduras</SelectItem>
                                            <SelectItem value="JM">Jamaica</SelectItem>
                                            <SelectItem value="MX">México</SelectItem>
                                            <SelectItem value="NI">Nicaragua</SelectItem>
                                            <SelectItem value="PA">Panamá</SelectItem>
                                            <SelectItem value="PY">Paraguay</SelectItem>
                                            <SelectItem value="PE">Perú</SelectItem>
                                            <SelectItem value="DO">República Dominicana</SelectItem>
                                            <SelectItem value="KN">San Cristóbal y Nieves</SelectItem>
                                            <SelectItem value="VC">San Vicente y las Granadinas</SelectItem>
                                            <SelectItem value="LC">Santa Lucía</SelectItem>
                                            <SelectItem value="SR">Surinam</SelectItem>
                                            <SelectItem value="TT">Trinidad y Tobago</SelectItem>
                                            <SelectItem value="UY">Uruguay</SelectItem>
                                            <SelectItem value="VE">Venezuela</SelectItem>
                                            <SelectItem value="ES">España</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">
                                        Usado para determinar qué pasarela es Local vs
                                        Internacional.
                                    </p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Instagram (URL)</Label>
                                    <Input
                                        value={config.socialInstagram || ""}
                                        onChange={(e) =>
                                            setConfig({ ...config, socialInstagram: e.target.value })
                                        }
                                        placeholder="instagram.com/mitienda"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Facebook (URL)</Label>
                                    <Input
                                        value={config.socialFacebook || ""}
                                        onChange={(e) =>
                                            setConfig({ ...config, socialFacebook: e.target.value })
                                        }
                                        placeholder="facebook.com/mitienda"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Twitter / X (URL)</Label>
                                    <Input
                                        value={config.socialTwitter || ""}
                                        onChange={(e) =>
                                            setConfig({ ...config, socialTwitter: e.target.value })
                                        }
                                        placeholder="x.com/mitienda"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* HORARIOS */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Horarios de Atención</CardTitle>
                            <CardDescription>
                                Define los horarios operativos de la tienda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    "monday",
                                    "tuesday",
                                    "wednesday",
                                    "thursday",
                                    "friday",
                                    "saturday",
                                    "sunday",
                                ].map((day) => {
                                    const dayConfig = config.openingHours?.[day] || {
                                        open: "09:00",
                                        close: "20:00",
                                        closed: false,
                                    };
                                    const dayName = {
                                        monday: "Lunes",
                                        tuesday: "Martes",
                                        wednesday: "Miércoles",
                                        thursday: "Jueves",
                                        friday: "Viernes",
                                        saturday: "Sábado",
                                        sunday: "Domingo",
                                    }[day];

                                    return (
                                        <div
                                            key={day}
                                            className="flex items-center justify-between p-2 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-md transition-colors"
                                        >
                                            <div className="w-24 font-medium">{dayName}</div>

                                            <div className="flex sm:flex-row flex-col items-center gap-4 ">
                                                <div
                                                    className={`flex items-center gap-2 transition-opacity ${dayConfig.closed ? "opacity-30 pointer-events-none" : "opacity-100"}`}
                                                >
                                                    <Input
                                                        type="time"
                                                        className="w-24 h-8 text-sm"
                                                        value={dayConfig.open}
                                                        onChange={(e) => {
                                                            const newHours = {
                                                                ...config.openingHours,
                                                                [day]: { ...dayConfig, open: e.target.value },
                                                            };
                                                            setConfig({ ...config, openingHours: newHours });
                                                        }}
                                                    />
                                                    <span className="text-muted-foreground">-</span>
                                                    <Input
                                                        type="time"
                                                        className="w-24 h-8 text-sm"
                                                        value={dayConfig.close}
                                                        onChange={(e) => {
                                                            const newHours = {
                                                                ...config.openingHours,
                                                                [day]: { ...dayConfig, close: e.target.value },
                                                            };
                                                            setConfig({ ...config, openingHours: newHours });
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={!dayConfig.closed}
                                                        onCheckedChange={(c) => {
                                                            const newHours = {
                                                                ...config.openingHours,
                                                                [day]: { ...dayConfig, closed: !c },
                                                            };
                                                            setConfig({ ...config, openingHours: newHours });
                                                        }}
                                                    />
                                                    <span className="text-xs w-12 text-muted-foreground">
                                                        {dayConfig.closed ? "Cerrado" : "Abierto"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* UNIDADES DE MEDIDA */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                    <Ruler className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>Unidades de Medida</CardTitle>
                                    <CardDescription>
                                        Personaliza las unidades para tus productos.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nueva unidad (ej: BOTELLA)"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const val = e.currentTarget.value.trim().toUpperCase();
                                            if (
                                                val &&
                                                !config.customMeasurementUnits?.includes(val)
                                            ) {
                                                setConfig({
                                                    ...config,
                                                    customMeasurementUnits: [
                                                        ...(config.customMeasurementUnits || []),
                                                        val,
                                                    ],
                                                });
                                                e.currentTarget.value = "";
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    className="hover:cursor-pointer"
                                    variant="secondary"
                                    onClick={() => {
                                        const input = document.querySelector(
                                            'input[placeholder="Nueva unidad (ej: BOTELLA)"]',
                                        ) as HTMLInputElement;
                                        const val = input?.value.trim().toUpperCase();
                                        if (val && !config.customMeasurementUnits?.includes(val)) {
                                            setConfig({
                                                ...config,
                                                customMeasurementUnits: [
                                                    ...(config.customMeasurementUnits || []),
                                                    val,
                                                ],
                                            });
                                            if (input) input.value = "";
                                        }
                                    }}
                                >
                                    Agregar
                                </Button>
                            </div>

                            <div className="dark:bg-slate-950/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[100px]">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "UNIDAD",
                                        "CAJA",
                                        "KG",
                                        "LITRO",
                                        "METRO",
                                        "PAR",
                                        "PACK",
                                    ].map((unit) => (
                                        <div
                                            key={unit}
                                            title="Unidad estándar (Sistema)"
                                            className="flex items-center bg-slate-100/50 dark:bg-slate-800/30 border-2 border-slate-200 dark:border-slate-700/50 rounded-full px-3 py-1 shadow-sm"
                                        >
                                            <span className="text-sm font-bold opacity-70">{unit}</span>
                                        </div>
                                    ))}

                                    {/* Custom Units */}
                                    {config.customMeasurementUnits?.map((unit) => (
                                        <div
                                            key={unit}
                                            className="flex items-center dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800/50 rounded-full px-3 py-1 shadow-sm group hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                                        >
                                            <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mr-2">
                                                {unit}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setConfig({
                                                        ...config,
                                                        customMeasurementUnits:
                                                            config.customMeasurementUnits?.filter(
                                                                (u) => u !== unit,
                                                            ),
                                                    })
                                                }
                                                className="text-slate-400 hover:text-red-500 transition-colors hover:cursor-pointer"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="12" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}

                                    {(!config.customMeasurementUnits || config.customMeasurementUnits.length === 0) && (
                                        <div className="w-full mt-2">
                                            <p className="text-[10px] text-muted-foreground italic text-center">No hay unidades personalizadas agregadas.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Presiona Enter para agregar una unidad. Estas aparecerán en la
                                creación de productos junto a las unidades base.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: CARACTERÍSTICAS (Módulos Toggles) */}
                <TabsContent value="features" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* SECCIÓN: INVENTARIO */}
                        {config.planInfo?.enabledModules?.some(m => ['stock', 'stock_movements'].includes(m)) && (
                            <Card className="md:col-span-2 lg:col-span-3 border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle className="dark:text-blue-400 flex items-center gap-2">
                                        <LayoutGrid className="h-5 w-5" /> Gestión de Inventario
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-3">
                                    {/* Manual Stock Manipulation */}
                                    <div
                                        className={`p-4 rounded-lg border-4 flex flex-col justify-between ${config.enableManualStock ? "border-gray-300/80 dark:bg-blue-900/10" : "bg-slate-50 border-red-500/20 dark:bg-slate-900/50"}`}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Settings2 className="h-5 w-5 text-blue-600" />
                                                    <Label className="font-semibold">
                                                        Edición Manual Stock
                                                    </Label>
                                                </div>
                                                <Switch
                                                    checked={config.enableManualStock ?? true}
                                                    onCheckedChange={(c) =>
                                                        setConfig({ ...config, enableManualStock: c })
                                                    }
                                                />
                                            </div>
                                            <p className="text-xs ">Permite ajustar stock a mano.</p>
                                        </div>
                                    </div>

                                    {/* Reserva Web  */}
                                    <div className="p-4 rounded-lg border-4 flex flex-col justify-between border-blue-500/20 dark:bg-blue-900/10">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                                    <Label className="font-semibold">Reserva Web</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        inputMode="numeric"
                                                        className="w-20 text-center font-bold"
                                                        value={config.webSafetyStock || 0}
                                                        onChange={(e) =>
                                                            setConfig({
                                                                ...config,
                                                                webSafetyStock: parseInt(e.target.value),
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                                Min. en mostrador (no se vende online).
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stock Crítico */}
                                    <div className="md:col-span-3 pt-6 border-t border-blue-100 dark:border-blue-900/30">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 dark:bg-blue-900/5 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-bold flex items-center gap-2">
                                                        Stock Bajo (Umbral)
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            inputMode="numeric"
                                                            className="w-20 text-center font-bold"
                                                            value={config.lowStockThreshold || 0}
                                                            onChange={(e) =>
                                                                setConfig({
                                                                    ...config,
                                                                    lowStockThreshold: parseInt(e.target.value),
                                                                })
                                                            }
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            unidades
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Productos con stock menor a este valor se marcarán en
                                                    amarillo.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                                                        Stock Crítico (Umbral)
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            inputMode="numeric"
                                                            className="w-20 text-center font-bold border-red-200 dark:border-red-900/50"
                                                            value={config.criticalStockThreshold || 0}
                                                            onChange={(e) =>
                                                                setConfig({
                                                                    ...config,
                                                                    criticalStockThreshold: parseInt(
                                                                        e.target.value,
                                                                    ),
                                                                })
                                                            }
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            unidades
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Productos con stock menor a este valor se marcarán en
                                                    rojo.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* SECCIÓN: VENTAS Y CLIENTES */}
                        {config.planInfo?.enabledModules?.includes('shipping') && (
                            <Card className="md:col-span-2 lg:col-span-3 border-l-4 border-l-indigo-500">
                                <CardHeader>
                                    <CardTitle className=" dark:text-indigo-400 flex items-center gap-2">
                                        <Award className="h-5 w-5" /> Fidelización y Envíos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2">
                                    {/* Puntos */}
                                    {config.planInfo?.enabledModules?.includes('events') &&
                                        config.planInfo?.enabledModules?.includes('sales') &&
                                        config.planInfo?.enabledModules?.includes('shipping') &&
                                        config.planInfo?.enabledModules?.some(m => ['stock', 'stock_movements'].includes(m)) && (
                                            <div
                                                className={`p-4 rounded-lg border flex flex-col  border-4 justify-between ${config.enablePoints ? " border-gray-300/80 dark:bg-indigo-900/10" : "bg-slate-50 border-red-500/20 dark:bg-slate-900/50"}`}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div
                                                                className={`p-2 rounded-full ${config.enablePoints ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900" : "bg-slate-100 text-slate-500"}`}
                                                            >
                                                                <Award className="h-4 w-4" />
                                                            </div>
                                                            <Label className="font-semibold">
                                                                Sistema de Puntos
                                                            </Label>
                                                        </div>
                                                        <Switch
                                                            checked={
                                                                activeEvent
                                                                    ? !!activeEvent.pointsEnabled
                                                                    : (config.enablePoints ?? true)
                                                            }
                                                            onCheckedChange={(c) =>
                                                                setConfig({ ...config, enablePoints: c })
                                                            }
                                                            disabled={!!activeEvent}
                                                        />
                                                    </div>

                                                    {config.enablePoints && (
                                                        <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-xs font-bold dark:text-indigo-200">
                                                                    Habilitar Canje
                                                                </Label>
                                                                <Switch
                                                                    checked={config.enablePointsRedemption || false}
                                                                    onCheckedChange={(c) =>
                                                                        setConfig({
                                                                            ...config,
                                                                            enablePointsRedemption: c,
                                                                        })
                                                                    }
                                                                    className="scale-90"
                                                                    disabled={!!activeEvent}
                                                                />
                                                            </div>
                                                            {config.enablePointsRedemption && (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold dark:text-indigo-200">
                                                                        Valor de 1 Punto ($)
                                                                    </Label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">
                                                                            $
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            step="any"
                                                                            inputMode="decimal"
                                                                            className="border border-gray-400 h-8 pl-5 text-xs bg-white text-black dark:bg-slate-950 font-bold w-full"
                                                                            value={config.moneyPerPoint || 0}
                                                                            onChange={(e) =>
                                                                                setConfig({
                                                                                    ...config,
                                                                                    moneyPerPoint: parseFloat(e.target.value),
                                                                                })
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        Cuánto dinero descuenta 1 punto al canjear.
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-bold dark:text-indigo-200">
                                                                    Tasa de obtención (Puntos por $1)
                                                                </Label>
                                                                <div className="relative">
                                                                    <Award className="absolute left-2 top-1.5 h-3 w-3 text-amber-500" />
                                                                    <input
                                                                        type="number"
                                                                        step="any"
                                                                        inputMode="decimal"
                                                                        className="border border-gray-400 h-8 pl-5 text-xs bg-white text-black dark:bg-slate-950 font-bold w-full"
                                                                        value={config.pointsPerCurrency || 0}
                                                                        onChange={(e) =>
                                                                            setConfig({
                                                                                ...config,
                                                                                pointsPerCurrency: parseFloat(e.target.value),
                                                                            })
                                                                        }
                                                                    />
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    Ej: 0.001 significa que $1000 = 1 punto.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeEvent && (
                                                        <div className="flex items-center text-amber-600 text-[10px] bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                                                            <AlertCircle className="h-3 w-3 mr-2" />
                                                            <span>
                                                                Restringido por evento activo:{" "}
                                                                <strong>{activeEvent.name}</strong>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Envíos Toggle Only */}
                                    <div
                                        className={`p-4 rounded-lg border flex flex-col border-4 justify-between ${config.enableShipping ? "border-gray-300/80 dark:bg-indigo-900/10" : "bg-slate-50 border-red-500/20 dark:bg-slate-900/50"}`}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className={`p-2 rounded-full ${config.enableShipping ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900" : "bg-slate-100 text-slate-500"}`}
                                                    >
                                                        <Truck className="h-4 w-4" />
                                                    </div>
                                                    <Label className="font-semibold">
                                                        Envíos a Domicilio
                                                    </Label>
                                                </div>
                                                <Switch
                                                    checked={
                                                        activeEvent?.shippingEnabled === false
                                                            ? false
                                                            : (config.enableShipping ?? true)
                                                    }
                                                    onCheckedChange={(c) =>
                                                        setConfig({ ...config, enableShipping: c })
                                                    }
                                                    disabled={
                                                        activeEvent && activeEvent.shippingEnabled === false
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs ">
                                                    Habilita opciones de envío en el checkout.
                                                </p>
                                                {config.enableShipping !== false && (
                                                    <Button
                                                        className="hover:cursor-pointer"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push("/management/shipping")
                                                        }
                                                    >
                                                        Gestionar Zonas
                                                    </Button>
                                                )}
                                            </div>

                                            {config.enableShipping !== false && (
                                                <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800 space-y-2 animate-in fade-in">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-bold dark:text-indigo-200">Envío Gratis desde ($)</Label>
                                                        <div className="relative w-full">
                                                            <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground">$</span>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                inputMode="decimal"
                                                                className="border border-gray-400 h-8 pl-5 text-xs bg-white text-black dark:bg-slate-950 font-bold w-full"
                                                                value={config.freeShippingThreshold || 0}
                                                                onChange={(e) =>
                                                                    setConfig({
                                                                        ...config,
                                                                        freeShippingThreshold: parseFloat(e.target.value),
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Si el carrito supera este monto, el envío será gratuito.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {activeEvent && activeEvent.shippingEnabled === false && (
                                                <div className="flex items-center text-amber-600 text-xs bg-amber-50 p-2 rounded border border-amber-100">
                                                    <AlertCircle className="h-3 w-3 mr-2" />
                                                    <span>
                                                        Desactivado por evento:{" "}
                                                        <strong>{activeEvent.name}</strong>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* SECCIÓN: SISTEMA */}
                        <Card className="md:col-span-2 lg:col-span-3 border-l-4 border-l-red-500">
                            <CardHeader>
                                <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <Settings className="h-5 w-5" /> Sistema
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`border-4 border-gray-300/80  p-4 rounded-lg border flex flex-col justify-between ${config.maintenanceMode ? "dark:bg-red-900/10" : "bg-slate-50 dark:bg-slate-900/50"}`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <StopCircle className="h-5 w-5 text-red-600" />
                                                <Label className="font-semibold text-red-700 dark:text-red-400">
                                                    Modo Mantenimiento
                                                </Label>
                                            </div>
                                            <Switch
                                                checked={config.maintenanceMode ?? false}
                                                onCheckedChange={(c) =>
                                                    setConfig({ ...config, maintenanceMode: c })
                                                }
                                            />
                                        </div>
                                        <p className="text-sm ">
                                            Cierra el acceso público a la tienda. Solo administradores
                                            podrán acceder.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 3: PAGOS Y ENVÍOS */}
                <TabsContent value="payments" className="space-y-6">
                    {/* FINANCIERA */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración Financiera</CardTitle>
                            <CardDescription>
                                Moneda, impuestos y valores globales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Moneda Base del Sistema</Label>
                                    <Select
                                        value={config.baseCurrency || "ARS"}
                                        onValueChange={(val) =>
                                            setConfig({ ...config, baseCurrency: val })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar moneda base" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-80 overflow-y-auto">
                                            {currencies && currencies.length > 0 ? (
                                                currencies.map((c) => (
                                                    <SelectItem key={`dynamic-${c.code}`} value={c.code}>
                                                        {c.code} ({c.symbol})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-xs text-muted-foreground text-center">
                                                    No hay monedas creadas
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">
                                        Esta es la moneda en la que se guardan los precios en la
                                        base de datos.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Moneda por Defecto (Internacional)</Label>
                                    <Select
                                        value={config.defaultCurrency || "USD"}
                                        onValueChange={(val) =>
                                            setConfig({ ...config, defaultCurrency: val })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar moneda internacional" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-80 overflow-y-auto">
                                            {currencies && currencies.length > 0 ? (
                                                currencies.map((c) => (
                                                    <SelectItem key={`default-${c.code}`} value={c.code}>
                                                        {c.code} ({c.symbol})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-xs text-muted-foreground text-center">
                                                    No hay monedas creadas
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">
                                        Esta es la moneda secundaria que verán los clientes internacionales.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Símbolo de Moneda (Visual)</Label>
                                    <Input
                                        value={config.currencySymbol || "$"}
                                        onChange={(e) =>
                                            setConfig({ ...config, currencySymbol: e.target.value })
                                        }
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                                    <Label>Impuesto General (IVA %)</Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        inputMode="decimal"
                                        value={config.taxRate}
                                        onChange={(e) =>
                                            setConfig({
                                                ...config,
                                                taxRate: parseFloat(e.target.value),
                                            })
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Este porcentaje se aplicará al total si está habilitado.
                                    </p>
                                </div>

                                <div className="space-y-4 md:col-span-2 pt-4 border-t border-border mt-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <Label className="text-base font-semibold">
                                                Tipos de Cambio y Divisas
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Define cuánto equivale 1 unidad de la moneda base (
                                                <span className="font-bold underline text-secondary">
                                                    {config.baseCurrency || "Moneda Base"}
                                                </span>
                                                ) en estas divisas.
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="button"
                                            className="hover:cursor-pointer gap-2"
                                            onClick={() => router.push("/management/settings/currencies")}
                                        >
                                            <Coins className="h-4 w-4 text-amber-500" />
                                            Gestionar Monedas
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {currencies &&
                                            currencies
                                                .filter((c) => (c.code === config.defaultCurrency || c.code === "USD") && c.code !== config.baseCurrency)
                                                .map((c) => (
                                                    <div
                                                        key={c.id}
                                                        className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-2 shadow-sm"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold flex items-center gap-2">
                                                                {c.code}
                                                                <Badge
                                                                    variant={c.isActive ? "default" : "secondary"}
                                                                    className="text-[10px] h-4 leading-3"
                                                                >
                                                                    {c.isActive ? "ACTIVA" : "INACTIVA"}
                                                                </Badge>
                                                            </span>
                                                            <Switch
                                                                checked={c.isActive}
                                                                onCheckedChange={(val) => {
                                                                    const updated = [...currencies];
                                                                    const index = updated.findIndex(
                                                                        (x) => x.id === c.id,
                                                                    );
                                                                    if (index >= 0) updated[index].isActive = val;
                                                                    setCurrencies(updated);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs font-semibold whitespace-nowrap text-muted-foreground w-auto">
                                                                1 {config.baseCurrency} ={" "}
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                onWheel={(e) => e.currentTarget.blur()}
                                                                value={c.exchangeRateToBase}
                                                                onChange={(e) => {
                                                                    const updated = [...currencies];
                                                                    const index = updated.findIndex(
                                                                        (x) => x.id === c.id,
                                                                    );
                                                                    if (index >= 0)
                                                                        updated[index].exchangeRateToBase =
                                                                            parseFloat(e.target.value) || 0;
                                                                    setCurrencies(updated);
                                                                }}
                                                                className="h-8 font-mono bg-background"
                                                            />
                                                            <span className="text-xs text-muted-foreground">
                                                                {c.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                        {(!currencies || currencies.length <= 1) && (
                                            <div className="p-4 border border-dashed rounded-lg bg-slate-50/50 text-center col-span-full">
                                                <p className="text-sm text-muted-foreground">
                                                    No hay otras divisas operativas detectadas en
                                                    plataforma.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* MÉTODOS DE PAGO */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" /> Métodos de Pago Habilitados
                            </CardTitle>
                            <CardDescription>
                                Selecciona qué métodos de pago aceptas en la tienda.
                            </CardDescription>
                            {activeEvent && (
                                <div className="mt-2 flex items-center text-amber-600 text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    <span>
                                        La configuración de pagos está siendo controlada por el
                                        evento activo: <strong>{activeEvent.name}</strong>. Para
                                        editarla, ve al gestor de eventos.
                                    </span>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { id: "CASH", label: "Efectivo", icon: "💵", planKey: "payment_method_cash" },
                                    { id: "CARD", label: "Tarjeta de Crédito", icon: "💳", planKey: "payment_method_card" },
                                    { id: "DEBIT", label: "Tarjeta de Débito", icon: "💳", planKey: "payment_method_debit" },
                                    { id: "TRANSFER", label: "Transferencia", icon: "🏦", planKey: "payment_method_transfer" },
                                    { id: "MERCADO_PAGO", label: "Mercado Pago", icon: "📲", planKey: "payment_method_mercadopago" },
                                    { id: "QR", label: "Pago por QR", icon: "📱", planKey: "payment_method_qr" },
                                ].filter(m => !globalConfig?.planInfo?.enabledModules || globalConfig.planInfo.enabledModules.includes(m.planKey)).map((method) => {
                                    const isEnabled = config.enabledPaymentMethods
                                        ? (config.enabledPaymentMethods as string[]).includes(
                                            method.id,
                                        )
                                        : true;

                                    return (
                                        <div
                                            key={method.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xl">{method.icon}</span>
                                                <Label
                                                    className="cursor-pointer"
                                                    htmlFor={`pm-${method.id}`}
                                                >
                                                    {method.label}
                                                </Label>
                                            </div>
                                            <Switch
                                                id={`pm-${method.id}`}
                                                checked={isEnabled}
                                                disabled={!!activeEvent}
                                                onCheckedChange={(checked) => {
                                                    const current =
                                                        (config.enabledPaymentMethods as string[]) || [];
                                                    const updated = checked
                                                        ? [...current, method.id]
                                                        : current.filter((m) => m !== method.id);

                                                    if (method.id === "TRANSFER") {
                                                        setConfig({
                                                            ...config,
                                                            enabledPaymentMethods: updated,
                                                            enableTransfers: checked,
                                                        });
                                                    } else {
                                                        setConfig({
                                                            ...config,
                                                            enabledPaymentMethods: updated,
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {config.enabledPaymentMethods && (config.enabledPaymentMethods as string[]).includes("TRANSFER") && (
                        <BankAccountsManager config={config} setConfig={setConfig} />
                    )}

                    {config.enabledPaymentMethods && (config.enabledPaymentMethods as string[]).includes("QR") && (
                        <Card className="border-purple-200 dark:border-purple-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 ">
                                    QR Persistente
                                </CardTitle>
                                <CardDescription>
                                    Si está activo, se usará una sola imagen QR para todas las ventas por QR. Si no, deberás subir un QR manualmente en cada venta pendiente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xl">🔁</span>
                                        <div>
                                            <Label className="font-semibold">Habilitar QR Persistente</Label>
                                            <p className="text-xs text-muted-foreground">
                                                El mismo QR se mostrará automáticamente a todos los clientes.
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={config.enablePersistentQr || false}
                                        onCheckedChange={(c) =>
                                            setConfig({ ...config, enablePersistentQr: c })
                                        }
                                    />
                                </div>

                                {config.enablePersistentQr && (
                                    <div className="space-y-3 p-4 border-2 border-dashed border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50/50 dark:bg-purple-900/10">
                                        <Label className="text-sm font-bold text-purple-700 dark:text-purple-300">Imagen QR</Label>
                                        {config.persistentQrUrl ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-center">
                                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700 inline-block">
                                                        <img
                                                            src={config.persistentQrUrl}
                                                            alt="QR Persistente"
                                                            className="max-w-[250px] w-full rounded-md"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <label className="flex-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                try {
                                                                    const { UploadAPI } = await import("@/services/api");
                                                                    const url = await UploadAPI.upload(file);
                                                                    setConfig({ ...config, persistentQrUrl: url });
                                                                    toast({
                                                                        title: "QR actualizado",
                                                                        description: "Recuerda guardar los cambios.",
                                                                    });
                                                                } catch {
                                                                    toast({
                                                                        title: "Error",
                                                                        description: "No se pudo subir la imagen.",
                                                                        variant: "destructive",
                                                                    });
                                                                }
                                                                e.target.value = "";
                                                            }}
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            className="w-full font-bold text-xs border-purple-300 text-purple-700 hover:bg-purple-50 hover:cursor-pointer"
                                                            asChild
                                                        >
                                                            <span>Cambiar Imagen</span>
                                                        </Button>
                                                    </label>
                                                    <Button
                                                        variant="outline"
                                                        className="font-bold text-xs border-red-300 text-red-600 hover:bg-red-50 hover:cursor-pointer"
                                                        onClick={() =>
                                                            setConfig({ ...config, persistentQrUrl: undefined })
                                                        }
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        try {
                                                            const { UploadAPI } = await import("@/services/api");
                                                            const url = await UploadAPI.upload(file);
                                                            setConfig({ ...config, persistentQrUrl: url });
                                                            toast({
                                                                title: "QR subido",
                                                                description: "Recuerda guardar los cambios.",
                                                            });
                                                        } catch {
                                                            toast({
                                                                title: "Error",
                                                                description: "No se pudo subir la imagen.",
                                                                variant: "destructive",
                                                            });
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                />
                                                <Button
                                                    variant="default"
                                                    className="w-full font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white hover:cursor-pointer"
                                                    asChild
                                                >
                                                    <span>Subir Imagen QR</span>
                                                </Button>
                                            </label>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {globalConfig?.planInfo?.enabledModules?.includes("payment_method_whatsapp") && (
                        <Card className="border-green-200 dark:border-green-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 ">
                                    Número de WhatsApp
                                </CardTitle>
                                <CardDescription>
                                    Ingresa el número donde recibirás los pedidos. Formato internacional (Ej: 549112345678).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Número telefónico</Label>
                                    <Input
                                        placeholder="Ej: 549112345678"
                                        value={config.whatsappNumber || ""}
                                        onChange={(e) =>
                                            setConfig({ ...config, whatsappNumber: e.target.value })
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </TabsContent>

                {/* TAB 4: SEGURIDAD Y RESPALDOS */}
                {config.planInfo?.enabledModules?.includes('backups') && (
                    <TabsContent value="security" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-green-600" /> Copias de
                                    Seguridad de Base de Datos
                                </CardTitle>
                                <CardDescription>
                                    Configura respaldos automáticos o descarga una copia de
                                    seguridad manualmente para proteger tus datos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-6 p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/40">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Respaldos Automáticos</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Genera archivos JSON ZIP en el directorio local del
                                                    servidor.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={config.enableAutoBackup}
                                                onCheckedChange={(v) =>
                                                    setConfig({ ...config, enableAutoBackup: v })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Frecuencia de Respaldo</Label>
                                            <Select
                                                disabled={!config.enableAutoBackup}
                                                value={config.backupFrequency || "WEEKLY"}
                                                onValueChange={(v: any) =>
                                                    setConfig({ ...config, backupFrequency: v })
                                                }
                                            >
                                                <SelectTrigger className="w-full md:w-[250px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="DAILY">
                                                        Diario (Todos los días 2:00 AM)
                                                    </SelectItem>
                                                    <SelectItem value="WEEKLY">
                                                        Semanal (Domingos)
                                                    </SelectItem>
                                                    <SelectItem value="MONTHLY">
                                                        Mensual (Día 1 del mes)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold mb-1">
                                            Descarga Manual
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Exportar toda la base de datos al instante. Dependiendo del
                                            volumen de datos puede tardar varios segundos.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleDownloadBackup}
                                        variant="outline"
                                        className="gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:cursor-pointer"
                                    >
                                        <Archive className="h-4 w-4" />
                                        Generar y Descargar Respaldo Ahora
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* TAB 5: TICKET Y FACTURA */}
                {config.planInfo?.enabledModules?.includes('custom_ticket') && (
                    <TabsContent value="ticket" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                        <Printer className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle>Personalización de Comprobantes</CardTitle>
                                        <CardDescription>
                                            Configura el diseño y mensajes de tus tickets y facturas.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Mensaje al pie del ticket</Label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={config.ticketFooter || ""}
                                            onChange={(e) =>
                                                setConfig({ ...config, ticketFooter: e.target.value })
                                            }
                                            placeholder="Ej: ¡Gracias por su compra! Tienes 30 días para cambios..."
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/40">
                                        <div className="space-y-0.5">
                                            <Label>Mostrar logo en el ticket impreso</Label>
                                            <p className="text-sm text-muted-foreground">
                                                El logo debe estar configurado en la pestaña "General".
                                            </p>
                                        </div>
                                        <Switch
                                            checked={config.showLogoOnTicket}
                                            onCheckedChange={(c) =>
                                                setConfig({ ...config, showLogoOnTicket: c })
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/40">
                                        <div className="space-y-0.5">
                                            <Label>Mostrar logo en facturas A/B/C</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Aplica a los PDFs generados.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={config.showLogoOnInvoice}
                                            onCheckedChange={(c) =>
                                                setConfig({ ...config, showLogoOnInvoice: c })
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* TAB 6: APARIENCIA */}
                {config.planInfo?.enabledModules?.includes('custom_theme') && (
                    <TabsContent value="appearance" className="space-y-6">
                        <ThemeColorsManager config={config} setConfig={setConfig} />
                    </TabsContent>
                )}

                {/* TAB 7: ACCESO */}
                {user?.role?.name === 'SUPER_ADMIN' && config.planInfo?.enabledModules?.includes('access_control') && (
                    <TabsContent value="access" className="space-y-6">
                        <AccessControlManager config={config} setConfig={setConfig} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
