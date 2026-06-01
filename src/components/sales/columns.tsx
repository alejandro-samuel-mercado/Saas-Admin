"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Sale } from "@/types/schema"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { SaleDetailsDialog } from "../management/sales/sale-details-dialog"

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button className="hover:cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const date = row.original.createdAt ? new Date(row.original.createdAt) : new Date();
        return <span className="text-muted-foreground">{date.toLocaleDateString("es-AR") + " " + date.toLocaleTimeString("es-AR", {hour: '2-digit', minute:'2-digit'})}</span>;
    }
  },
  {
    accessorKey: "uuid",
    header: "ID Venta",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.uuid?.slice(0, 8)}...</span>
  },
  {
    accessorKey: "user",
    header: "Cliente",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
            <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground">{user?.name || "Consumidor Final"}</span>
                <div className="flex flex-col text-[10px] text-muted-foreground font-medium leading-tight">
                    <span>{user?.email || "-"}</span>
                    {(user?.phone || user?.dni) && (
                        <span>{user.phone || user.dni}</span>
                    )}
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
        return (
          <Button className="hover:cursor-pointer"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => <span className="font-bold">{formatCurrency(row.original.total)}</span>
  },

  {
    accessorKey: "paymentType",
    header: "Pago",
    cell: ({ row }) => <Badge variant="outline">{row.original.paymentType}</Badge>
  },
  {
    accessorKey: "deliveryStatus",
    header: "Estado",
    cell: ({ row }) => {
        const status = row.original.deliveryStatus;
        return (
            <Badge variant={status === 'DELIVERED' ? 'default' : 'secondary'}>
                {status.replace('_', ' ')}
            </Badge>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <SaleActions sale={row.original} />
  },
]

function SaleActions({ sale }: { sale: Sale }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [localSale, setLocalSale] = useState(sale) 

    return (
        <div className="flex gap-2 justify-end" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }}>
            <Button size="icon" className="hover:cursor-pointer" variant="ghost" title="Ver Detalles" onClick={() => setOpen(true)}>
                <Eye className="w-4 h-4" />
            </Button>

            {open && (
                <SaleDetailsDialog 
                    open={open} 
                    onOpenChange={setOpen} 
                    sale={localSale} 
                    onSaleUpdated={() => {
                        router.refresh()
                    }} 
                />
            )}
        </div>
    )
}
