"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SafeNumericInput } from "@/components/ui/safe-numeric-input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { ProductsAPI } from "@/services/api"
import branchService from "@/services/branch.service"
import stockTransferService from "@/services/stock-transfer.service"
import { useBranchStore } from "@/store/branch.store"
import { Branch, Product } from "@/types/schema"
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface TransferItemRow {
  skuId: string 
  selectedSkuId: number | null
  quantity: number
}

export function TransferDialog({ open, onOpenChange, onSuccess }: TransferDialogProps) {
  const { toast } = useToast()
  const { activeBranch } = useBranchStore()
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  const [originId, setOriginId] = useState<string>("")
  const [destId, setDestId] = useState<string>("")
  const [notes, setNotes] = useState("")
  
  const [items, setItems] = useState<TransferItemRow[]>([{ skuId: '1', selectedSkuId: null, quantity: 1 }])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (activeBranch) {
        setOriginId(activeBranch.id.toString())
    }
  }, [activeBranch])

  const loadBranches = useCallback(async () => {
    try {
        const sucData = await branchService.getAll()
        setBranches(sucData)
    } catch (e) {
        toast({ title: "Error cargando sucursales", variant: "destructive" })
    }
  }, [toast])

  const searchProducts = useCallback(async (query: string) => {
    setIsSearching(true)
    try {
        const prodData = await ProductsAPI.getAll({ search: query, limit: 50, adminView: true }) 
        const productsList = prodData.data?.data || prodData.data || []
        setProducts(productsList)
    } catch (e) {
        console.error("Error buscando productos:", e)
    } finally {
        setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadBranches()
      searchProducts("")
    }
  }, [open, loadBranches, searchProducts])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      searchProducts(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, open, searchProducts])

  const availableSkus = useMemo(() => {
    const skus: { id: number, name: string, stock: number }[] = []
    products.forEach(p => {
        if (p.skus && p.skus.length > 0) {
            p.skus.forEach(v => {
                 let spec = ""
                 if(v.variantOptions && v.variantOptions.length > 0) {
                    spec = v.variantOptions.map((vo: any) => vo.value).join(", ")
                 }
                 
                 const originStock = (v as any).branchInventory?.find((i: any) => i.branchId === parseInt(originId))?.stock || 0
                 
                 skus.push({ 
                    id: v.id, 
                    name: `${p.name} ${spec ? `(${spec})` : ''}`,
                    stock: originStock 
                 })
            })
        }
    })
    return skus
  }, [products, originId])

  const handleAddItem = () => {
    setItems([...items, { skuId: Math.random().toString(), selectedSkuId: null, quantity: 1 }])
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})

  const handleRowChange = (index: number, field: keyof TransferItemRow, value: any) => {
    const newItems = [...items]
    const currentItem = newItems[index]
    
    if (field === "quantity") {
        const val = typeof value === 'string' ? parseFloat(value) || 0 : value
        const selectedSku = availableSkus.find(s => s.id === currentItem.selectedSkuId)
        
        if (selectedSku && val > selectedSku.stock) {
            toast({ 
                title: "Stock insuficiente", 
                description: `El stock disponible es ${selectedSku.stock}`,
                variant: "destructive" 
            })
            newItems[index] = { ...currentItem, quantity: selectedSku.stock }
        } else {
            newItems[index] = { ...currentItem, quantity: val }
        }
    } else {
        newItems[index] = { ...currentItem, [field]: value }
    }
    
    setItems(newItems)
    
    if (field === "selectedSkuId") {
      setOpenPopovers(prev => ({ ...prev, [items[index].skuId]: false }))
      
      const newSku = availableSkus.find(s => s.id === value)
      if (newSku && currentItem.quantity > newSku.stock) {
          newItems[index].quantity = newSku.stock
          setItems([...newItems])
      }
    }
  }

  const handleSubmit = async () => {
    if (!originId || !destId) {
        toast({ title: "Selecciona origen y destino", variant: "destructive" })
        return
    }
    if (originId === destId) {
        toast({ title: "Origen y destino deben ser diferentes", variant: "destructive" })
        return
    }
    
    const validItems = items.filter(i => i.selectedSkuId && i.quantity > 0).map(i => {
        const sku = availableSkus.find(s => s.id === i.selectedSkuId)
        if (sku && i.quantity > sku.stock) {
            throw new Error(`Stock insuficiente para ${sku.name}`)
        }
        return {
            skuId: i.selectedSkuId!,
            quantity: i.quantity
        }
    })

    if (validItems.length === 0) {
        toast({ title: "Agrega al menos un producto válido", variant: "destructive" })
        return
    }

    setLoading(true)
    try {
        await stockTransferService.create({
            originBranchId: parseInt(originId),
            destinationBranchId: parseInt(destId),
            items: validItems,
            notes
        })
        toast({ title: "Solicitud de transferencia creada" })
        onSuccess()
        onOpenChange(false)
       
        setItems([{ skuId: '1', selectedSkuId: null, quantity: 1 }])
        setNotes("")
    } catch (error: any) {
        toast({ 
            title: "Error", 
            description: error.message || error.response?.data?.message || "Falló la creación", 
            variant: "destructive" 
        })
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-w-[90vw] max-h-[90vh] overflow-y-auto bg-background border-4 border-secondary/60">
        <DialogHeader>
          <DialogTitle>Nueva Transferencia de Stock</DialogTitle>
          <DialogDescription>Mueve inventario entre branches.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label>Origen (Sucursal Actual)</Label>
                    <Select value={originId} onValueChange={setOriginId} disabled>
                        <SelectTrigger className="bg-muted"><SelectValue placeholder="Selecciona origen" /></SelectTrigger>
                        <SelectContent>
                            {branches.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Destino</Label>
                    <Select value={destId} onValueChange={setDestId}>
                        <SelectTrigger><SelectValue placeholder="Selecciona destino" /></SelectTrigger>
                        <SelectContent>
                            {branches.filter(s => s.id.toString() !== originId).map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Productos</Label>
                <div className="border rounded-md p-4 space-y-3">
                    {items.map((item, index) => (
                        <div key={item.skuId} className="flex items-end gap-3">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs">Producto / SKU</Label>
                                <Popover open={openPopovers[item.skuId]} onOpenChange={(val) => setOpenPopovers(prev => ({ ...prev, [item.skuId]: val }))}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className="w-full justify-between h-9 font-normal hover:cursor-pointer"
                                    >
                                      {item.selectedSkuId
                                        ? availableSkus.find(s => s.id === item.selectedSkuId)?.name
                                        : "Buscar producto..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent 
                                    className="-mt-10 w-[300px] sm:w-[400px] p-0 z-[1000] max-h-[60vh] overflow-y-auto overflow-x-hidden" 
                                    align="start"
                                  >
                                    <Command shouldFilter={false}>
                                      <CommandInput 
                                        placeholder="Buscar producto..." 
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                      />
                                      <CommandList>
                                        {isSearching ? (
                                            <div className="p-4 text-center">
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground mt-2 block">Buscando...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                                <CommandGroup>
                                          {availableSkus.map(sku => (
                                            <CommandItem
                                              key={sku.id}
                                              value={`${sku.name} ${sku.id}`}
                                              onSelect={() => handleRowChange(index, "selectedSkuId", sku.id)}
                                              onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleRowChange(index, "selectedSkuId", sku.id)
                                              }}
                                              className="cursor-pointer !pointer-events-auto !opacity-100"
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  item.selectedSkuId === sku.id ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <div className="flex-1">
                                                <div className="font-medium">{sku.name}</div>
                                                {originId && (
                                                  <div className="text-xs text-muted-foreground">
                                                    Disponible: {sku.stock} unidades
                                                  </div>
                                                )}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </>
                                    )}
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                            </div>
                            <div className="w-24 space-y-1">
                                <Label className="text-xs">Cantidad</Label>
                                <SafeNumericInput 
                                    className="h-9"
                                    value={item.quantity} 
                                    onChange={(val) => handleRowChange(index, "quantity", val)} 
                                />
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:cursor-pointer" onClick={() => handleRemoveItem(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddItem} className="w-full hover:cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional: motivo del movimiento" />
            </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4  w-4 animate-spin hover:cursor-pointer" />}
                Crear Solicitud
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
