
export const SyncService = {
  /**
   * Sincroniza una sola venta con el backend
   */
  async syncSale(sale: any) {
   
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, id: Math.floor(Math.random() * 10000) };
  },

  /**
   * Procesa la cola de ventas pendientes (offline)
   */
  async processQueue(pendingSales: any[], removePendingSale: (uuid: string) => void) {
    if (pendingSales.length === 0) return;

    for (const sale of pendingSales) {
      try {
        await this.syncSale(sale);
        removePendingSale(sale.uuid); 
      } catch (error) {
        
      }
    }
  }
}
