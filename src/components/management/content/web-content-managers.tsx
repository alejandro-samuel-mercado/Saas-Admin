"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { UploadAPI } from '@/services/api'
import { BannerSlide } from '@/types/extended'
import { Image as ImageIcon, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

export const ImageField = ({ label, value, onChange, placeholder, helpText }: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void,
    placeholder?: string,
    helpText?: string
}) => {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const url = await UploadAPI.upload(file)
            if (url) {
                onChange(url)
                toast({ title: "Imagen subida", description: "La imagen se ha cargado correctamente." })
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo subir la imagen.", variant: "destructive" })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-3">
             <Label>{label}</Label>
             <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input 
                        value={value || ''} 
                        onChange={(e) => onChange(e.target.value)} 
                        placeholder={placeholder} 
                        className="pr-10"
                    />
                    {value && (
                        <button 
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 hover:cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleUpload} 
                />
                
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" className="hover:cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Subir imagen"
                >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
             </div>
             
             {value && (
                  <div className="mt-2 relative h-32 w-full max-w-[200px] rounded-lg border border-border bg-muted/50 overflow-hidden flex items-center justify-center">
                      <img src={value} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-zinc-400 opacity-0 hover:opacity-100 transition-opacity">
                         <ImageIcon size={24} />
                      </div>
                  </div>
             )}

             {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
        </div>
    )
}

export const MarqueeItemManager = ({ items, onChange }: { items: string[], onChange: (items: string[]) => void }) => {
    const [newItem, setNewItem] = useState('')

    const addItem = () => {
        if (!newItem.trim()) return
        onChange([...(items || []), newItem.trim()])
        setNewItem('')
    }

    const removeItem = (index: number) => {
        onChange((items || []).filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-4">
            <Label>Mensajes de Marquesina</Label>
            <div className="flex gap-2">
                <Input 
                    value={newItem} 
                    onChange={(e) => setNewItem(e.target.value)} 
                    placeholder="Ej: Envio GRATIS en compras superiores a $50000" 
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                />
                <Button type="button" onClick={addItem} size="icon" variant="outline" className="hover:cursor-pointer">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {(items || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border group">
                        <span className="flex-1 text-sm">{item}</span>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-destructive shrink-0 hover:cursor-pointer"
                            onClick={() => removeItem(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export const BannerCarouselManager = ({ slides, onChange }: { slides: BannerSlide[], onChange: (slides: BannerSlide[]) => void }) => {
    const addSlide = () => {
        const newSlide: BannerSlide = {
            id: Date.now(),
            url: '',
            title: '',
            titleLine2: '',
            subtitle: '',
            backgroundColor: '#FFB4C8'
        }
        onChange([...(slides || []), newSlide])
    }

    const removeSlide = (index: number) => {
        onChange((slides || []).filter((_, i) => i !== index))
    }

    const updateSlide = (index: number, data: Partial<BannerSlide>) => {
        const newSlides = [...(slides || [])]
        newSlides[index] = { ...newSlides[index], ...data }
        onChange(newSlides)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-base font-semibold">Carrusel de Banners (Hero)</Label>
                    <p className="text-xs text-muted-foreground">Configura las diapositivas del banner principal.</p>
                </div>
                <Button type="button" onClick={addSlide} size="sm" variant="outline" className="gap-2 bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary/20 hover:cursor-pointer">
                    <Plus className="h-4 w-4" /> Agregar Slide
                </Button>
            </div>

            <div className="grid gap-6">
                {(slides || []).map((slide, index) => (
                    <Card key={slide.id || index} className="relative overflow-visible border-border bg-card shadow-sm">
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg z-10 hover:cursor-pointer"
                            onClick={() => removeSlide(index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ImageField 
                                    label="Imagen del Slide"
                                    value={slide.url}
                                    onChange={(val) => updateSlide(index, { url: val })}
                                    helpText="Recomendado: 1920x800px"
                                />
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label>Título (Línea 1)</Label>
                                        <Input value={slide.title || ''} onChange={(e) => updateSlide(index, { title: e.target.value })} placeholder="Ej: Encuentra Lo Que Amas" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Título (Línea 2)</Label>
                                        <Input value={slide.titleLine2 || ''} onChange={(e) => updateSlide(index, { titleLine2: e.target.value })} placeholder="Ej: Ama Lo Que Compras" />
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Subtítulo</Label>
                                    <Textarea value={slide.subtitle || ''} onChange={(e) => updateSlide(index, { subtitle: e.target.value })} className="h-20 min-h-[80px] resize-none" placeholder="Breve descripción motivadora..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Color de Fondo</Label>
                                    <div className="flex gap-2">
                                        <Input type="color" value={slide.backgroundColor || '#FFB4C8'} onChange={(e) => updateSlide(index, { backgroundColor: e.target.value })} className="w-12 h-10 p-1" />
                                        <Input value={slide.backgroundColor || '#FFB4C8'} onChange={(e) => updateSlide(index, { backgroundColor: e.target.value })} className="flex-1" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export const SecondaryAdsManager = ({ ads, onChange }: { ads: { url: string, link?: string }[], onChange: (ads: { url: string, link?: string }[]) => void }) => {
    const addAd = () => {
        onChange([...(ads || []), { url: '', link: '' }])
    }

    const removeAd = (index: number) => {
        onChange((ads || []).filter((_, i) => i !== index))
    }

    const updateAd = (index: number, data: Partial<{ url: string, link: string }>) => {
        const newAds = [...(ads || [])]
        newAds[index] = { ...newAds[index], ...data }
        onChange(newAds)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-base font-semibold">Anuncios Rotativos Secundarios</Label>
                    <p className="text-xs text-muted-foreground">Banner rotativo que aparece entre productos y categorías.</p>
                </div>
                <Button type="button" onClick={addAd} size="sm" variant="outline" className="gap-2 hover:cursor-pointer">
                    <Plus className="h-4 w-4" /> Agregar Anuncio
                </Button>
            </div>

            <div className="grid gap-6">
                {(ads || []).map((ad, index) => (
                    <Card key={index} className="relative overflow-visible border-border bg-card shadow-sm">
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg z-10 hover:cursor-pointer"
                            onClick={() => removeAd(index)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ImageField 
                                    label="Imagen del Anuncio"
                                    value={ad.url}
                                    onChange={(val) => updateAd(index, { url: val })}
                                    helpText="Se recomienda formato panorámico."
                                />
                                <div className="space-y-2 pt-2">
                                    <Label>Link de Destino (Opcional)</Label>
                                    <Input 
                                        value={ad.link || ''} 
                                        onChange={(e) => updateAd(index, { link: e.target.value })} 
                                        placeholder="Ej: /products?category=rebajas" 
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
