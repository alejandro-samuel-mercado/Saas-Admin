import { Event, ShippingZone, StoreConfig } from '@/types/extended';
import { CartItem, DeliveryType, PaymentType, User } from '@/types/schema';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  client: User | null;
  paymentType: PaymentType;
  deliveryType: DeliveryType;
  discount: number; 
  shippingCost: number;
  deliveryAddress: string;
  isProcessing: boolean;
  
  storeConfig: StoreConfig | null;
  activeEvents: Event[];
  activeDiscounts: any[]; 
  shippingZones: ShippingZone[];
  selectedZoneId: number | null;

  addItem: (item: CartItem) => void;
  removeItem: (skuCode: string) => void;
  updateQuantity: (skuCode: string, quantity: number) => void;
  setClient: (client: User | null) => void;
  setPaymentType: (type: PaymentType) => void;
  setDeliveryType: (type: DeliveryType) => void;
  setDeliveryAddress: (address: string) => void;
  setDiscount: (amount: number) => void; 
  setShippingCost: (cost: number) => void; 
  setIsProcessing: (val: boolean) => void;

  setStoreConfig: (config: StoreConfig) => void;
  setActiveEvents: (events: Event[]) => void;
  setActiveDiscounts: (discounts: any[]) => void;
  setShippingZones: (zones: ShippingZone[]) => void;
  setSelectedZoneId: (id: number | null) => void;

  clearCart: () => void;
  
  getSubtotal: () => number;
  getTotal: () => number;
  
  pointsToUse: number;
  setPointsToUse: (points: number) => void;
  
  getItemDiscount: (item: CartItem) => { amount: number, label?: string };
}


function calculateValue(rule: any, item: CartItem): number {
    
    const action = rule._normalizedAction || { type: rule.type, value: parseFloat(rule.value || 0) };
    const type = action.type as string;
    const value = parseFloat(action.value || 0);
    if (!value) return 0;

    const gross = item.unitPrice * item.quantity;

    if (type === 'PERCENTAGE') {
        return gross * (value / 100);
    } else if (type === 'FIXED_AMOUNT') {
        return Math.min(value, gross); 
    } else if (type === 'FIXED_PRICE') {
       
        return Math.max(0, gross - value * item.quantity);
    }
    return 0;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      client: null,
      paymentType: null as any,
      deliveryType: 'PICKUP',
      discount: 0,
      shippingCost: 0,
      deliveryAddress: '',
      pointsToUse: 0,
      isProcessing: false,
      
      storeConfig: null,
      activeEvents: [],
      activeDiscounts: [],
      shippingZones: [],
      selectedZoneId: null,

      addItem: (newItem) => set((state) => {
        const existingItem = state.items.find(i => i.skuCode === newItem.skuCode);
        let updatedItems = [];
        
        if (existingItem) {
           const potentialQty = existingItem.quantity + newItem.quantity;
          
           if (potentialQty > existingItem.maxStock) {
               return { items: state.items }; 
           }

           updatedItems = state.items.map(i => 
              i.skuCode === newItem.skuCode 
                ? { ...i, quantity: i.quantity + newItem.quantity, subtotal: (i.quantity + newItem.quantity) * i.unitPrice }
                : i
            );
        } else {
            if (newItem.quantity > newItem.maxStock) {
                return { items: state.items };
            }
            updatedItems = [...state.items, newItem];
        }
        return { items: updatedItems };
      }),

      removeItem: (skuCode) => set((state) => ({
        items: state.items.filter(i => i.skuCode !== skuCode)
      })),

      updateQuantity: (skuCode, quantity) => set((state) => {
        if (quantity <= 0) {
             return { items: state.items.filter(i => i.skuCode !== skuCode) };
        }

        return {
            items: state.items.map(i => {
                if (i.skuCode === skuCode) {
                  
                    const finalQty = Math.min(quantity, i.maxStock);
                    return { ...i, quantity: finalQty, subtotal: finalQty * i.unitPrice };
                }
                return i;
            })
        };
      }),

      setClient: (client) => set({ client }),
      setPaymentType: (paymentType) => set({ paymentType }),
      setDeliveryType: (deliveryType) => set({ deliveryType }),
      setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
      setDiscount: (discount) => set({ discount }),
      setShippingCost: (shippingCost) => set({ shippingCost }),
      setPointsToUse: (pointsToUse) => set({ pointsToUse }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      
      setStoreConfig: (storeConfig) => set({ storeConfig }),
      setActiveEvents: (activeEvents) => set({ activeEvents }),
      setActiveDiscounts: (activeDiscounts) => set({ activeDiscounts }),
      setShippingZones: (shippingZones) => set({ shippingZones }),
      setSelectedZoneId: (selectedZoneId) => set((state) => {
       
        if (state.deliveryType === 'DELIVERY' && selectedZoneId) {
            const zone = state.shippingZones.find(z => z.id == selectedZoneId);
            if (zone) return { selectedZoneId, shippingCost: Number(zone.cost) };
        }
        return { selectedZoneId };
      }),

      clearCart: () => set({ 
        items: [], 
        client: null, 
        selectedZoneId: null,
        pointsToUse: 0,
        isProcessing: false,
        paymentType: null as any
      }),

      getItemDiscount: (item) => {
         const { activeEvents, activeDiscounts, items } = get();
         
         let matches: any[] = [];

         const checkRule = (disc: any, sourceName: string) => {
             if (!disc.active) return;

             // --- Normalizar descuento (igual que el backend normalizeConfig) ---
             let normalizedTargets: any[] = [];
             let normalizedAction: any = null;

             if (disc.rules && typeof disc.rules === 'object') {
                 normalizedTargets = Array.isArray(disc.rules.targets) ? disc.rules.targets : [];
                 
                 normalizedAction = { 
                     type: disc.type || disc.rules.action?.type || 'PERCENTAGE', 
                     value: parseFloat(disc.value)
                 };
                 
                 if (isNaN(normalizedAction.value)) {
                     normalizedAction.value = parseFloat(disc.rules.action?.value || 0);
                 }
             } else {
                 if (disc.scope === 'GLOBAL') {
                     normalizedTargets = [{ type: 'GLOBAL' }];
                 } else if (disc.scope) {
                     normalizedTargets = [{ type: disc.scope, ids: Array.isArray(disc.targetIds) ? disc.targetIds : [] }];
                 }
                 normalizedAction = { type: disc.type || 'PERCENTAGE', value: parseFloat(disc.value || 0) };
             }

             if (normalizedTargets.length === 0) return;

             const discWithNormalized = { ...disc, _normalizedTargets: normalizedTargets, _normalizedAction: normalizedAction };

             // --- Coincidencia por cada target normalizado ---
             let isMatch = false;
             for (const target of normalizedTargets) {
                 const targetType = target.type as string;
                 
                 // Soportar 3 formatos de IDs: target.ids (legacy), target.value, target.id
                 const rawIds = target.ids ?? target.value ?? (target.id !== undefined ? target.id : undefined);
                 // Normalizar a array de strings para comparación type-safe
                 const targetIds: string[] = (Array.isArray(rawIds) ? rawIds : (rawIds !== undefined && rawIds !== null ? [rawIds] : []))
                     .map((v: any) => String(v));

                 if (targetType === 'GLOBAL') {
                     isMatch = true;
                     break;
                 } else if (targetType === 'PRODUCT' && item.productId) {
                     if (targetIds.includes(String(item.productId))) { isMatch = true; break; }
                 } else if (targetType === 'CATEGORY' && item.categoryId) {
                     if (targetIds.includes(String(item.categoryId))) { isMatch = true; break; }
                 } else if (targetType === 'BRAND' && item.brand) {
                     if (targetIds.some((v: string) => v.toLowerCase() === item.brand?.toString().toLowerCase())) { isMatch = true; break; }
                 } else if (targetType === 'SKU' && item.skuCode) {
                     if (targetIds.includes(String(item.skuCode))) { isMatch = true; break; }
                 }
             }

             if (!isMatch) return;

             // --- Condiciones ---
             const conditions = disc.rules?.conditions || [];
             for (const cond of conditions) {
                 if (cond.type === 'MIN_QTY' && item.quantity < cond.value) return;
                 if (cond.type === 'MIN_AMOUNT' && item.subtotal < cond.value) return;
             }

             matches.push({ ...discWithNormalized, sourceName });
         }

          const trulyActiveEvents = activeEvents.filter(e => {
              const now = new Date();
              
              const isActiveFlag = e.active;
              const isWithinDates = (!e.startDate || now >= new Date(e.startDate)) && 
                                    (!e.endDate || now <= new Date(e.endDate));
              return isActiveFlag && isWithinDates;
          });

         
          if (trulyActiveEvents.length > 0) {
              trulyActiveEvents.forEach(e => e.discounts?.forEach(d => checkRule(d, e.name)));
          } else {
             
              activeDiscounts.forEach(d => checkRule(d, d.name || 'Descuento'));
          }

         if (matches.length === 0) return { amount: 0 };

         const getMatchScope = (m: any): string =>
             (m._normalizedTargets?.[0]?.type as string) || m.scope || 'GLOBAL';

         const productRules = matches.filter(m => getMatchScope(m) === 'PRODUCT');
         const categoryRules = matches.filter(m => getMatchScope(m) === 'CATEGORY');
         const brandRules = matches.filter(m => getMatchScope(m) === 'BRAND');
         const skuRules = matches.filter(m => getMatchScope(m) === 'SKU');
         const globalRules = matches.filter(m => getMatchScope(m) === 'GLOBAL');

         const priorityList = [skuRules, productRules, brandRules, categoryRules, globalRules];
         let bestRule = null;
         for (const group of priorityList) {
             if (group.length > 0) {
                 bestRule = group.reduce((prev, current) => {
                     return calculateValue(current, item) > calculateValue(prev, item) ? current : prev;
                 });
                 break;
             }
         }

         if (!bestRule) return { amount: 0 };

         return { 
             amount: calculateValue(bestRule, item), 
             label: bestRule.sourceName 
         };
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((acc, item) => acc + item.subtotal, 0);
      },

      getTotal: () => {
        const { items, discount, shippingCost, deliveryType, storeConfig, activeEvents } = get();
        const { getItemDiscount } = get();

        let total = 0;
        
        items.forEach(item => {
             const itemTotal = item.subtotal;
             const { amount } = getItemDiscount(item);
             total += Math.max(0, itemTotal - amount);
        });

        if (discount > 0) {
            total = Math.max(0, total - discount);
        }
        
        let finalShipping = shippingCost;
        if (deliveryType === 'DELIVERY' && storeConfig?.enableShipping) {
            if (storeConfig.freeShippingThreshold && total >= storeConfig.freeShippingThreshold) {
                finalShipping = 0;
            }
             const eventFreeShip = activeEvents.some(e => e.shippingConfig?.type === 'FREE');
             if(eventFreeShip) finalShipping = 0;
        } else if (deliveryType !== 'DELIVERY') {
             finalShipping = 0;
        }

        const { pointsToUse } = get();
        if (pointsToUse > 0 && storeConfig?.enablePointsRedemption) {
            const moneyPerPoint = Number(storeConfig.moneyPerPoint) || 0;
            const pointsDiscount = pointsToUse * moneyPerPoint;
            total = Math.max(0, total - pointsDiscount);
        }

        return total + finalShipping;
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
      partialize: (state) => ({ 
          items: state.items, 
          client: state.client,
          discount: state.discount, 
          paymentType: state.paymentType,
          deliveryType: state.deliveryType
      })
    }
  )
)
