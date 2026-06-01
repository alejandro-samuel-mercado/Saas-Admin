"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import api from '@/services/api'
import { Loader2, ShoppingCart, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CartPreviewDialogProps {
    userId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CartPreviewDialog({ userId, open, onOpenChange }: CartPreviewDialogProps) {
    const [cart, setCart] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (!open || !userId) {
            setCart(null)
            return
        }

        const fetchCart = async () => {
            setLoading(true)
            try {
                const response = await api.get(`/cart/user/${userId}`)
                setCart(response.data)
            } catch (error) {
                toast({ 
                    title: "Error", 
                    description: "No se pudo cargar el carrito del usuario.", 
                    variant: "destructive" 
                })
                onOpenChange(false)
            } finally {
                setLoading(false)
            }
        }

        fetchCart()
    }, [userId, open, onOpenChange, toast])

    const total = cart?.items?.reduce((acc: number, item: any) => 
        acc + (parseFloat(item.sku.price) * parseFloat(item.quantity)), 0
    ) || 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-border shadow-2xl p-0 overflow-hidden bg-card">
                <DialogHeader className="p-8 bg-gradient-to-r from-secondary/10 to-transparent border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-secondary/20 rounded-2xl">
                            <ShoppingCart className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Carrito del Cliente</DialogTitle>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <UserIcon className="h-3.5 w-3.5" /> ID de Usuario: {userId}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-secondary" />
                            <p className="text-muted-foreground font-medium">Sincronizando carrito...</p>
                        </div>
                    ) : !cart || cart.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-20" />
                            <h2 className="text-xl font-bold text-muted-foreground">El carrito está vacío</h2>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-xl rounded-2xl overflow-hidden bg-background">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="font-bold py-4">Producto</TableHead>
                                                <TableHead className="font-bold text-center">Cant.</TableHead>
                                                <TableHead className="font-bold text-right">Unitario</TableHead>
                                                <TableHead className="font-bold text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.items.map((item: any) => (
                                                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell className="py-4">
                                                        <div className="font-bold text-sm">{item.sku.product.name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.sku.code}</div>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {item.sku.variantOptions?.map((opt: any) => (
                                                                <Badge key={opt.id} variant="secondary" className="text-[9px] px-1.5 py-0">
                                                                    {opt.name}: {opt.value}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-black">
                                                        {parseFloat(item.quantity)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {formatCurrency(item.sku.price)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-secondary">
                                                        {formatCurrency(parseFloat(item.sku.price) * parseFloat(item.quantity))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end p-2">
                                <Card className="w-full max-w-[280px] border-4 border-secondary/20 shadow-xl rounded-2xl bg-secondary/5">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Carrito</span>
                                            <span className="text-3xl font-black text-secondary">{formatCurrency(total)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
