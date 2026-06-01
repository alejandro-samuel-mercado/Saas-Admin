
import {
    AlertCircle,
    Archive,
    ArrowLeftRight,
    Bot,
    Calendar,
    CirclePercent,
    DollarSign,
    FileText,
    Globe,
    LayoutDashboard,
    MessageSquare,
    Package,
    PieChart,
    Settings,
    ShoppingCart,
    Store,
    Tags,
    TicketPercent,
    Truck,
    Users, BadgeDollarSign, Wrench
} from "lucide-react"

export interface NavItem {
    title: string
    href?: string
    icon: any
    active?: boolean
    roles: string[]
    hidden?: boolean
    children?: NavItem[]
    permissionKey?: string
    moduleKey?: string
    condition?: (config: any) => boolean
}

export const adminNavigation: NavItem[] = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/management",
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        permissionKey: 'dashboard'
    },
    {
        title: "Reportes",
        icon: PieChart,
        href: "/management/reports",
        roles: ['SUPER_ADMIN', 'ADMIN'],
        permissionKey: 'reports',
        moduleKey: 'reports'
    },
    {
        title: "Sucursales",
        icon: Store,
        href: "/management/settings/branches",
        roles: ['SUPER_ADMIN'],
        permissionKey: 'branches',
        moduleKey: 'branches'
    },
    {
        title: "Productos",
        icon: Package,
        href: "/management/products",
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        permissionKey: 'products'
    },
    {
        title: "Usuarios",
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        permissionKey: 'users',
        moduleKey: 'users',
        children: [
            {
                title: "Clientes",
                href: "/management/users?role=CUSTOMER",
                icon: Users,
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']
            },
            {
                title: "Empleados",
                href: "/management/users?role=EMPLOYEE",
                icon: Users,
                roles: ['SUPER_ADMIN', 'ADMIN'],
                condition: (config) => !!config?.planInfo?.features?.allowPOS && !!config?.planInfo?.enabledModules?.includes('sales')
            },
            {
                title: "Administradores",
                href: "/management/users?role=ADMIN",
                icon: Users,
                roles: ['SUPER_ADMIN'],
                condition: (config) => !!config?.planInfo?.enabledModules?.includes('branches')
            },
            {
                title: "Super Admins",
                href: "/management/users?role=SUPER_ADMIN",
                icon: Users,
                roles: ['SUPER_ADMIN']
            }
        ]
    },
   
    {
        title: "Stock",
        icon: Archive,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        permissionKey: 'stock',
        children: [
            {
                title: "Control",
                icon: Archive,
                href: "/management/stock-control",
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
                permissionKey: 'stock_control'
            },
            {
                title: "Movimientos",
                icon: ArrowLeftRight,
                href: "/management/transfers",
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
                permissionKey: 'stock_movements',
                moduleKey: 'stock_movements'
            },
        ]
    },
    {
        title: "Compras",
        icon: BadgeDollarSign,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        permissionKey: 'purchases',
        children: [
            {
                title: "Proveedores",
                icon: Users,
                href: "/management/suppliers",
                roles: ['SUPER_ADMIN'],
                moduleKey: 'suppliers'
            },
             {
                title: "Órdenes de Compra",
                icon: FileText, 
                href: "/management/purchases",
                roles: ['SUPER_ADMIN', 'ADMIN'],
                moduleKey: 'purchase_orders'
            },
            {
                title: "Pagos a Proveedores",
                icon: DollarSign,
                href: "/management/supplier-payments",
                roles: ['SUPER_ADMIN', 'ADMIN'],
                moduleKey: 'supplier_payments'
            },
            {
                title: "Otros Gastos",
                icon: FileText,
                href: "/management/expenses",
                roles: ['SUPER_ADMIN', 'ADMIN'],
                moduleKey: 'expenses'
            }
        ]
    },
    {
        title: "Ventas",
        icon: ShoppingCart,
        href: "/management/sales",
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        permissionKey: 'sales',
        moduleKey: 'sales'
    },
     {
        title: "Administración",
        icon:  Wrench, 
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'], 
        permissionKey: 'administration',
        children: [
            {
                title: "Categorías",
                icon: Tags,
                href: "/management/categories",
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']
            },
            {
                title: "Cupones",
                icon: TicketPercent,
                href: "/management/coupons",
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
                moduleKey: 'coupons'
            },
            {
                title: "Descuentos",
                icon: CirclePercent,
                href: "/management/discounts",
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
                moduleKey: 'discounts'
            },
          
        ]
    },
      {
                title: "Envíos",
                icon: Truck,
                href: "/management/shipping",
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
                permissionKey: 'shipping',
                moduleKey: 'shipping'
            },
            {
                title: "Pasarelas de Pago",
                icon: DollarSign,
                href: "/management/settings/gateways",
                roles: ['SUPER_ADMIN'],
                permissionKey: 'payment_gateways',
                moduleKey: 'payment_gateways'
            },
    {
        title: "Comentarios",
        icon: MessageSquare,
        href: "/management/comments",
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        permissionKey: 'comments'
    },
    {
        title: "Eventos",
        icon: Calendar,
        href: "/management/events",
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        permissionKey: 'events',
        moduleKey: 'events'
    },
      {
                title: "Asistente Bot",
                href: "/management/bot",
                icon: Bot,
                roles: ['SUPER_ADMIN', 'ADMIN'],
                permissionKey: 'bot_assistant',
                moduleKey: 'bot'
            },
              {
                title: "Blog",
                href: "/management/content/blog",
                icon: FileText,
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
                permissionKey: 'blog',
                moduleKey: 'blog'
            },
    {
        title: "Contenido Web",
        href: "/management/content",
                icon: Globe,
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
                permissionKey: 'web_content',
                moduleKey: 'web_content'
    },
    {
        title: "Configuración",
         href: "/management/settings",
                icon: Settings,
        roles: ['SUPER_ADMIN'],
        permissionKey: 'settings'
    },
    {
        title: "Auditoría",
        href: "/management/system/audit",
        icon: FileText,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        hidden: true,
        permissionKey: 'audit',
        moduleKey: 'audit'
    },
    {
        title: "Alertas",
        href: "/management/system/alerts",
        icon: AlertCircle,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        hidden: true,
        permissionKey: 'alerts',
        moduleKey: 'alerts'
    },
]
