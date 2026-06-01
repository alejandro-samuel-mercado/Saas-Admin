"use client"

import { Button } from "@/components/ui/button"
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Supplier, supplierService } from "@/services/supplier.service"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
    tradeName: z.string().min(2, "Nombre requerido"),
    legalName: z.string().min(2, "Razón social requerida"),
    taxId: z.string().min(11, "CUIT inválido"),
    taxStatus: z.string().min(1, "Condición IVA requerida"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(1, "Teléfono requerido"),
    billingAddress: z.string().min(1, "Dirección requerida"),
    isActive: z.boolean(),
})

interface SupplierFormProps {
    initialData?: Supplier;
    onSuccess?: () => void;
}

export function SupplierForm({ initialData, onSuccess }: SupplierFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: initialData ? {
            tradeName: initialData.tradeName || "",
            legalName: initialData.legalName || "",
            taxId: initialData.taxId || "",
            taxStatus: initialData.taxStatus || "Responsable Inscripto",
            email: initialData.email || "",
            phone: initialData.phone || "",
            billingAddress: initialData.billingAddress || "",
            isActive: initialData.isActive ?? true
        } : {
            tradeName: "",
            legalName: "",
            taxId: "",
            taxStatus: "Responsable Inscripto",
            email: "",
            phone: "",
            billingAddress: "",
            isActive: true
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (initialData) {
                await supplierService.update(initialData.id, values)
                toast({ title: "Proveedor actualizado" })
                if (onSuccess) onSuccess()
                else router.push("/management/suppliers")
            } else {
                await supplierService.create(values)
                toast({ title: "Proveedor creado" })
                if (onSuccess) onSuccess()
                else router.push("/management/suppliers")
            }
            if (!onSuccess) {
                router.refresh()
            }
        } catch (error: any) {
            toast({ 
                title: "Error", 
                description: error.response?.data?.message || "Algo salió mal",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form} >
            <form onSubmit={form.handleSubmit(onSubmit) } className="space-y-4 max-w-2xl ">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="tradeName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre Comercial</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="legalName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Razón Social</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CUIT</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="taxStatus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condición IVA</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem>
                                        <SelectItem value="Monotributista">Monotributista</SelectItem>
                                        <SelectItem value="Exento">Exento</SelectItem>
                                        <SelectItem value="Consumidor Final">Consumidor Final</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                                <FormLabel>Activo</FormLabel>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                
                 <FormField
                        control={form.control}
                        name="billingAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dirección Fiscal</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                <Button className="hover:cursor-pointer" type="submit" disabled={loading || !form.formState.isValid}>
                    {loading ? "Guardando..." : initialData ? "Actualizar" : "Crear Proveedor"}
                </Button>
            </form>
        </Form>
    )
}
