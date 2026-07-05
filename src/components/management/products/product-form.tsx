
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import { CategoriesAPI, ConfigAPI, CurrenciesAPI, ProductsAPI } from "@/services/api"
import { useConfigStore, useRubro } from "@/store/config.store"
import { Category, Condition, Currency, Product, SaleMode } from "@/types/schema"
import { Plus, X, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProductFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product?: Product
    onSave: (product: Partial<Product>, manualPrices?: any[]) => void
}

export function ProductForm({ open, onOpenChange, product, onSave }: ProductFormProps) {
    const { config } = useConfigStore()
    const [formData, setFormData] = useState<Partial<Product>>(product || {
        name: "",
        description: "",
        basePrice: 0,
        costPrice: 0,
        isActive: true,
        isNew: true,
        pointsReward: 0,
        brand: "",
        model: "",
        measurementUnit: "UNIDAD",
        allowFractional: false,
        type: "Producto",
        categoryId: undefined,
        condition: "NEW",
        qr: "",
        isTrending: false,
        isRecommended: false,
        images: [],
        taxRate: undefined,
        saleMode: "VENTA"
    })
    const [customUnits, setCustomUnits] = useState<string[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [activeTab, setActiveTab] = useState("general")
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [baseCurrency, setBaseCurrency] = useState('')
    const [manualPrices, setManualPrices] = useState<{ currencyCode: string, price: number }[]>([])
    const [loading, setLoading] = useState(false)
    const rubro = useRubro()
    const formConfig = rubro?.productFormConfig

    const router = useRouter()

    const loadCurrencies = async () => {
        try {
            const data = await CurrenciesAPI.getAll(true)
            setCurrencies(data)

            const base = data.find((c: any) => Number(c.exchangeRateToBase) === 1)
            if (base) setBaseCurrency(base.code)
        } catch (error) { }
    }

    const loadConfig = async () => {
        try {
            const config = await ConfigAPI.get()
            if (config.customMeasurementUnits) {
                setCustomUnits(config.customMeasurementUnits)
            }
        } catch (error) {
        }
    }

    const loadCategories = async () => {
        try {
            const cats = await CategoriesAPI.getAll()
            setCategories(Array.isArray(cats) ? cats : [])
        } catch (error) {
        }
    }

    useEffect(() => {
        loadConfig()
        loadCategories()
        loadCurrencies()
    }, [])


    useEffect(() => {
        const loadManualPrices = async () => {
            if (!product) return
            try {
                const data = await ProductsAPI.getPrices(product.id)
                setManualPrices(data)
            } catch (error) { }
        }

        if (product && open) {
            setFormData(product)
            loadManualPrices()
        } else if (open) {
            setFormData({
                name: "",
                description: "",
                basePrice: 0,
                costPrice: 0,
                isActive: true,
                isNew: true,
                pointsReward: 0,
                brand: "",
                model: "",
                measurementUnit: "UNIDAD",
                allowFractional: false,
                type: "Producto",
                categoryId: undefined,
                condition: "NEW",
                qr: "",
                isTrending: false,
                isRecommended: false,
                images: [],
                taxRate: undefined,
                saleMode: "VENTA"
            })
            setManualPrices([])
            setActiveTab("general")
        }
    }, [product, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.categoryId) {
            alert("Por favor seleccione una categoría")
            return
        }
        onSave(formData, manualPrices)
        onOpenChange(false)
    }
    const isFormValid = () => {
        return !!formData.name && !!formData.categoryId && (formData.basePrice ?? 0) > 0;
    }

    const combinedUnits = Array.from(new Set(['UNIDAD', 'CAJA', 'KG', 'LITRO', 'METRO', 'PAR', 'PACK', ...customUnits]))
    const unitLabels: Record<string, string> = {
        UNIDAD: 'Unidad (u) — Productos normales',
        KG: 'Kilogramo (kg) — Venta por peso',
        LITRO: 'Litro (L) — Venta por volumen',
        METRO: 'Metro (m) — Venta por longitud',
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] h-[90vh] overflow-hidden flex flex-col bg-background text-foreground border-4 border-secondary/60 shadow-2xl p-0 transition-all duration-200">
                <DialogHeader className="px-6 py-4 border-b border-border bg-background">
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                        {product?.id ? 'Editar Producto' : 'Crear Nuevo Producto'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Complete la información general y detalles del producto.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden bg-muted/20">
                    <div className="sm:px-6 px-2 pt-4 bg-background">
                        <TabsList className="grid w-full grid-cols-4 p-0 bg-muted rounded-lg border-2  ">
                            <TabsTrigger
                                value="general"
                                className=" data-[state=active]:bg-background data-[state=active]:text-secondary data-[state=active]:shadow-sm font-medium transition-all border-2 border-transparent data-[state=active]:border-secondary "
                            >
                                General
                            </TabsTrigger>
                            <TabsTrigger value="details" className="data-[state=active]:bg-background data-[state=active]:text-secondary data-[state=active]:shadow-sm font-medium transition-all border-2 border-transparent data-[state=active]:border-secondary">Detalles</TabsTrigger>
                            <TabsTrigger value="pricing" className="data-[state=active]:bg-background data-[state=active]:text-secondary data-[state=active]:shadow-sm font-medium transition-all border-2 border-transparent data-[state=active]:border-secondary">Precios</TabsTrigger>
                            <TabsTrigger value="media" className="data-[state=active]:bg-background data-[state=active]:text-secondary data-[state=active]:shadow-sm font-medium transition-all border-2 border-transparent data-[state=active]:border-secondary">Multimedia</TabsTrigger>
                        </TabsList>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto sm:px-6 px-3 py-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">

                        <TabsContent value="general" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-foreground font-semibold">{formConfig?.productLabel || "Nombre del Producto"}</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-background border-input focus:border-secondary focus:ring-secondary/20 transition-all text-foreground"
                                        placeholder=" Nombre"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="text-foreground">Tipo</Label>
                                        <Select value={formData.type || "Producto"} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                            <SelectTrigger className="bg-background border-input text-foreground">
                                                <SelectValue placeholder="Seleccione tipo" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                <SelectItem value="Producto">Producto Físico</SelectItem>
                                                <SelectItem value="Servicio">Servicio</SelectItem>
                                                <SelectItem value="Digital">Producto Digital</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-foreground">{formConfig?.categoryLabel || "Categoría"}</Label>
                                        <Select
                                            value={formData.categoryId ? String(formData.categoryId) : undefined}
                                            onValueChange={(v) => setFormData({ ...formData, categoryId: parseInt(v) })}
                                        >
                                            <SelectTrigger className="bg-background border-input text-foreground">
                                                <SelectValue placeholder="Seleccione una categoría" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border max-h-[300px] overflow-y-auto">
                                                {(Array.isArray(categories) ? categories : []).map((cat) => (
                                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                                {(!categories || categories.length === 0) && <SelectItem value="0" disabled>No hay categorías</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {formConfig?.showSaleMode && (
                                    <div className="space-y-2">
                                        <Label htmlFor="saleMode" className="text-foreground">Modalidad de Comercialización</Label>
                                        <Select value={formData.saleMode || "VENTA"} onValueChange={(v) => setFormData({ ...formData, saleMode: v as SaleMode })}>
                                            <SelectTrigger className="bg-background border-input text-foreground">
                                                <SelectValue placeholder="Seleccione modalidad" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                <SelectItem value="VENTA">Venta Directa</SelectItem>
                                                <SelectItem value="ALQUILER">Alquiler Temporario</SelectItem>
                                                <SelectItem value="AMBOS">Venta y Alquiler</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="desc" className="text-foreground">Descripción</Label>
                                    <Textarea
                                        id="desc"
                                        rows={5}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-background border-input focus:border-secondary resize-none text-foreground"
                                        placeholder="Describa las características principales del producto..."
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="details" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                            <div className="grid grid-cols-2 gap-6">
                                {rubro?.slug !== 'inmuebles' && formData.type !== 'Servicio' && formData.type !== 'SERVICE' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Marca</Label>
                                            <Input
                                                value={formData.brand}
                                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                                className="bg-background border-input text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Modelo</Label>
                                            <Input
                                                value={formData.model || ''}
                                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                className="bg-background border-input text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Condición</Label>
                                            <Select
                                                value={formData.condition || "NEW"}
                                                onValueChange={(v) => setFormData({ ...formData, condition: v as Condition })}
                                            >
                                                <SelectTrigger className="bg-background border-input text-foreground">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-popover border-border">
                                                    <SelectItem value="NEW">Nuevo</SelectItem>
                                                    <SelectItem value="USED">Usado</SelectItem>
                                                    <SelectItem value="REFURBISHED">Reacondicionado</SelectItem>
                                                    <SelectItem value="EXHIBITION">Exhibición</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground flex justify-between items-center">
                                                Código QR / Identificador
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={formData.qr || ''}
                                                    onChange={(e) => setFormData({ ...formData, qr: e.target.value })}
                                                    placeholder="Escanee o ingrese código"
                                                    className="bg-background border-input font-mono text-muted-foreground"
                                                />
                                                <Button
                                                    variant="secondary"
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, qr: `PRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}` })}
                                                    className="hover:cursor-pointer"
                                                >
                                                    Generar
                                                </Button>
                                            </div>
                                            {formData.qr && (
                                                <div className="mt-4 p-4 border rounded-xl bg-card flex items-center gap-4">
                                                    <div className="bg-white p-2 rounded-lg border" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(formData.qr || "")}`, "_blank")}>
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formData.qr)}`}
                                                            alt="QR Code"
                                                            className="w-20 h-20"
                                                        />
                                                    </div>
                                                    <div className="space-y-2  hidden md:block">
                                                        <p className="text-sm font-medium">QR Generado</p>
                                                        <a
                                                            href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(formData.qr)}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            download={`QR-${formData.qr}.png`}
                                                            className="inline-flex items-center justify-center shrink-0 whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                                        >
                                                            Toca aquí para descargar
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                                        <h3 className="font-semibold text-foreground">Características</h3>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="hover:cursor-pointer"
                                        onClick={() => {
                                            const current = Array.isArray(formData.characteristics) ? formData.characteristics : [];
                                            setFormData({ ...formData, characteristics: [...current, { key: '', value: '' }] });
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Agregar
                                    </Button>
                                    {rubro?.slug === 'inmuebles' && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="hover:cursor-pointer"
                                            onClick={() => {
                                                const current = Array.isArray(formData.characteristics) ? formData.characteristics : [];
                                                const newTemplate = [
                                                    { key: 'Uso de suelo', value: '' },
                                                    { key: 'Ciudad/Zona/Dirección', value: '' },
                                                    { key: 'Mapa interactivo GPS', value: '' },
                                                    { key: 'Referencias', value: '' },
                                                    { key: 'Área total', value: '' },
                                                    { key: 'Área construida', value: '' },
                                                    { key: 'Frente x Fondo', value: '' },
                                                    { key: 'Forma', value: '' },
                                                    { key: 'Servicios (agua/luz/calle)', value: '' },
                                                    { key: 'Dormitorios', value: '' },
                                                    { key: 'Baños', value: '' },
                                                    { key: 'Cochera', value: '' },
                                                    { key: 'Otras características (Cerco, Pozo, etc.)', value: '' },
                                                    { key: 'Estado Legal (Escritura/Trámite)', value: 'Escritura al día' },
                                                    { key: 'Gravámenes', value: 'Ninguno' },
                                                    { key: 'Precio/m²', value: '' },
                                                    { key: 'Formas de pago', value: 'Contado / Financiado' },
                                                    { key: 'Plano/Croquis (Enlace)', value: '' },
                                                    { key: 'Persona encargada', value: '' }
                                                ];
                                                // Avoid adding if they already exist
                                                const currentKeys = current.map((c: any) => c.key);
                                                const toAdd = newTemplate.filter(t => !currentKeys.includes(t.key));
                                                setFormData({ ...formData, characteristics: [...current, ...toAdd] });
                                            }}
                                        >
                                            Cargar Plantilla Inmobiliaria
                                        </Button>
                                    )}
                                </div>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                                    {(Array.isArray(formData.characteristics) ? formData.characteristics : []).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                placeholder="Ej: Material"
                                                value={item.key}
                                                onChange={(e) => {
                                                    const currentChars = Array.isArray(formData.characteristics) ? formData.characteristics : [];
                                                    const updated = [...currentChars];
                                                    updated[idx] = { ...updated[idx], key: e.target.value };
                                                    setFormData({ ...formData, characteristics: updated });
                                                }}
                                                className="flex-1 bg-background border-input text-foreground text-sm"
                                            />
                                            <div className="flex-1 flex gap-2">
                                                <Input
                                                    placeholder="Ej: Acero inoxidable"
                                                    value={item.value}
                                                    onChange={(e) => {
                                                        const currentChars = Array.isArray(formData.characteristics) ? formData.characteristics : [];
                                                        const updated = [...currentChars];
                                                        updated[idx] = { ...updated[idx], value: e.target.value };
                                                        setFormData({ ...formData, characteristics: updated });
                                                    }}
                                                    className="w-full bg-background border-input text-foreground text-sm"
                                                />
                                                {(item.key.toLowerCase().includes('plano') || item.key.toLowerCase().includes('croquis') || item.key.toLowerCase().includes('documento')) && (
                                                    <div className="relative shrink-0">
                                                        <Input
                                                            type="file"
                                                            accept=".pdf,image/*"
                                                            className="hidden"
                                                            id={`upload-char-${idx}`}
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    try {
                                                                        const { UploadAPI } = require("@/services/api")
                                                                        const url = await UploadAPI.upload(file)
                                                                        const currentChars = Array.isArray(formData.characteristics) ? formData.characteristics : [];
                                                                        const updated = [...currentChars];
                                                                        updated[idx] = { ...updated[idx], value: url };
                                                                        setFormData({ ...formData, characteristics: updated });
                                                                    } catch (error) {
                                                                        alert("Error al subir archivo")
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Label htmlFor={`upload-char-${idx}`} className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10 w-10 rounded-md flex items-center justify-center border border-border" title="Subir Archivo">
                                                            <Upload className="h-4 w-4" />
                                                        </Label>
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:cursor-pointer"
                                                onClick={() => {
                                                    const currentChars = Array.isArray(formData.characteristics) ? formData.characteristics : [];
                                                    const updated = currentChars.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, characteristics: updated });
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!Array.isArray(formData.characteristics) || formData.characteristics.length === 0) && (
                                        <p className="text-xs text-muted-foreground italic py-2">Sin características agregadas.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                                        <h3 className="font-semibold text-foreground">Especificaciones</h3>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="hover:cursor-pointer"
                                        onClick={() => {
                                            const current = Array.isArray(formData.specifications) ? formData.specifications : [];
                                            setFormData({ ...formData, specifications: [...current, { key: '', value: '' }] });
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Agregar
                                    </Button>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                                    {(Array.isArray(formData.specifications) ? formData.specifications : []).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                placeholder="Ej: Peso"
                                                value={item.key}
                                                onChange={(e) => {
                                                    const currentSpecs = Array.isArray(formData.specifications) ? formData.specifications : [];
                                                    const updated = [...currentSpecs];
                                                    updated[idx] = { ...updated[idx], key: e.target.value };
                                                    setFormData({ ...formData, specifications: updated });
                                                }}
                                                className="flex-1 bg-background border-input text-foreground text-sm"
                                            />
                                            <Input
                                                placeholder="Ej: 250g"
                                                value={item.value}
                                                onChange={(e) => {
                                                    const currentSpecs = Array.isArray(formData.specifications) ? formData.specifications : [];
                                                    const updated = [...currentSpecs];
                                                    updated[idx] = { ...updated[idx], value: e.target.value };
                                                    setFormData({ ...formData, specifications: updated });
                                                }}
                                                className="flex-1 bg-background border-input text-foreground text-sm"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:cursor-pointer"
                                                onClick={() => {
                                                    const currentSpecs = Array.isArray(formData.specifications) ? formData.specifications : [];
                                                    const updated = currentSpecs.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, specifications: updated });
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!Array.isArray(formData.specifications) || formData.specifications.length === 0) && (
                                        <p className="text-xs text-muted-foreground italic py-2">Sin especificaciones agregadas.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-green-500 rounded-full"></div>
                                        <h3 className="font-semibold text-foreground">Información Nutricional</h3>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="hover:cursor-pointer"
                                        onClick={() => {
                                            const current = Array.isArray((formData as any).nutritionalInfo) ? (formData as any).nutritionalInfo : [];
                                            setFormData({ ...formData, nutritionalInfo: [...current, { key: '', value: '' }] } as any);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Agregar
                                    </Button>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                                    {(Array.isArray((formData as any).nutritionalInfo) ? (formData as any).nutritionalInfo : []).map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                placeholder="Ej: Valor Energético"
                                                value={item.key}
                                                onChange={(e) => {
                                                    const currentInfo = Array.isArray((formData as any).nutritionalInfo) ? (formData as any).nutritionalInfo : [];
                                                    const updated = [...currentInfo];
                                                    updated[idx] = { ...updated[idx], key: e.target.value };
                                                    setFormData({ ...formData, nutritionalInfo: updated } as any);
                                                }}
                                                className="flex-1 bg-background border-input text-foreground text-sm"
                                            />
                                            <Input
                                                placeholder="Ej: 200 kcal"
                                                value={item.value}
                                                onChange={(e) => {
                                                    const currentInfo = Array.isArray((formData as any).nutritionalInfo) ? (formData as any).nutritionalInfo : [];
                                                    const updated = [...currentInfo];
                                                    updated[idx] = { ...updated[idx], value: e.target.value };
                                                    setFormData({ ...formData, nutritionalInfo: updated } as any);
                                                }}
                                                className="flex-1 bg-background border-input text-foreground text-sm"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:cursor-pointer"
                                                onClick={() => {
                                                    const currentInfo = Array.isArray((formData as any).nutritionalInfo) ? (formData as any).nutritionalInfo : [];
                                                    const updated = currentInfo.filter((_: any, i: any) => i !== idx);
                                                    setFormData({ ...formData, nutritionalInfo: updated } as any);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!Array.isArray((formData as any).nutritionalInfo) || (formData as any).nutritionalInfo.length === 0) && (
                                        <p className="text-xs text-muted-foreground italic py-2">Sin información nutricional agregada.</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="pricing" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Tarjeta de Precios */}
                                <div className="space-y-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                                        <h3 className="font-semibold text-lg text-foreground">Precios y Unidades</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="basePrice" className="text-foreground">Precio Base ({config?.currencySymbol || '$'})</Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.basePrice}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(',', '.');
                                                    if (val === '' || val === '.') {
                                                        setFormData({ ...formData, basePrice: val as any });
                                                        return;
                                                    }
                                                    if (/^\d*\.?\d*$/.test(val)) {
                                                        setFormData({ ...formData, basePrice: val as any });
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const parsed = parseFloat(String(formData.basePrice));
                                                    setFormData({ ...formData, basePrice: isNaN(parsed) ? 0 : parsed });
                                                }}
                                                className="bg-muted/50 border-input text-xl font-bold text-foreground"
                                            />
                                            {formData.basePrice && Number(formData.basePrice) > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatCurrency(Number(formData.basePrice) || 0, config?.baseCurrency || 'USD', config?.currencySymbol)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Costo de Compra (Referencia)</Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={(formData as any).costPrice || 0}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(',', '.');
                                                    if (val === '' || val === '.') {
                                                        setFormData({ ...formData, costPrice: val as any } as any);
                                                        return;
                                                    }
                                                    if (/^\d*\.?\d*$/.test(val)) {
                                                        setFormData({ ...formData, costPrice: val as any } as any);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const parsed = parseFloat(String((formData as any).costPrice));
                                                    setFormData({ ...formData, costPrice: isNaN(parsed) ? 0 : parsed } as any);
                                                }}
                                                className="bg-muted/50 border-input text-xl font-bold text-foreground"
                                            />
                                            {(formData as any).costPrice && Number((formData as any).costPrice) > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Margen: {formData.basePrice && Number(formData.basePrice) > 0 ? (((Number(formData.basePrice) - Number((formData as any).costPrice)) / Number((formData as any).costPrice)) * 100).toFixed(1) + '%' : 'N/A'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Impuesto Específico (%) <span className="text-xs text-muted-foreground font-normal ml-1">(Opcional, anula el global)</span></Label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Usar global"
                                                value={formData.taxRate !== undefined && formData.taxRate !== null ? formData.taxRate : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(',', '.');
                                                    if (val === '') {
                                                        setFormData({ ...formData, taxRate: undefined });
                                                        return;
                                                    }
                                                    if (/^\d*\.?\d*$/.test(val)) {
                                                        setFormData({ ...formData, taxRate: val as any });
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (formData.taxRate === undefined || (formData.taxRate as any) === '') return;
                                                    const parsed = parseFloat(String(formData.taxRate));
                                                    setFormData({ ...formData, taxRate: isNaN(parsed) ? undefined : parsed });
                                                }}
                                                className="bg-background border-input text-foreground font-bold"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Ej: 15. Dejar vacío para usar el impuesto de {config?.taxRate}% configurado en la tienda.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1  sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-semibold">Unidad de Medida</Label>
                                                <Select value={formData.measurementUnit || "UNIDAD"} onValueChange={(v) => setFormData({ ...formData, measurementUnit: v, allowFractional: v !== 'UNIDAD' ? true : formData.allowFractional })}>
                                                    <SelectTrigger className="bg-background border-input text-foreground">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-border">
                                                        {combinedUnits.map(u => (
                                                            <SelectItem key={u} value={u}>{unitLabels[u] ?? u}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">Define cómo se mide y vende este producto</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="fractional" className="text-foreground font-semibold">¿Venta Fraccionada?</Label>
                                                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                                                    <Switch checked={formData.allowFractional ?? false} onCheckedChange={(c: any) => setFormData({ ...formData, allowFractional: c })} id="fractional" />
                                                    <div>
                                                        <Label htmlFor="fractional" className="cursor-pointer text-foreground text-sm font-medium">
                                                            {formData.allowFractional ? '✓ Habilitado' : 'Deshabilitado'}
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {formData.allowFractional
                                                                ? `Clientes pueden pedir ej: 0.500 ${formData.measurementUnit === 'KG' ? 'kg' : formData.measurementUnit === 'LITRO' ? 'L' : formData.measurementUnit === 'METRO' ? 'm' : 'u'}`
                                                                : 'Solo cantidades enteras (1, 2, 3...)'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>

                            {/* Etiquetas */}
                            <div className="space-y-4 p-5 rounded-xl bg-muted/20 border border-border">
                                <h3 className="font-medium text-foreground mb-2">Etiquetas de Marketing</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border border-border shadow-sm">
                                        <Label className="cursor-pointer font-medium text-foreground">Activo</Label>
                                        <Switch checked={formData.isActive ?? true} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
                                    </div>
                                    <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border border-border shadow-sm">
                                        <Label className="cursor-pointer font-medium text-foreground">Es Nuevo</Label>
                                        <Switch checked={formData.isNew ?? false} onCheckedChange={(c) => setFormData({ ...formData, isNew: c })} />
                                    </div>
                                    <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border border-border shadow-sm">
                                        <Label className="cursor-pointer font-medium text-foreground">Tendencia</Label>
                                        <Switch checked={formData.isTrending ?? false} onCheckedChange={(c) => setFormData({ ...formData, isTrending: c })} />
                                    </div>
                                    <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border border-border shadow-sm">
                                        <Label className="cursor-pointer font-medium text-foreground">Recomendado</Label>
                                        <Switch checked={formData.isRecommended ?? false} onCheckedChange={(c) => setFormData({ ...formData, isRecommended: c })} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 p-5 rounded-xl bg-card border border-border shadow-sm mt-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-1 bg-amber-500 rounded-full"></div>
                                    <h3 className="font-semibold text-lg text-foreground">Sobrescritura Manual de Precios (Opcional)</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Si define un precio aquí, se usará ese valor en lugar de convertir el precio base automáticamente.
                                </p>
                                <div className="grid gap-4">
                                    {currencies.filter(c => c.code !== baseCurrency).map(curr => {
                                        const existing = manualPrices.find(mp => mp.currencyCode === curr.code)
                                        return (
                                            <div key={curr.code} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/20">
                                                <div className="w-16 font-bold">{curr.code}</div>
                                                <div className="flex-1">
                                                    <Input
                                                        type="text"
                                                        inputMode="decimal"
                                                        placeholder={`Precio en ${curr.code}`}
                                                        value={existing?.price || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(',', '.');
                                                            if (val === '' || val === '.' || /^\d*\.?\d*$/.test(val)) {
                                                                const newPrices = [...manualPrices.filter(mp => mp.currencyCode !== curr.code)]
                                                                if (val !== '' && val !== '.') {
                                                                    const price = parseFloat(val);
                                                                    if (!isNaN(price)) {
                                                                        newPrices.push({ currencyCode: curr.code, price })
                                                                    }
                                                                }
                                                                setManualPrices(newPrices)
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="text-xs text-muted-foreground w-32">
                                                    Sugerido: {((formData.basePrice || 0) * curr.exchangeRateToBase).toFixed(2)} {curr.code}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="media" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                            <div className="space-y-4 p-5 rounded-xl  dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-700 shadow-sm min-h-[400px]">
                                <h3 className="font-semibolddark:text-zinc-200">Galería de Imágenes</h3>
                                <div className="flex sm:flex-row flex-col gap-2 items-center">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        id="image-upload"
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length > 0) {
                                                try {
                                                    const { UploadAPI } = require("@/services/api");
                                                    // Upload files concurrently
                                                    const uploadPromises = files.map(file => UploadAPI.upload(file));
                                                    const urls = await Promise.all(uploadPromises);
                                                    
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        images: [...(prev.images || []), ...urls] 
                                                    }));
                                                } catch (error) {
                                                    alert("Error al subir algunas imágenes. Intente con menos cantidad o verifique el tamaño.");
                                                }
                                            }
                                        }}
                                    />
                                    <Label htmlFor="image-upload" className="cursor-pointer bg-black dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors ">
                                        <Plus className="h-4 w-4" />
                                        Subir Imagen
                                    </Label>
                                    <span className="text-sm dark:text-zinc-400 font-medium">o enlace externo:</span>
                                    <Input
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if (val) {
                                                    setFormData(prev => ({ ...prev, images: [...(prev.images || []), val] }));
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 flex-1 text-zinc-900 dark:text-zinc-100"
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    {formData.images?.map((img, idx) => (
                                        <div key={idx} className="group relative aspect-square rounded-xl border border-zinc-400 dark:border-zinc-700 overflow-hidden  dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                                            <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))}
                                                className="absolute top-2 right-2 p-1.5 bg-white text-red-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 hover:cursor-pointer"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!formData.images || formData.images.length === 0) && (
                                        <div className="col-span-4 py-12 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 border-2 border-dashed border-zinc-400 dark:border-zinc-700 rounded-xl  dark:bg-zinc-900/50">
                                            <div className="h-12 w-12 mb-2 rounded-full dark:bg-zinc-800 flex items-center justify-center">
                                                <Plus className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
                                            </div>
                                            <p className="text-sm font-medium">No hay imágenes cargadas</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 p-5 rounded-xl dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-700 shadow-sm mt-6">
                                <h3 className="font-semibold dark:text-zinc-200">Video y Octágonos</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>URL de Video de YouTube</Label>
                                        <Input
                                            placeholder="Ej: https://youtube.com/watch?v=..."
                                            value={(formData as Record<string, any>).youtubeVideo || ''}
                                            onChange={(e) => setFormData({ ...formData, youtubeVideo: e.target.value } as any)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Imagen de Octágonos</Label>
                                        <div className="flex sm:flex-row flex-col gap-2 items-center">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="octagons-upload"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        try {
                                                            const { UploadAPI } = require("@/services/api")
                                                            const url = await UploadAPI.upload(file)
                                                            setFormData({ ...formData, octagonsImage: url } as any)
                                                        } catch (error) {
                                                            alert("Error al subir imagen de octágonos")
                                                        }
                                                    }
                                                }}
                                            />
                                            <Label htmlFor="octagons-upload" className="cursor-pointer bg-black dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors ">
                                                <Plus className="h-4 w-4" />
                                                Subir Octágonos
                                            </Label>
                                            <Input
                                                placeholder="O introduce enlace externo..."
                                                value={(formData as Record<string, any>).octagonsImage || ''}
                                                onChange={(e) => setFormData({ ...formData, octagonsImage: e.target.value } as any)}
                                            />
                                        </div>
                                        {(formData as Record<string, any>).octagonsImage && (
                                            <div className="relative inline-block mt-2 border rounded-md overflow-hidden bg-white">
                                                <img src={(formData as Record<string, any>).octagonsImage} alt="Octagons" className="h-16 object-contain" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, octagonsImage: '' } as any)}
                                                    className="absolute top-1 right-1 p-0.5 bg-white text-red-600 rounded-full shadow-md hover:cursor-pointer"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <div className="h-8"></div> {/* Espaciador */}
                    </form>
                </Tabs>

                <DialogFooter className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800  dark:bg-zinc-900 sticky bottom-0 z-10 space-x-2 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-300 dark:border-zinc-700  dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800  hover:text-black hover:cursor-pointer">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !isFormValid()} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]  shadow-indigo-200 dark:shadow-none hover:cursor-pointer">
                        {product?.id ? 'Guardar Cambios' : 'Crear Producto'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
