import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Transaction, ParsedData } from '@/types';

export function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as any[];
          const transactions = standardizeData(data);
          resolve({ data: transactions, errors: results.errors.map(e => e.message) });
        } catch (error) {
          reject(new Error(`Error parsing CSV: ${error}`));
        }
      },
      error: (error) => {
        reject(new Error(`Error parsing CSV: ${error.message}`));
      }
    });
  });
}

export function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const transactions = standardizeData(jsonData);
        resolve({ data: transactions });
      } catch (error) {
        reject(new Error(`Error parsing Excel: ${error}`));
      }
    };
    reader.onerror = () => reject(new Error('Error reading Excel file'));
    reader.readAsBinaryString(file);
  });
}

export function parseManualInput(manualData: string): ParsedData {
  try {
    const data = JSON.parse(manualData);
    const transactions = standardizeData(data);
    return { data: transactions };
  } catch (error) {
    throw new Error(`Error parsing manual data: ${error}`);
  }
}

function standardizeData(data: any[]): Transaction[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No valid data provided');
  }

  // Standardize column names (case-insensitive)
  const standardizedData = data.map(row => {
    const standardized: any = {};
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().trim();
      standardized[lowerKey] = row[key];
    });
    return standardized;
  });

  // Map common column variations
  const columnMapping = {
    'date': ['date', 'transaction_date', 'transaction date'],
    'category': ['category', 'type', 'expense_category', 'expense category'],
    'amount': ['amount', 'value', 'cost', 'price'],
    'description': ['description', 'desc', 'details', 'memo', 'note'],
    'merchant': ['merchant', 'store', 'vendor'],
    'paymentmethod': ['payment method', 'payment_method', 'payment_type', 'payment type']
  };

  const mappedData = standardizedData.map(row => {
    const mapped: any = {};
    
    // Find matching columns for each standard field
    Object.entries(columnMapping).forEach(([standardName, variations]) => {
      for (const col of Object.keys(row)) {
        if (variations.includes(col)) {
          mapped[standardName] = row[col];
          break;
        }
      }
    });

    return mapped;
  });

  // Ensure required columns exist
  const requiredColumns = ['date', 'category', 'amount', 'description'];
  const missingColumns = requiredColumns.filter(col => !mappedData[0] || !(col in mappedData[0]));
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Clean and validate data
  const cleanedData = mappedData
    .filter(row => row.date && row.amount !== undefined && row.amount !== null && row.amount !== '')
    .map(row => {
      // Parse date
      let parsedDate: string;
      try {
        const date = new Date(row.date);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        parsedDate = date.toISOString().split('T')[0];
      } catch {
        throw new Error(`Invalid date format: ${row.date}`);
      }

      // Parse amount
      const amount = parseFloat(row.amount);
      if (isNaN(amount)) {
        throw new Error(`Invalid amount: ${row.amount}`);
      }

      // Clean category data
      const category = String(row.category || 'Uncategorized').trim().replace(/,/g, ' - ');

      return {
        date: parsedDate,
        category,
        amount,
        description: String(row.description || 'No description').trim(),
        merchant: row.merchant ? String(row.merchant).trim() : undefined,
        paymentMethod: row.paymentmethod ? String(row.paymentmethod).trim() : undefined
      } as Transaction;
    });

  if (cleanedData.length === 0) {
    throw new Error('No valid transactions found after cleaning data');
  }

  return cleanedData;
}
