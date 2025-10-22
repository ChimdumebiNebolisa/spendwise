'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, Insights } from '@/types';
import { SpendingByCategoryChart, SpendingDistributionChart } from '@/components/Charts';

export default function ResultsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load data from sessionStorage
    const storedTransactions = sessionStorage.getItem('spendwise-transactions');
    const storedInsights = sessionStorage.getItem('spendwise-insights');

    if (storedTransactions && storedInsights) {
      try {
        setTransactions(JSON.parse(storedTransactions));
        setInsights(JSON.parse(storedInsights));
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
          <p className="text-gray-600 mb-4">No data available</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <i className="fas fa-chart-line text-blue-600"></i> SpendWise Analysis
          </h1>
          <p className="text-gray-600 text-lg">Your spending insights and recommendations</p>
          <button
            onClick={() => router.push('/')}
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>Analyze New Data
          </button>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">${insights.totalSpent.toFixed(2)}</div>
              <div className="text-gray-600">Total Spent</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{insights.totalTransactions}</div>
              <div className="text-gray-600">Transactions</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">${insights.averageTransaction.toFixed(2)}</div>
              <div className="text-gray-600">Avg Transaction</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">${insights.dailyAverage.toFixed(2)}</div>
              <div className="text-gray-600">Daily Average</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-chart-bar text-blue-600"></i> Spending by Category
              </h3>
              <SpendingByCategoryChart transactions={transactions} />
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-chart-pie text-blue-600"></i> Spending Distribution
              </h3>
              <SpendingDistributionChart transactions={transactions} />
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Categories */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-trophy text-yellow-600"></i> Top Spending Categories
              </h3>
              <div className="space-y-3">
                {Object.entries(insights.categoryBreakdown)
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .map(([category, data]) => (
                    <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-800">{category}</div>
                        <div className="text-sm text-gray-600">{data.transactionCount} transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">${data.amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">{data.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Date Range & Trends */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-calendar-alt text-blue-600"></i> Analysis Period
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-semibold">{insights.dateRange.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-semibold">{insights.dateRange.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Covered:</span>
                  <span className="font-semibold">{insights.dateRange.daysCovered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Highest Expense:</span>
                  <span className="font-semibold text-red-600">${insights.highestExpense.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lowest Expense:</span>
                  <span className="font-semibold text-green-600">${insights.lowestExpense.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings & Recommendations */}
          {(insights.warnings.length > 0 || insights.recommendations.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {insights.warnings.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    <i className="fas fa-exclamation-triangle text-yellow-600"></i> Budget Warnings
                  </h3>
                  <div className="space-y-3">
                    {insights.warnings.map((warning, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <div className="text-yellow-800">{warning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights.recommendations.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    <i className="fas fa-lightbulb text-green-600"></i> Recommendations
                  </h3>
                  <div className="space-y-3">
                    {insights.recommendations.map((recommendation, index) => (
                      <div key={index} className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                        <div className="text-green-800">{recommendation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monthly Trends */}
          {insights.monthlyTrend && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-trending-up text-blue-600"></i> Monthly Spending Trend
              </h3>
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  insights.monthlyTrend.trendDirection === 'increasing' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {insights.monthlyTrend.trendDirection === 'increasing' ? (
                    <>
                      <i className="fas fa-arrow-up mr-1"></i>Increasing
                    </>
                  ) : (
                    <>
                      <i className="fas fa-arrow-down mr-1"></i>Decreasing
                    </>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(insights.monthlyTrend.monthlyData).map(([month, amount]) => (
                  <div key={month} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{month}</div>
                    <div className="font-semibold text-gray-800">${amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              <i className="fas fa-table text-blue-600"></i> Data Preview (First 10 Transactions)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <i className="fas fa-tag mr-2 text-green-600"></i>Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <i className="fas fa-dollar-sign mr-2 text-purple-600"></i>Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <i className="fas fa-file-alt mr-2 text-orange-600"></i>Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.slice(0, 10).map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                          {transaction.date}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <i className="fas fa-tag mr-1"></i>
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-100">
                        <span className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                        <div className="max-w-xs truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Data Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
                <div className="text-sm text-blue-800">Total Transactions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{Object.keys(insights.categoryBreakdown).length}</div>
                <div className="text-sm text-green-800">Unique Categories</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{insights.dateRange.daysCovered}</div>
                <div className="text-sm text-purple-800">Days Covered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
