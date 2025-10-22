import { Transaction, Insights, CategoryBreakdown, DateRange, MonthlyTrend } from '@/types';

export function generateInsights(transactions: Transaction[]): Insights {
  if (transactions.length === 0) {
    throw new Error('No transactions provided');
  }

  // Basic insights
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = transactions.length;
  const averageTransaction = totalSpent / totalTransactions;
  const highestExpense = Math.max(...transactions.map(t => t.amount));
  const lowestExpense = Math.min(...transactions.map(t => t.amount));

  // Category analysis
  const categoryTotals = getCategoryBreakdown(transactions);
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1].amount - a[1].amount);
  const topCategory = sortedCategories[0][0];
  const topCategoryAmount = sortedCategories[0][1].amount;
  const topCategoryPercentage = (topCategoryAmount / totalSpent) * 100;

  // Date range
  const dates = transactions.map(t => new Date(t.date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const daysCovered = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const dateRange: DateRange = {
    startDate: minDate.toISOString().split('T')[0],
    endDate: maxDate.toISOString().split('T')[0],
    daysCovered
  };

  const dailyAverage = totalSpent / daysCovered;

  // Monthly trends
  const monthlyTrend = getMonthlyTrend(transactions);

  // Warnings and recommendations
  const warnings = generateWarnings(totalSpent, dailyAverage, topCategoryPercentage, categoryTotals);
  const recommendations = generateRecommendations(topCategoryPercentage, dailyAverage, Object.keys(categoryTotals).length);

  return {
    totalSpent,
    totalTransactions,
    averageTransaction,
    highestExpense,
    lowestExpense,
    topCategory,
    topCategoryAmount,
    topCategoryPercentage,
    categoryBreakdown: categoryTotals,
    dateRange,
    dailyAverage,
    monthlyTrend,
    warnings,
    recommendations
  };
}

function getCategoryBreakdown(transactions: Transaction[]): Record<string, CategoryBreakdown> {
  const categoryMap = new Map<string, { amount: number; count: number }>();
  
  transactions.forEach(transaction => {
    const existing = categoryMap.get(transaction.category) || { amount: 0, count: 0 };
    categoryMap.set(transaction.category, {
      amount: existing.amount + transaction.amount,
      count: existing.count + 1
    });
  });

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const breakdown: Record<string, CategoryBreakdown> = {};

  categoryMap.forEach((data, category) => {
    breakdown[category] = {
      amount: data.amount,
      percentage: (data.amount / totalSpent) * 100,
      transactionCount: data.count
    };
  });

  return breakdown;
}

function getMonthlyTrend(transactions: Transaction[]): MonthlyTrend | undefined {
  const monthlyData: Record<string, number> = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + transaction.amount;
  });

  const months = Object.keys(monthlyData).sort();
  if (months.length <= 1) {
    return undefined;
  }

  const firstMonthAmount = monthlyData[months[0]];
  const lastMonthAmount = monthlyData[months[months.length - 1]];
  const trendDirection = lastMonthAmount > firstMonthAmount ? 'increasing' : 'decreasing';

  return {
    trendDirection,
    monthlyData
  };
}

function generateWarnings(
  totalSpent: number,
  dailyAverage: number,
  topCategoryPercentage: number,
  categoryBreakdown: Record<string, CategoryBreakdown>
): string[] {
  const warnings: string[] = [];

  if (dailyAverage > 100) {
    warnings.push(`High daily spending average: $${dailyAverage.toFixed(2)}`);
  }

  if (topCategoryPercentage > 50) {
    const topCategory = Object.entries(categoryBreakdown).find(([_, data]) => data.percentage === topCategoryPercentage)?.[0];
    warnings.push(`High concentration in ${topCategory}: ${topCategoryPercentage.toFixed(1)}%`);
  }

  return warnings;
}

function generateRecommendations(
  topCategoryPercentage: number,
  dailyAverage: number,
  categoryCount: number
): string[] {
  const recommendations: string[] = [];

  if (topCategoryPercentage > 40) {
    recommendations.push('Consider reducing spending in your top category');
  }

  if (dailyAverage > 50) {
    recommendations.push('Try to reduce daily spending average');
  }

  if (categoryCount < 5) {
    recommendations.push('Consider categorizing expenses more granularly for better tracking');
  }

  return recommendations;
}
