import React, { useState } from 'react';
import { parseReceiptImage } from '../services/geminiService';
import { ExpenseItem, ExpenseCategory } from '../types';
import { ArrowPathIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface Props {
  onItemsDetected: (items: Partial<ExpenseItem>[]) => void;
}

export const ReceiptAnalyzer: React.FC<Props> = ({ onItemsDetected }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const result = await parseReceiptImage(base64String);
        
        if (result && result.items) {
          const detectedItems: Partial<ExpenseItem>[] = result.items.map((item: any) => ({
             date: result.date || new Date().toISOString().split('T')[0],
             description: item.description,
             volume: item.volume || 1,
             unit: item.unit || 'ls',
             pricePerUnit: item.pricePerUnit || 0,
             totalPrice: item.totalPrice || 0,
             category: ExpenseCategory.MATERIAL, // Default guess
             evidenceImage: base64String
          }));
          onItemsDetected(detectedItems);
        }
      } catch (err) {
        setError("Gagal menganalisis gambar. Pastikan API Key valid atau coba gambar yang lebih jelas.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="bg-white p-2 rounded-full shadow-sm">
           {isAnalyzing ? <ArrowPathIcon className="w-6 h-6 text-indigo-600 animate-spin" /> : <PhotoIcon className="w-6 h-6 text-indigo-600" />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-indigo-900">AI Scan Nota/Kwitansi</h3>
          <p className="text-sm text-indigo-700">Upload foto nota fisik untuk otomatis mengisi data belanja material.</p>
        </div>
        <div>
           <input
            type="file"
            id="receipt-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isAnalyzing}
           />
           <label 
            htmlFor="receipt-upload" 
            className={`cursor-pointer px-4 py-2 rounded-md font-medium text-white transition-colors ${isAnalyzing ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
           >
            {isAnalyzing ? 'Menganalisa...' : 'Upload Foto'}
           </label>
        </div>
      </div>
      {error && (
        <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
            {error}
        </div>
      )}
    </div>
  );
};
