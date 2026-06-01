"use client"

import { BannerCarouselManager, ImageField, MarqueeItemManager, SecondaryAdsManager } from '@/components/management/content/web-content-managers'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ConfigAPI } from '@/services/api'
import { BannerSlide, StoreConfig } from '@/types/extended'
import { Layout, Loader2, RefreshCw, Save, Plus, Trash } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export default function ContentPage() {
    const [config, setConfig] = useState<Partial<StoreConfig>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()



    const loadContent = useCallback(async () => {
        try {
            const data = await ConfigAPI.get()
            if (data) {
                if (typeof data.marqueeText === 'string') {
                    data.marqueeText = [data.marqueeText]
                }
                if (typeof data.bannerImage === 'string') {
                    data.bannerImage = data.bannerImage ? [{ url: data.bannerImage, id: 1 }] : []
                }
                setConfig(data)
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar la configuración de contenido.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadContent()
    }, [loadContent])

    const handleSave = async () => {
        setSaving(true)
        try {
            await ConfigAPI.update(config)
            toast({ title: "Contenido guardado", description: "Los cambios se han aplicado correctamente." })
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el contenido.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const isOverridden = config.activeEvent && config.overriddenByEvent;

    return (
        <div className="sm:p-8 pt-2 sm:-ml-2 sm:pl-20 space-y-6 max-w-7xl mx-auto pb-40 sm:pb-20">
             <Breadcrumb className='px-2'>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Contenido Web</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex sm:flex-row flex-col gap-3 sm:gap-0 items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Layout className="h-6 w-6" />
                        Gestión de Contenido
                    </h1>
                    <p className="text-muted-foreground">Personaliza la apariencia, banners y textos de la tienda.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="hover:cursor-pointer" size="icon" onClick={loadContent} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-secondary hover:bg-secondary/80 text-white shadow-lg shadow-secondary/20 hover:cursor-pointer">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            {config.activeEvent && (
                <Card className="bg-amber-50 border-amber-200 text-amber-900 border-2">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <RefreshCw className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold underline decoration-amber-300">Evento Activo: {config.activeEvent.name}</p>
                            <p className="text-xs text-amber-700">Algunos contenidos están siendo sobrescritos por el evento actual y no serán visibles en la web aunque los cambies aquí.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
            
            {loading ? (
                 <div className="flex flex-col items-center justify-center h-64 space-y-4">
                     <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                     <p className="text-muted-foreground">Cargando contenido...</p>
                </div>
            ) : (

            <Tabs defaultValue="visual" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6 bg-transparent h-auto p-0 space-x-2">
                    <TabsTrigger value="visual" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2.5">Identidad Visual</TabsTrigger>
                    <TabsTrigger value="hero" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2.5">Hero Carousel</TabsTrigger>
                    <TabsTrigger value="ads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2.5">Anuncios</TabsTrigger>
                    <TabsTrigger value="multimedia" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2.5">Multimedia y Contacto</TabsTrigger>
                    <TabsTrigger value="custom" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2.5">Página (Menú)</TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="mt-0">
                    <Card className={isOverridden?.marqueeText ? "opacity-60 grayscale-[0.5]" : ""}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>Identidad Visual</CardTitle>
                                {isOverridden?.marqueeText && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">SOBRESCRITO POR EVENTO</span>}
                            </div>
                            <CardDescription>Logo y elementos globales.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ImageField 
                                    label="Logo URL"
                                    value={config.logoUrl || ''}
                                    onChange={(val) => setConfig({...config, logoUrl: val})}
                                    placeholder="https://..."
                                    helpText="Se muestra en el navbar y la factura."
                                />

                                <MarqueeItemManager 
                                    items={config.marqueeText as string[] || []}
                                    onChange={(items) => setConfig({...config, marqueeText: items})}
                                />
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hero" className="mt-0">
                    <Card className={isOverridden?.bannerImage ? "opacity-60 grayscale-[0.5]" : ""}>
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <CardTitle>Hero Carousel</CardTitle>
                                {isOverridden?.bannerImage && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">SOBRESCRITO POR EVENTO</span>}
                            </div>
                            <CardDescription>Configura las imágenes principales de la página de inicio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BannerCarouselManager 
                                slides={config.bannerImage as BannerSlide[] || []}
                                onChange={(slides) => setConfig({...config, bannerImage: slides})}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ads" className="mt-0">
                    <Card className={isOverridden?.secondaryAds ? "opacity-60 grayscale-[0.5]" : ""}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>Anuncios Secundarios</CardTitle>
                                {isOverridden?.secondaryAds && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">SOBRESCRITO POR EVENTO</span>}
                            </div>
                            <CardDescription>Banners publicitarios y anuncios rotativos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ImageField 
                                    label="Imagen Promo Sidebar"
                                    value={config.adImage || ''}
                                    onChange={(val) => setConfig({...config, adImage: val})}
                                    placeholder="https://..."
                                />
                                
                                <div className="space-y-2">
                                    <Label>Texto Promo Sidebar</Label>
                                    <Textarea value={config.adText || ''} onChange={(e) => setConfig({...config, adText: e.target.value})} placeholder="Ej: ¡Oferta exclusiva!..." className="resize-none h-[40px] min-h-[90px]" />
                                </div>
                            </div>

                            <Separator />

                            <SecondaryAdsManager 
                                ads={config.secondaryAds as any || []}
                                onChange={(ads) => setConfig({...config, secondaryAds: ads})}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="multimedia" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuraciones Multimedia y Contacto</CardTitle>
                            <CardDescription>Video institucional en la página de inicio y contacto para productos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Título del Video Institucional</Label>
                                    <Input 
                                        placeholder="Ej: Conoce Más Sobre Nosotros"
                                        value={(config as any).institutionalVideoTitle || ''}
                                        onChange={(e) => setConfig({...config, institutionalVideoTitle: e.target.value} as any)}
                                    />
                                    <p className="text-xs text-muted-foreground">Título de la sección del video en el inicio.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Video Institucional (Opcional)</Label>
                                    <Input 
                                        placeholder="Ej: https://youtube.com/watch?v=..."
                                        value={(config as any).institutionalVideo || ''}
                                        onChange={(e) => setConfig({...config, institutionalVideo: e.target.value} as any)}
                                    />
                                    <p className="text-xs text-muted-foreground">URL de YouTube para mostrar en el inicio.</p>
                                </div>
                            </div>

                            <Separator className="my-2" />

                            <div className="space-y-2 mt-4">
                                <Label>Mensaje de WhatsApp para Productos</Label>
                                <Textarea 
                                    placeholder="Ej: Hola, quiero consultar sobre el producto [PRODUCTO]"
                                    value={(config as any).whatsappProductMessage || ''}
                                    onChange={(e) => setConfig({...config, whatsappProductMessage: e.target.value} as any)}
                                    rows={2}
                                />
                                <p className="text-xs text-muted-foreground">El texto [PRODUCTO] será sustituido por el nombre del producto en la web.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="custom" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Página Personalizada (Menú Dinámico)</CardTitle>
                            <CardDescription>Configura un ítem de menú adicional en el Navbar y la información de la página destino.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Nombre en el Menú (Navbar)</Label>
                                    <Input 
                                        placeholder="Ej: Nuestra Historia"
                                        value={(config as any).navItemName || ''}
                                        onChange={(e) => setConfig({...config, navItemName: e.target.value} as any)}
                                    />
                                    <p className="text-xs text-muted-foreground">Si está vacío, no se mostrará esta página.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Título Principal</Label>
                                    <Input 
                                        placeholder="Ej: Bienvenidos a Nuestra Historia"
                                        value={(config as any).customPageTitle || ''}
                                        onChange={(e) => setConfig({...config, customPageTitle: e.target.value} as any)}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Descripción / Contenido</Label>
                                <Textarea 
                                    placeholder="Escribe el contenido de la página aquí..."
                                    value={(config as any).customPageDescription || ''}
                                    onChange={(e) => setConfig({...config, customPageDescription: e.target.value} as any)}
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6 mt-6 mb-8">
                                <ImageField 
                                    label="Imagen Principal de la Página"
                                    value={(config as any).customPageImage || ''}
                                    onChange={(val) => setConfig({...config, customPageImage: val} as any)}
                                    placeholder="https://..."
                                    helpText="Imagen principal destacada."
                                />
                                
                                <div className="space-y-2">
                                    <Label>Video Principal (YouTube URL)</Label>
                                    <Input 
                                        placeholder="Ej: https://youtube.com/watch?v=..."
                                        value={(config as any).customPageVideo || ''}
                                        onChange={(e) => setConfig({...config, customPageVideo: e.target.value} as any)}
                                    />
                                    <p className="text-xs text-muted-foreground">URL opcional para video principal en esta página.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6 mt-6">
                                <div className="space-y-4">
                                    <Label className="text-xl font-semibold border-b pb-2 flex">Imágenes Adicionales</Label>
                                    <div className="space-y-2 pb-2">
                                        <Label className="text-muted-foreground">Título de la sección</Label>
                                        <Input 
                                            placeholder="Ej: Galería de Imágenes"
                                            value={(config as any).customPageImagesSubtitle || ''}
                                            onChange={(e) => setConfig({...config, customPageImagesSubtitle: e.target.value} as any)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground -mt-2">Las imágenes se mostrarán con un diseño asimétrico tipo masonry.</p>
                                    {((config as any).customPageImages || []).map((img: string, i: number) => (
                                        <div key={i} className="flex gap-2 items-center bg-gray-50/50 p-3 rounded-xl border">
                                            <div className="flex-1">
                                                <ImageField 
                                                    label={`Imagen ${i + 1}`}
                                                    value={img}
                                                    onChange={(val) => {
                                                        const newArr = [...((config as any).customPageImages || [])]
                                                        newArr[i] = val
                                                        setConfig({...config, customPageImages: newArr} as any)
                                                    }}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-4" size="icon" onClick={() => {
                                                const newArr = ((config as any).customPageImages || []).filter((_: any, idx: number) => idx !== i)
                                                setConfig({...config, customPageImages: newArr} as any)
                                            }}><Trash className="w-5 h-5" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full border-dashed" onClick={() => {
                                        const newArr = [...((config as any).customPageImages || []), '']
                                        setConfig({...config, customPageImages: newArr} as any)
                                    }}><Plus className="w-4 h-4 mr-2" /> Agregar Imagen extra</Button>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-xl font-semibold border-b pb-2 flex">Textos Extra / Párrafos</Label>
                                    <div className="space-y-2 pb-2">
                                        <Label className="text-muted-foreground">Título de la sección</Label>
                                        <Input 
                                            placeholder="Ej: Más Información"
                                            value={(config as any).customPageTextsSubtitle || ''}
                                            onChange={(e) => setConfig({...config, customPageTextsSubtitle: e.target.value} as any)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground -mt-2">Bloques de texto independientes.</p>
                                    {((config as any).customPageTexts || []).map((txt: string, i: number) => (
                                        <div key={i} className="flex gap-2 items-start bg-gray-50/50 p-3 rounded-xl border">
                                            <Textarea 
                                                value={txt}
                                                onChange={(e) => {
                                                    const newArr = [...((config as any).customPageTexts || [])]
                                                    newArr[i] = e.target.value
                                                    setConfig({...config, customPageTexts: newArr} as any)
                                                }}
                                                placeholder="Ej: Historia, visión, valores..."
                                                className="min-h-[100px]"
                                            />
                                            <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" size="icon" onClick={() => {
                                                const newArr = ((config as any).customPageTexts || []).filter((_: any, idx: number) => idx !== i)
                                                setConfig({...config, customPageTexts: newArr} as any)
                                            }}><Trash className="w-5 h-5" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full border-dashed" onClick={() => {
                                        const newArr = [...((config as any).customPageTexts || []), '']
                                        setConfig({...config, customPageTexts: newArr} as any)
                                    }}><Plus className="w-4 h-4 mr-2" /> Agregar Texto Extra</Button>
                                </div>

                                <div className="space-y-4 md:col-span-2 mt-4">
                                    <Label className="text-xl font-semibold border-b pb-2 flex">Videos (YouTube URLs)</Label>
                                    <div className="space-y-2 pb-2 w-full md:w-1/2">
                                        <Label className="text-muted-foreground">Título de la sección</Label>
                                        <Input 
                                            placeholder="Ej: Videos Destacados"
                                            value={(config as any).customPageVideosSubtitle || ''}
                                            onChange={(e) => setConfig({...config, customPageVideosSubtitle: e.target.value} as any)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {((config as any).customPageVideos || []).map((vid: string, i: number) => (
                                            <div key={i} className="flex gap-2 items-center bg-gray-50/50 p-3 rounded-xl border">
                                                <Input 
                                                    value={vid}
                                                    onChange={(e) => {
                                                        const newArr = [...((config as any).customPageVideos || [])]
                                                        newArr[i] = e.target.value
                                                        setConfig({...config, customPageVideos: newArr} as any)
                                                    }}
                                                    placeholder="https://youtube.com/watch?v=..."
                                                    className="flex-1"
                                                />
                                                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" size="icon" onClick={() => {
                                                    const newArr = ((config as any).customPageVideos || []).filter((_: any, idx: number) => idx !== i)
                                                    setConfig({...config, customPageVideos: newArr} as any)
                                                }}><Trash className="w-5 h-5" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" className="w-full md:w-1/2 border-dashed" onClick={() => {
                                        const newArr = [...((config as any).customPageVideos || []), '']
                                        setConfig({...config, customPageVideos: newArr} as any)
                                    }}><Plus className="w-4 h-4 mr-2" /> Agregar Video YouTube</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            )}
         </div>
    )
}
