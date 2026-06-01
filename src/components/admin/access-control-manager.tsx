"use client";

import { StoreConfig } from "@/types/extended";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserCog, Users, Lock, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminNavigation } from "@/config/admin-navigation";

export function AccessControlManager({
    config,
    setConfig,
}: {
    config: Partial<StoreConfig>;
    setConfig: (config: Partial<StoreConfig>) => void;
}) {
    const rolePermissions = config.rolePermissions || {
        ADMIN: {},
        EMPLOYEE: {},
    };

    const togglePermission = (role: string, key: string) => {
        const newPermissions = { ...rolePermissions };
        if (!newPermissions[role]) newPermissions[role] = {};
        
        // Default to true if undefined
        const currentValue = rolePermissions[role]?.[key] !== false;
        
        newPermissions[role] = {
            ...newPermissions[role],
            [key]: !currentValue,
        };
        setConfig({ ...config, rolePermissions: newPermissions });
    };

    const permissionItems = [
        { key: "dashboard", label: "Dashboard / Inicio" },
        { key: "reports", label: "Reportes y Estadísticas" },
        { key: "branches", label: "Gestión de Sucursales" },
        { key: "products", label: "Catálogo de Productos" },
        { key: "users", label: "Gestión de Usuarios" },
        { key: "stock", label: "Módulo de Stock (Vista General)" },
        { key: "stock_control", label: "Control de Inventario" },
        { key: "stock_movements", label: "Movimientos entre Sucursales" },
        { key: "purchases", label: "Compras y Proveedores" },
        { key: "sales", label: "Ventas y Facturación" },
        { key: "administration", label: "Administración (Cat, Cup, Desc)" },
        { key: "shipping", label: "Configuración de Envíos" },
        { key: "payment_gateways", label: "Pasarelas de Pago" },
        { key: "comments", label: "Moderación de Comentarios" },
        { key: "events", label: "Gestión de Eventos / Banners" },
        { key: "bot_assistant", label: "Configuración Asistente Bot" },
        { key: "blog", label: "Gestión del Blog" },
        { key: "web_content", label: "Contenido Web / Estático" },
        { key: "settings", label: "Configuración del Sistema" },
        { key: "audit", label: "Auditoría de Acciones" },
        { key: "alerts", label: "Alertas de Sistema" },
    ];

    const RolePanel = ({ role, icon: Icon, title }: { role: string; icon: any; title: string }) => (
        <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
                <Icon className="h-5 w-5 text-secondary" />
                <h3 className="font-bold text-lg">{title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {permissionItems.map((item) => (
                    <div
                        key={item.key}
                        className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                        <Checkbox
                            id={`${role}-${item.key}`}
                            checked={rolePermissions[role]?.[item.key] !== false}
                            onCheckedChange={() => togglePermission(role, item.key)}
                        />
                        <Label
                            htmlFor={`${role}-${item.key}`}
                            className="flex-1 text-sm font-medium leading-none cursor-pointer"
                        >
                            {item.label}
                        </Label>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t">
                <div className="flex items-center space-x-3 p-4 rounded-xl border-2 border-dashed border-secondary/30 bg-secondary/5">
                    <Checkbox
                        id={`${role}-onlyOwnSales`}
                        checked={!!rolePermissions[role]?.onlyOwnSales}
                        onCheckedChange={() => togglePermission(role, "onlyOwnSales")}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label
                            htmlFor={`${role}-onlyOwnSales`}
                            className="text-sm font-bold leading-none cursor-pointer flex items-center gap-2"
                        >
                            Restringir Vista de Ventas <Lock className="h-3 w-3" />
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Si se activa, el {title.toLowerCase()} solo podrá ver las ventas que él mismo haya procesado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Card className="border-secondary/20 shadow-lg overflow-hidden">
            <CardHeader className="bg-secondary/5 border-b border-secondary/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                        <CardTitle>Control de Accesos (RBAC)</CardTitle>
                        <CardDescription>
                            Define qué secciones del panel son visibles y accesibles para cada nivel de usuario.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <Tabs defaultValue="ADMIN" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 h-12">
                        <TabsTrigger value="ADMIN" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <UserCog className="h-4 w-4" /> Administradores
                        </TabsTrigger>
                        <TabsTrigger value="EMPLOYEE" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Users className="h-4 w-4" /> Empleados
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ADMIN" className="mt-0 focus-visible:outline-none">
                        <RolePanel role="ADMIN" icon={UserCog} title="Administrador" />
                    </TabsContent>

                    <TabsContent value="EMPLOYEE" className="mt-0 focus-visible:outline-none">
                        <RolePanel role="EMPLOYEE" icon={Users} title="Empleado" />
                    </TabsContent>
                </Tabs>

                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex gap-3 items-start text-amber-800 dark:text-amber-200">
                    <div className="mt-0.5">
                        <ChevronRight className="h-4 w-4 rotate-90" />
                    </div>
                    <div className="text-xs space-y-1">
                        <p className="font-bold">Nota de Seguridad:</p>
                        <p>Los cambios se aplican globalmente. El rol <span className="font-bold underline">SUPER_ADMIN</span> siempre mantendrá acceso total a todas las secciones e ignorará estas restricciones por diseño.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
