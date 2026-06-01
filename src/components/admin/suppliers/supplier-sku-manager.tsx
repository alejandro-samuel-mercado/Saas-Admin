"use client"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import api from "@/services/api"
import { SupplierSKU, supplierService } from "@/services/supplier.service"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"


interface SupplierSkuManagerProps {
    supplierId: number
    initialSkus?: SupplierSKU[]
}

export function SupplierSkuManager({ supplierId, initialSkus = [] }: SupplierSkuManagerProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [skus, setSkus] = useState<SupplierSKU[]>(initialSkus)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null)
    const [skuCodeSearch, setSkuCodeSearch] = useState("")
    const [price, setPrice] = useState("")
    const [currency, setCurrency] = useState("")
    
    const [searchResults, setSearchResults] = useState<any[]>([])

    const [confirmId, setConfirmId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)

    const searchSkus = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([])
            return
        }
        try {
            const { data } = await api.get(`/skus?search=${query}`)
            setSearchResults(data.data || [])
        } catch (error) {
          
        }
    }

    useEffect(() => {
        const fetchBaseCurrency = async () => {
            try {
                const { data } = await api.get('/config/public');
                if (data?.data?.baseCurrency || data?.baseCurrency) {
                    setCurrency(data?.data?.baseCurrency || data?.baseCurrency);
                }
            } catch (error) {}
        }
        fetchBaseCurrency();
    }, []);


    useEffect(() => {
        if (!skuCodeSearch) {
            setSearchResults([])
            return
        }
        const timer = setTimeout(() => {
            searchSkus(skuCodeSearch)
        }, 500)

        return () => clearTimeout(timer)
    }, [skuCodeSearch])

    const handleAddSku = async () => {
        if (!selectedSkuId) return

        try {
            setLoading(true)
            await supplierService.addSku(supplierId, {
                skuId: selectedSkuId,
                supplierSkuCode: "", 
                basePurchasePrice: price ? parseFloat(price) : null,
                currency: currency || null,
                estimatedDeliveryDays: 7
            })
            
            toast({ title: "SKU agregado al catálogo" })
            setOpen(false)
            
            router.refresh()
           
            window.dispatchEvent(new CustomEvent('supplier-data-changed'))
        } catch (error: any) {
             toast({ 
                title: "Error", 
                description: error.response?.data?.message || "No se pudo agregar",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (skuId: number) => {
        setConfirmId(skuId)
    }

    const confirmRemove = async () => {
        if (!confirmId) return
        try {
            setDeleting(true)
            await supplierService.removeSku(supplierId, confirmId)
            setSkus(prev => prev.filter(s => s.skuId !== confirmId))
            toast({ title: "SKU desvinculado" })
        } catch (error) {
             toast({ title: "Error al eliminar", variant: "destructive" })
        } finally {
            setDeleting(false)
            setConfirmId(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-foreground">Catálogo de Productos</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="hover:cursor-pointer">
                            <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-border text-foreground sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Agregar Producto al Catálogo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Buscar Producto (Nombre o SKU)</Label>
                                <Input 
                                    placeholder="Escribe para buscar..." 
                                    onChange={(e) => setSkuCodeSearch(e.target.value)}
                                    className="bg-background border-input"
                                />
                                {searchResults.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto border border-border rounded-md bg-popover p-1 shadow-md space-y-1">
                                        {searchResults.map((item: any) => {
                                            const variantText = item.variantOptions?.length > 0 
                                                ? ` (${item.variantOptions.map((v: any) => v.value).join(', ')})`
                                                : '';
                                            return (
                                                <div 
                                                    key={item.id} 
                                                    className={`p-3 text-sm cursor-pointer hover:bg-muted rounded-md border border-transparent transition-colors ${selectedSkuId === item.id ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'text-foreground'}`}
                                                    onClick={() => {
                                                        setSelectedSkuId(item.id)
                                                        const defaultPrice = item.costPrice || item.price || 0;
                                                        if (defaultPrice) {
                                                            setPrice(defaultPrice.toString());
                                                        }
                                                    }}
                                                >
                                                    <div className="font-mono text-xs font-bold opacity-70">{item.code}</div>
                                                    <div className="font-medium">{item.product?.name}{variantText}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Precio de Compra Base</Label>
                                    <Input 
                                        type="number" step="any" 
                                        placeholder="0.00" 
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="bg-background border-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Moneda</Label>
                                    <Input value={currency} onChange={e => setCurrency(e.target.value)} className="bg-background border-input" />
                                </div>
                            </div>
                            <Button onClick={handleAddSku} disabled={loading || !selectedSkuId} className="w-full hover:cursor-pointer">
                                {loading ? "Agregando..." : "Agregar al Catálogo"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                 <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-muted/50 border-border">
                            <TableHead className="text-muted-foreground font-semibold">SKU</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Producto / Variante</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Precio Base</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Moneda</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {skus.map((item) => {
                            const variantText = item.sku?.variantOptions && item.sku?.variantOptions.length > 0 
                                ? ` (${item.sku.variantOptions.map((v: any) => v.value).join(', ')})`
                                : '';
                            return (
                                <TableRow key={item.skuId} className="hover:bg-muted/50 border-border">
                                    <TableCell className="font-mono font-medium text-foreground">{item.sku.code}</TableCell>
                                    <TableCell className="text-foreground font-medium">
                                        {item.sku.product.name}
                                        {variantText && <span className="text-muted-foreground font-normal ml-1">{variantText}</span>}
                                    </TableCell>
                                    <TableCell className="font-mono font-bold text-emerald-600">{item.precio_compra_base}</TableCell>
                                <TableCell className="text-muted-foreground font-bold">{item.moneda}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(item.skuId)} className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            );
                         })}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog 
                open={confirmId !== null}
                onOpenChange={(open) => !open && setConfirmId(null)}
                title="Desvincular Producto"
                description="¿Estás seguro de que deseas desvincular este producto del proveedor?"
                confirmText="Desvincular"
                variant="destructive"
                onConfirm={confirmRemove}
                loading={deleting}
            />
        </div>
    )
}
