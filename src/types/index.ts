export interface Transaction {
  date: string;
  category: string;
  amount: number;
  description: string;
  merchant?: string;
  paymentMethod?: string;
}

export interface CategoryBreakdown {
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  daysCovered: number;
}

export interface MonthlyTrend {
  trendDirection: 'increasing' | 'decreasing';
  monthlyData: Record<string, number>;
}

export interface Insights {
  totalSpent: number;
  totalTransactions: number;
  averageTransaction: number;
  highestExpense: number;
  lowestExpense: number;
  topCategory: string;
  topCategoryAmount: number;
  topCategoryPercentage: number;
  categoryBreakdown: Record<string, CategoryBreakdown>;
  dateRange: DateRange;
  dailyAverage: number;
  monthlyTrend?: MonthlyTrend;
  warnings: string[];
  recommendations: string[];
}

export interface ChartPaths {
  barChart: string;
  pieChart: string;
}

export interface ParsedData {
  data: Transaction[];
  errors?: string[];
}
