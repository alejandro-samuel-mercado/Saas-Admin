"use client"

import { ProductForm } from "@/components/management/products/product-form"
import { SkuManager } from "@/components/management/products/sku-manager"
import { BarcodePrintButton } from "@/components/printing/barcode-labels"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { ProductsAPI } from "@/services/api"
import { useBranchStore } from "@/store/branch.store"
import { useConfigStore } from "@/store/config.store"
import { useAuthStore } from "@/store/use-auth-store"
import { Product, UserRole } from "@/types/schema"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Boxes, Calendar, Edit, Package, QrCode, Tag, Trash, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProductDetailsClientProps {
    id: string;
    initialData?: Product;
}

export function ProductDetailsClient({ id, initialData }: ProductDetailsClientProps) {
    const router = useRouter()
    const { user } = useAuthStore()
    const { config } = useConfigStore()
    const { activeBranch } = useBranchStore()
    const currentUserRole = (user?.role?.name || 'EMPLOYEE') as UserRole

    const [showEdit, setShowEdit] = useState(false)
    const [showSkuManager, setShowSkuManager] = useState(false)

    const { data: product, isLoading, refetch } = useQuery({
        queryKey: ['product', id, activeBranch?.id],
        queryFn: () => ProductsAPI.getOne(Number(id), activeBranch?.id),
        initialData: initialData,
    })

    const handleDeleteProduct = async () => {
        if (!product) return
        if (!confirm("¿Está seguro de eliminar este producto y todas sus variantes? Esta acción no se puede deshacer.")) return

        try {
            await ProductsAPI.delete(product.id)
            router.push('/management/products')
        } catch (error: any) {
            alert(error.response?.data?.message || "Error al eliminar producto")
        }
    }

    if (isLoading && !product) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-background">
                <h2 className="text-xl font-semibold text-foreground">Producto no encontrado</h2>
                <Button variant="outline" onClick={() => router.back()} className="hover:cursor-pointer">Volver</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background sm:p-6 p-2 pt-3 md:p-8 space-y-8 mb-40 sm:mb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full border-border bg-background shadow-sm hover:bg-muted text-foreground hover:cursor-pointer">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                            <Badge variant={product.isActive ? 'default' : 'secondary'} className={product.isActive ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                                {product.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {product.isNew && <Badge className="bg-secondary hover:bg-secondary/90">Nuevo</Badge>}
                            {product.isTrending && <Badge className="bg-borderH hover:bg-purple-600">Tendencia</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">ID: {product.id}</span>
                            <span>•</span>
                            <span>Actualizado: {new Date(product.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {currentUserRole !== 'EMPLOYEE' && (
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => setShowEdit(true)} className="bg-background hover:bg-muted border-border text-foreground shadow-sm hover:cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" /> Editar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProduct} className="shadow-sm hover:cursor-pointer">
                            <Trash className="h-4 w-4 mr-2" /> Eliminar
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Galeria */}
                    <Card className="border-border shadow-sm overflow-hidden bg-card">
                        <div className="grid md:grid-cols-2">
                            <div className="bg-muted aspect-square flex items-center justify-center border-r border-border">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
                                ) : (
                                    <Package className="h-20 w-20 text-muted-foreground" />
                                )}
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Precio Base</h3>
                                    <div className="text-3xl font-bold text-foreground mt-1">
                                        {formatCurrency(product.basePrice, config?.baseCurrency || 'USD')}
                                        <span className="text-lg font-normal text-muted-foreground ml-1">/ {product.measurementUnit}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {product.allowFractional ? 'Permite fraccionamiento' : 'Solo unidades enteras'}
                                    </p>
                                </div>

                                <Separator className="bg-border" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-medium text-muted-foreground uppercase">Marca</h4>
                                        <p className="font-medium text-foreground">{product.brand || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-muted-foreground uppercase">Modelo</h4>
                                        <p className="font-medium text-foreground">{product.model || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-muted-foreground uppercase">Tipo</h4>
                                        <p className="font-medium text-foreground">{product.type}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-muted-foreground uppercase">Categoría</h4>
                                        <p className="font-medium text-foreground bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded inline-block">
                                            {product.category?.name || 'Sin Categoría'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Puntos</h4>
                                    <div className="flex gap-4">

                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-md text-sm font-medium border border-emerald-100 dark:border-emerald-800">
                                            Gana: {product.pointsReward} pts
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Description */}
                    <Card className="border-border shadow-sm bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg text-foreground">Descripción</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {product.description || 'Sin descripción disponible.'}
                            </p>
                        </CardContent>
                    </Card>

                    {product.characteristics && product.characteristics.length > 0 && (
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader>
                                <CardTitle className="text-lg text-foreground">Características</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full">
                                    <tbody className="divide-y divide-border">
                                        {product.characteristics.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="py-2 font-medium text-muted-foreground w-1/3">{item.key}</td>
                                                <td className="py-2 text-foreground">{item.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}

                    {product.specifications && product.specifications.length > 0 && (
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader>
                                <CardTitle className="text-lg text-foreground">Especificaciones</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full">
                                    <tbody className="divide-y divide-border">
                                        {product.specifications.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="py-2 font-medium text-muted-foreground w-1/3">{item.key}</td>
                                                <td className="py-2 text-foreground">{item.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}
                    {/* SKUs / Variants */}
                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 py-4">
                            <div className="space-y-1">
                                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                                    <Boxes className="h-5 w-5 text-indigo-500" />
                                    Variantes y Stock
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">Gestiona el inventario por SKU</CardDescription>
                            </div>
                            {currentUserRole !== 'EMPLOYEE' && (
                                <Button onClick={() => setShowSkuManager(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white hover:cursor-pointer">
                                    Gestionar Variantes
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground font-medium uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Código SKU</th>
                                        <th className="px-6 py-3">Código Barras</th>
                                        <th className="px-6 py-3">Atributos</th>
                                        <th className="px-6 py-3">Precio</th>
                                        <th className="px-6 py-3">Stock</th>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3 text-right">Codigo de barras</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {product.skus?.map((sku: any) => (
                                        <tr key={sku.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-foreground font-medium">{sku.code}</td>
                                            <td className="px-6 py-4 font-mono text-muted-foreground text-xs">
                                                {sku.barcode ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground font-medium">{sku.barcode}</span>
                                                        <span className="text-[10px]">{sku.barcodeType}</span>
                                                    </div>
                                                ) : (
                                                    <span className="italic opacity-50">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {sku.variantOptions?.map((v: any) => (
                                                    <span key={v.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground mr-2 border border-border">
                                                        {v.name}: {v.value}
                                                    </span>
                                                ))}
                                                {(!sku.variantOptions || sku.variantOptions.length === 0) && <span className="text-muted-foreground italic">Por defecto</span>}
                                            </td>
                                            <td className="px-6 py-4 text-foreground font-medium">{config?.currencySymbol || "$"}{sku.price}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={sku.stock > 0 ? 'outline' : 'destructive'} className={sku.stock > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : ''}>
                                                    {sku.stock} unid.
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {sku.soldQuantity > 0 ? (
                                                    <span className="flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                                        <TrendingUp className="h-3 w-3 mr-1" /> {sku.soldQuantity} vendidos
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Sin ventas</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <BarcodePrintButton skus={[{ ...sku, product }]} />
                                            </td>
                                        </tr>
                                    ))}
                                    {(!product.skus || product.skus.length === 0) && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground italic">
                                                No hay variantes registradas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar (Right) */}
                <div className="space-y-6">

                    <Card className="border-border shadow-sm bg-card">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">Detalles Adicionales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <QrCode className="h-4 w-4" /> Código QR / ID Rápido
                                </span>
                                <span className="text-sm font-mono font-medium text-foreground">{product.qr || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Tag className="h-4 w-4" /> Condición/ Estado
                                </span>
                                <span className="text-sm font-medium text-foreground">{product.condition === "NEW" ? "Nuevo" : product.condition === "USED" ? "Usado" : product.condition === "REFURBISHED" ? "Reacondicionado" : product.condition}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Creado
                                </span>
                                <span className="text-sm text-foreground">{new Date(product.createdAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>


                    <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900">
                        <CardContent className="p-4">
                            <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium mb-1">Total Stock (Todas variantes)</p>
                            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                                {product.skus?.reduce((acc: number, s: any) => acc + Number(s.stock), 0)} <span className="text-sm font-normal text-indigo-600 dark:text-indigo-400">{product.measurementUnit}</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900">
                        <CardContent className="p-4">
                            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium mb-1">Ventas Totales</p>
                            <p className="text-2xl font-bold text-emerald-900 dark:text-indigo-100">
                                {product.skus?.reduce((acc: number, s: any) => acc + Number(s.soldQuantity), 0)} <span className="text-sm font-normal text-emerald-600 dark:text-emerald-400">unid.</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modales */}
            {product && (
                <>
                    <ProductForm
                        open={showEdit}
                        onOpenChange={setShowEdit}
                        product={product}
                        onSave={async (updated: any) => {
                            await ProductsAPI.update(product.id, updated)
                            refetch()
                            setShowEdit(false)
                        }}
                    />
                    <SkuManager
                        open={showSkuManager}
                        onOpenChange={setShowSkuManager}
                        product={product}
                        onUpdate={refetch}
                    />
                </>
            )}
        </div>
    )
}
