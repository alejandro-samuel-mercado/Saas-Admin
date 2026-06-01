"use client"

import { SupplierForm } from "@/components/admin/suppliers/supplier-form"
import { SupplierSkuManager } from "@/components/admin/suppliers/supplier-sku-manager"
import { Skeleton } from "@/components/ui/skeleton"
import { Supplier, supplierService } from "@/services/supplier.service"
import { useCallback, useEffect, useState } from "react"

interface Props {
    id: number;
    onClose?: () => void;
}

export default function SupplierDetailsClient({ id, onClose }: Props) {
    const [supplier, setSupplier] = useState<Supplier | any>(null)
    const [loading, setLoading] = useState(true)

    const fetchSupplier = useCallback(async () => {
        try {
            setLoading(true)
            const data = await supplierService.getById(id)
            setSupplier(data)
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchSupplier()

        const handleRefresh = () => fetchSupplier()
        window.addEventListener('supplier-data-changed', handleRefresh)
        return () => window.removeEventListener('supplier-data-changed', handleRefresh)
    }, [id, fetchSupplier])

    if (loading) {
        return <div className="space-y-6 p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-lg" />
        </div>
    }

    if (!supplier) {
        return <div className="p-8 text-center text-muted-foreground">Proveedor no encontrado</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">{supplier.tradeName}</h1>
                    <p className="text-muted-foreground text-sm">{supplier.legalName} - {supplier.taxId}</p>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                {/* Formulario de datos del proveedor */}
                <div className="w-full xl:w-1/3 flex-shrink-0 space-y-6">
                   <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-medium mb-4 text-foreground">Datos del Proveedor</h2>
                        <SupplierForm initialData={supplier} onSuccess={onClose} />
                   </div>
                </div>

                {/* Catalogo de SKU */}
                <div className="w-full xl:w-2/3 flex-grow space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-x-auto">
                        <SupplierSkuManager supplierId={supplier.id} initialSkus={supplier.skus || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}
