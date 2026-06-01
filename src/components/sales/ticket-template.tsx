
import { formatCurrency } from "@/lib/utils";
import { useConfigStore } from "@/store/config.store";
import { Sale } from "@/types/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";

interface TicketTemplateProps {
   sale: Sale;
   branch?: any;
}

export const TicketTemplate = forwardRef<HTMLDivElement, TicketTemplateProps>(({ sale, branch: currentBranch }, ref) => {
   const branch = sale.branch || currentBranch;
      const { config, fetchConfig } = useConfigStore()
   const receipt = (sale as any).receipt || (sale as any).receipts?.[0];
   const ticketNumber = receipt?.ticketNumber || `SALE-${sale.id}`;

   return (
       <div ref={ref} className="ticket-container print-area p-4 bg-white text-black text-xs font-mono w-[80mm] mx-auto">
           {/* Header */}
           <div className="text-center mb-4">
               {/* Logo de la tienda si está habilitado */}
               {config?.showLogoOnTicket && config?.logoUrl && (
                    <div className="flex justify-center mb-4">
                        <img 
                            src={config.logoUrl} 
                            alt={config.storeName || "Logo"} 
                            className="max-w-[120px] max-h-[60px] object-contain"
                        />
                    </div>
               )}

               <h2 className="text-xl font-bold uppercase tracking-tight leading-none mb-1">
{config?.storeName|| "MI NEGOCIO"}</h2>
               <p>{branch?.address}</p>
               <p>{branch?.city}, {branch?.state}</p>
               <p>Tel: {branch?.phone}</p>
               {branch?.name && <p>Sucursal: {branch.name}</p>}
              
               <div className="border-t border-b border-black py-1 my-2">
                   <p className="font-bold text-sm">TICKET: {ticketNumber}</p>
                   <p>{format(new Date(sale.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })}</p>
               </div>
           </div>

           {/* Customer (Optional) */}
           {sale.user && (
               <div className="mb-2 border-b border-dashed border-black pb-2">
                   <p>Cliente: {sale.user.name}</p>
                   {sale.user.dni && <p>DNI: {sale.user.dni}</p>}
               </div>
           )}

           {/* Items */}
           <table className="w-full mb-4">
               <thead>
                   <tr className="text-left border-b border-black">
                       <th className="w-1/2 pb-1">Art.</th>
                       <th className="w-1/4 text-right pb-1 pr-1">Cant.</th>
                       <th className="w-1/4 text-right pb-1 pr-1">Total</th>
                   </tr>
               </thead>
               <tbody>
                   {(sale.items || []).map((item, i) => (
                       <tr key={i}>
                           <td className="pt-1 pr-1 truncate max-w-[40mm]">
                               <div className="font-bold">{item.productName}</div>
                               <div className="text-[10px]">{item.skuCode}</div>
                           </td>
                           <td className="pt-1 text-right align-top pr-1">
                                {Number(item.quantity)} x {formatCurrency(item.unitPrice, config?.baseCurrency || "USD", config?.currencySymbol)}
                           </td>
                           <td className="pt-1 text-right align-top font-bold pr-1">
                                {formatCurrency(item.subtotal, config?.baseCurrency || "USD", config?.currencySymbol)}
                           </td>
                       </tr>
                   ))}
               </tbody>
           </table>

           {/* Totals */}
           <div className="border-t border-black pt-2 space-y-1 text-right pr-1">
               <div className="flex justify-between">
                   <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal, config?.baseCurrency || "USD", config?.currencySymbol)}</span>
               </div>
              
               {Number(sale.discount) > 0 && (
                   <div className="flex justify-between font-bold">
                       <span>Descuento:</span>
                        <span>-{formatCurrency(sale.discount, config?.baseCurrency || "USD", config?.currencySymbol)}</span>
                   </div>
               )}

               {Number(sale.shippingCost) > 0 && (
                    <div className="flex justify-between">
                       <span>Envío:</span>
                        <span>+{formatCurrency(sale.shippingCost, config?.baseCurrency || "USD", config?.currencySymbol)}</span>
                   </div>
               )}

               <div className="flex justify-between text-base font-bold border-t border-dashed border-black pt-1 mt-1">
                   <span>TOTAL:</span>
                    <span>{formatCurrency(sale.total, config?.baseCurrency || "USD", config?.currencySymbol)}</span>
               </div>
           </div>

           {/* Payment Info */}
           <div className="mt-4 pt-2 border-t border-dashed border-black text-center">
               <p className="font-bold">FORMA DE PAGO: {sale.paymentType}</p>
               <p>Estado: {sale.paymentStatus}</p>
               {sale.employee && <p className="mt-1 text-[10px]">Atendido por: {sale.employee.name}</p>}
           </div>

           {/* Footer */}
           <div className="mt-6 pt-4 border-t border-dashed border-zinc-300 text-center">
                   <p className="text-sm font-bold uppercase tracking-widest mb-1">
                       {config?.ticketFooter || "¡Gracias por su compra!"}
                   </p>
                   <p className="text-[10px] text-zinc-500 italic">
                       Vuelve pronto a {branch?.name || config?.storeName || 'nuestra tienda'}
                   </p>
               </div>
          
                       <div className="mt-4 flex flex-col items-center justify-center gap-2 border-t border-black pt-4">
                <QRCodeSVG 
                    value={JSON.stringify({
                        t: (sale as any).receipt?.ticketNumber || `SALE-${sale.id}`,
                        s: (config as any)?.storeName,
                        d: format(new Date(sale.createdAt || new Date()), "yyyy-MM-dd"),
                        v: sale.total
                    })}
                    size={100}
                    level="M"
                    includeMargin={false}
                />
                <p className="text-[8px] uppercase font-bold text-center">Comprobante No Válido como Factura</p>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .ticket-container {
                        width: 100%;
                        max-width: 80mm;
                        padding: 5mm 8mm 5mm 5mm;
                        margin: 0;
                        border: none;
                        font-size: 12px;
                    }
                    /* Hide everything else */
                    body > *:not(.print-area) {
                        display: none;
                    }
                    .print-area {
                        display: block;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                }
            `}} />
       </div>
   );
});

TicketTemplate.displayName = "TicketTemplate";
