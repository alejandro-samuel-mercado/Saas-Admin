
export type DiscountRule = {
    targets: { type: 'GLOBAL' | 'CATEGORY' | 'PRODUCT' | 'BRAND' | 'SKU', value?: number | string | number[] | string[] }[];
    conditions: { type: 'MIN_QTY' | 'MIN_AMOUNT' | 'PAYMENT_METHOD', value: any, unit?: string }[];
    action: { type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PRICE', value: number, applyPerUnit?: boolean };
}

export class DiscountEngine {
    
    static calculate(context: { items: any[], discounts: any[], paymentType?: string }) {
        const { items, discounts, paymentType } = context;
        let applied: any[] = [];
        let totalDiscount = 0;

       
        const now = new Date();
        const validDiscounts = discounts.filter(d => {
            if (!d.active) return false;
            
            return true;
        }).sort((a, b) => (b.priority || 0) - (a.priority || 0));

   
        for (const discount of validDiscounts) {
            if (!discount.stackable && applied.length > 0) continue;
            if (applied.some(d => !d.stackable)) continue;

            const config = this.normalizeConfig(discount);
            
            // Coincidencia de Ítems
            const matchedItems = this.matchItems(config.targets, items);
            if (matchedItems.length === 0) continue;

            // Verificar Condiciones
            if (this.checkConditions(config.conditions, matchedItems, context)) {
                
               
                const amount = this.calculateAmount(config.action, matchedItems);
                
                if (amount > 0) {
                    applied.push({ ...discount, amount });
                    totalDiscount += amount;
                }
            }
        }
        
        
        const cartTotal = items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
        if (totalDiscount > cartTotal) totalDiscount = cartTotal;

        return { applied, totalDiscount };
    }

    static normalizeConfig(discount: any): DiscountRule {
        if (discount.rules) return discount.rules; 

        // Adaptador Legacy
        const targets: any[] = [];
        if (discount.scope === 'GLOBAL') targets.push({ type: 'GLOBAL' });
        else targets.push({ type: discount.scope, value: discount.targetIds });

        const conditions: any[] = [];
        if (discount.conditions?.minQty) conditions.push({ type: 'MIN_QTY', value: discount.conditions.minQty });
        
        return {
            targets,
            conditions,
            action: { type: discount.type, value: Number(discount.value) }
        };
    }

    static matchItems(targets: any[], items: any[]) {
        if (targets.some(t => t.type === 'GLOBAL')) return items;
        
        return items.filter(item => {
            return targets.some(t => {
                if (t.type === 'CATEGORY') {
                    const catId = item.product?.categoryId;
                    const val = Array.isArray(t.value) ? t.value : [t.value];
                    return val.includes(catId);
                }
                if (t.type === 'PRODUCT') {
                    const pid = item.product?.id;
                    const val = Array.isArray(t.value) ? t.value : [t.value];
                    return val.includes(pid);
                }
               
                return false;
            })
        })
    }

    static checkConditions(conditions: any[], items: any[], context: any) {
        if (!conditions || conditions.length === 0) return true;
        
        for (const c of conditions) {
            if (c.type === 'MIN_QTY') {
                const total = items.reduce((acc, i) => acc + i.quantity, 0);
                if (total < c.value) return false;
            }
        }
        return true;
    }

    static calculateAmount(action: any, items: any[]) {
        const val = Number(action.value);
        const subtotal = items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);

        if (action.type === 'PERCENTAGE') return subtotal * (val / 100);
        if (action.type === 'FIXED_AMOUNT') {
            if (action.applyPerUnit) {
                 const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
                 return val * totalUnits;
            }
            return Math.min(val, subtotal);
        }
        return 0;
    }
}
