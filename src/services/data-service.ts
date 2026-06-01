import { SalesAPI } from "@/services/api";
import { useDataStore } from "@/store/sync-store";
import { Product, User } from "@/types/schema";

export const DataService = {
  /**
   * Obtiene y cachea los datos del backend
   */
  async fetchAndCacheData() {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockProducts: Product[] = [
      {
        id: 1,
        name: "Smartphone XPro",
        type: "Tecnología",
        brand: "TechBrand",
        description: "Último modelo con cámara de 108MP",
        basePrice: 120000,

        pointsReward: 120,
        images: ["/placeholder.png"],
        condition: "NEW",
        isTrending: true,
        isRecommended: true,
        isNew: true,
        isActive: true,
        categoryId: 1,
        skus: [
          {
            id: 101,
            code: "XPRO-BLK-128",
            price: 120000,
            stock: 10,
            soldQuantity: 2,
            active: true,
            productId: 1,
            variantOptions: [
              { id: 1, name: "Color", value: "Negro", skuId: 101 },
              { id: 2, name: "Storage", value: "128GB", skuId: 101 },
            ],
          },
          {
            id: 102,
            code: "XPRO-WHT-256",
            price: 140000,
            stock: 5,
            soldQuantity: 0,
            active: true,
            productId: 1,
            variantOptions: [
              { id: 3, name: "Color", value: "Blanco", skuId: 102 },
              { id: 4, name: "Storage", value: "256GB", skuId: 102 },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Laptop Pro 15",
        type: "Tecnología",
        brand: "Compute",
        description: "Potencia para profesionales",
        basePrice: 850000,

        pointsReward: 850,
        images: [],
        condition: "NEW",
        isTrending: false,
        isRecommended: true,
        isNew: false,
        isActive: true,
        categoryId: 2,
        skus: [
          {
            id: 201,
            code: "LPT-15-i7",
            price: 850000,
            stock: 3,
            soldQuantity: 1,
            active: true,
            productId: 2,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Auriculares NoiseCancel",
        type: "Audio",
        brand: "SoundFine",
        description: "Silencio absoluto",
        basePrice: 45000,

        pointsReward: 45,
        images: [],
        condition: "NEW",
        isTrending: true,
        isRecommended: false,
        isNew: true,
        isActive: true,
        categoryId: 3,
        skus: [
          {
            id: 301,
            code: "NC-BLK",
            price: 45000,
            stock: 20,
            soldQuantity: 5,
            active: true,
            productId: 3,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockUsers: User[] = [
      {
        id: 1,
        name: "Juan Perez",
        email: "juan@example.com",
        roleId: 4,
        status: "ACTIVE",
        points: 1500,
        dni: "12345678",
        phone: "11223344",
        role: { id: 4, name: "CUSTOMER" },
      },
      {
        id: 2,
        name: "Maria Gomez",
        email: "maria@example.com",
        roleId: 4,
        status: "ACTIVE",
        points: 200,
        dni: "87654321",
        phone: "55443322",
        role: { id: 4, name: "CUSTOMER" },
      },
    ];

    useDataStore.getState().setProducts(mockProducts);
    useDataStore.getState().setUsers(mockUsers);
    useDataStore.getState().setLastSync(new Date().toISOString());
  },

  /**
   * Obtener historial de ventas
   */
  async getSales(params: any = {}) {
    try {
      const response = await SalesAPI.getAll({ ...params, orderBy: "desc" });

      // Extraer solo el array de datos de la respuesta paginada
      return response.data?.data || response.data || [];
    } catch (error) {
      return [];
    }
  },
};
