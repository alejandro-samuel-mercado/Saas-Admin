"use client"

import { BarcodePrintButton } from "@/components/printing/barcode-labels"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { ProductsAPI } from "@/services/api"
import { useConfigStore } from "@/store/config.store"
import { useAuthStore } from "@/store/use-auth-store"
import { Product } from "@/types/schema"
import {
      ArrowLeft,
      Boxes,
      Calendar,
      Edit,
      Package,
      QrCode,
      Tag,
      Trash,
      TrendingUp
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ProductForm } from "../../../../components/management/products/product-form"
import { SkuManager } from "../../../../components/management/products/sku-manager"

export  function ProductDetailsClient() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [showEdit, setShowEdit] = useState(false)
    const [showSkuManager, setShowSkuManager] = useState(false)
    
    const { config } = useConfigStore()
    const { toast } = useToast()
    const { user } = useAuthStore()
    const router = useRouter()

    const currentUserRole = user?.role?.name || user?.role

    const fetchProduct = async () => {
        if (!id) return
        try {
            setLoading(true)
            const data = await ProductsAPI.getOne(parseInt(id))
            setProduct(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo cargar el producto.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProduct()
    }, [id])

    const handleDeleteProduct = async () => {
        if (!product || !confirm('¿Estás seguro de eliminar este producto y todas sus variantes?')) return
        try {
            await ProductsAPI.delete(product.id)
            toast({
                title: "Producto eliminado",
                description: "El producto se eliminó correctamente."
            })
            router.push('/management/products')
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo eliminar el producto.",
                variant: "destructive"
            })
        }
    }

    const refetch = () => fetchProduct()

    if (loading) return (
        <div className="flex h-[400px] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    )

    if (!product) return (
        <div className="p-8 text-center text-muted-foreground">
            No se encontró el producto.
        </div>
    )

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto pt-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push('/management/products')}
                        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver al listado
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
                        <Badge variant={product.isActive ? "default" : "secondary"} className={product.isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                            {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                </div>

                {currentUserRole !== 'EMPLOYEE' && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setShowEdit(true)} className="shadow-sm hover:cursor-pointer border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                            <Edit className="h-4 w-4 mr-2" /> Editar General
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
                                        {formatCurrency(product.basePrice, config?.baseCurrency || 'USD', config?.currencySymbol)}
                                        <span className="text-lg font-normal text-muted-foreground ml-1">/ {product.measurementUnit}</span>
                                    </div>
                                    {(product.costPrice || (product.skus && product.skus[0]?.costPrice)) ? (
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            Costo Ref: <span className="font-medium text-foreground">{formatCurrency(Number(product.costPrice || product.skus?.[0]?.costPrice), config?.baseCurrency || 'USD', config?.currencySymbol)}</span>
                                        </div>
                                    ) : null}
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
                </div>

                {/* Sidebar (Right) */}
                <div className="space-y-6">
                    <Card className="border-border shadow-sm bg-card">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">Detalles Adicionales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex flex-col py-4 border-b border-border gap-3">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <QrCode className="h-4 w-4" /> Código QR / ID Rápido
                                </span>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="bg-white p-2 rounded-lg border border-border shadow-sm">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(product.qr || product.skus?.[0]?.barcode || product.skus?.[0]?.code || product.id)}&size=120x120`} 
                                            alt="QR Code"
                                            className="w-24 h-24"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1">
                                        <span className="text-sm font-mono font-bold text-foreground bg-muted p-2 rounded text-center outline-1 outline-dashed outline-border">
                                            {product.qr || 'N/A'}
                                        </span>
                                    </div>
                                </div>
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

            {/* SKUs / Variants (Full Width) */}
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
                                <th className="px-6 py-3"> Costo de compra</th>
                                <th className="px-6 py-3">Stock</th>
                                <th className="px-6 py-3">Ventas</th>
                                <th className="px-20 py-3 text-right">Imprimir</th>
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
                                    <td className="px-6 py-4 text-foreground font-medium">{formatCurrency(sku.price, config?.baseCurrency || 'USD', config?.currencySymbol)}</td>
                                    <td className="px-6 py-4 text-foreground font-medium">{formatCurrency(sku.costPrice || 0, config?.baseCurrency || 'USD', config?.currencySymbol)}</td>
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
                                        <div className="flex justify-end gap-2">
                                            <BarcodePrintButton skus={[{ ...sku, product }]} fillPage={true} type="BARCODE"/>
                                            <BarcodePrintButton skus={[{ ...sku, product }]} fillPage={true} type="QR" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!product.skus || product.skus.length === 0) && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground italic">
                                        No hay variantes registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

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
