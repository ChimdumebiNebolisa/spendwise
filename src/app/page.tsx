'use client';

import React, { useState, useRef } from 'react';
import { parseCSV, parseExcel, parseManualInput } from '@/lib/parsers';
import { generateInsights } from '@/lib/analytics';
import { Transaction, Insights } from '@/types';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [manualData, setManualData] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = (file: File, type: 'csv' | 'excel') => {
    setError('');
    if (type === 'csv') {
      setCsvFile(file);
      setExcelFile(null);
    } else {
      setExcelFile(file);
      setCsvFile(null);
    }
  };

  const handleManualDataChange = (data: string) => {
    setManualData(data);
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        setManualTransactions(parsed);
      }
    } catch {
      setManualTransactions([]);
    }
  };

  const addManualTransaction = () => {
    const newTransaction: Transaction = {
      date: new Date().toISOString().split('T')[0],
      category: '',
      amount: 0,
      description: ''
    };
    setManualTransactions([...manualTransactions, newTransaction]);
  };

  const updateManualTransaction = (index: number, field: keyof Transaction, value: string | number) => {
    const updated = [...manualTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setManualTransactions(updated);
  };

  const removeManualTransaction = (index: number) => {
    setManualTransactions(manualTransactions.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');

    try {
      let transactions: Transaction[] = [];

      if (csvFile) {
        const result = await parseCSV(csvFile);
        transactions = result.data;
      } else if (excelFile) {
        const result = await parseExcel(excelFile);
        transactions = result.data;
      } else if (manualData) {
        const result = parseManualInput(manualData);
        transactions = result.data;
      } else if (manualTransactions.length > 0) {
        transactions = manualTransactions.filter(t => t.category && t.amount !== 0);
      } else {
        throw new Error('Please upload a file or enter manual data');
      }

      if (transactions.length === 0) {
        throw new Error('No valid transactions found');
      }

      const insights = generateInsights(transactions);
      
      // Store data in sessionStorage for the results page
      sessionStorage.setItem('spendwise-transactions', JSON.stringify(transactions));
      sessionStorage.setItem('spendwise-insights', JSON.stringify(insights));
      
      router.push('/results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <i className="fas fa-chart-line text-blue-600"></i> SpendWise
          </h1>
          <p className="text-gray-600 text-lg">Analyze your spending patterns and gain financial insights</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-400 text-red-700">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              <i className="fas fa-upload text-blue-600"></i> Upload Your Spending Data
            </h2>
            
            <div className="space-y-6">
              {/* CSV Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <i className="fas fa-file-csv text-3xl text-green-600 mb-3"></i>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">CSV File Upload</h3>
                  <p className="text-gray-600 mb-4">Upload a CSV file with columns: Date, Category, Amount, Description</p>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'csv')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  
                  {csvFile && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fas fa-file-csv text-green-600 mr-2"></i>
                          <span className="text-green-800 font-medium">{csvFile.name}</span>
                          <span className="text-green-600 text-sm ml-2">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCsvFile(null);
                            if (csvInputRef.current) csvInputRef.current.value = '';
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Excel Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <i className="fas fa-file-excel text-3xl text-green-600 mb-3"></i>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Excel File Upload</h3>
                  <p className="text-gray-600 mb-4">Upload an Excel file (.xlsx or .xls) with the same column structure</p>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'excel')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  
                  {excelFile && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fas fa-file-excel text-green-600 mr-2"></i>
                          <span className="text-green-800 font-medium">{excelFile.name}</span>
                          <span className="text-green-600 text-sm ml-2">({(excelFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setExcelFile(null);
                            if (excelInputRef.current) excelInputRef.current.value = '';
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <i className="fas fa-keyboard text-3xl text-blue-600 mb-3"></i>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Manual Data Entry</h3>
                  <p className="text-gray-600 mb-4">Enter your spending data manually</p>
                  
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowManualInput(!showManualInput)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {showManualInput ? 'Hide' : 'Show'} Manual Entry Form
                    </button>

                    {showManualInput && (
                      <div className="space-y-4">
                        <div className="text-left">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            JSON Data (Alternative to form below):
                          </label>
                          <textarea
                            value={manualData}
                            onChange={(e) => handleManualDataChange(e.target.value)}
                            placeholder='[{"date": "2024-01-01", "category": "Food", "amount": 25.50, "description": "Lunch"}]'
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                          />
                        </div>

                        <div className="text-left">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">Manual Transactions:</label>
                            <button
                              type="button"
                              onClick={addManualTransaction}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Add Transaction
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {manualTransactions.map((transaction, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border border-gray-200 rounded-lg">
                                <input
                                  type="date"
                                  value={transaction.date}
                                  onChange={(e) => updateManualTransaction(index, 'date', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Category"
                                  value={transaction.category}
                                  onChange={(e) => updateManualTransaction(index, 'category', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={transaction.amount || ''}
                                  onChange={(e) => updateManualTransaction(index, 'amount', parseFloat(e.target.value) || 0)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Description"
                                  value={transaction.description}
                                  onChange={(e) => updateManualTransaction(index, 'description', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeManualTransaction(index)}
                                  className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <div className="text-center">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!csvFile && !excelFile && !manualData && manualTransactions.length === 0)}
                  className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-chart-line mr-2"></i>
                      Analyze Spending
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}