import api from "./api";

export interface FinancialStats {
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalCOGS: number;
  totalOperatingExpenses: number;
  grossProfit: number;
  netProfit: number;
  netMargin: number;
  totalCashOutflow: number;
  chartData: {
    name: string;
    revenue: number;
    cogs: number;
    operatingExpenses?: number;
    profit: number;
    cashOutflow: number;
  }[];
  baseCurrency: string;
}

export interface StockValuation {
  totalValue: number;
  totalItems: number;
  totalSkus: number;
  byCategory: { name: string; value: number }[];
  topItems: {
    name: string;
    stock: number;
    unitCost: number;
    totalValue: number;
  }[];
}

const reportService = {
  getFinancialStats: async (params?: any): Promise<FinancialStats> => {
    const { data } = await api.get<{ success: boolean; data: FinancialStats }>(
      "/reports/financial",
      { params },
    );
    return data.data;
  },

  getStockValuation: async (params?: any): Promise<StockValuation> => {
    const { data } = await api.get<{ success: boolean; data: StockValuation }>(
      "/reports/stock-valuation",
      { params },
    );
    return data.data;
  },
};

export default reportService;
