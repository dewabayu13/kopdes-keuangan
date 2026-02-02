import React, { useState } from 'react';
import { read, utils } from 'xlsx';
import { ExpenseItem, ExpenseCategory, Laborer } from '../types';
import { TableCellsIcon, ArrowUpTrayIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Props {
  onDataLoaded: (items: any[]) => void;
  mode?: 'expense' | 'labor';
}

export const ExcelUploader: React.FC<Props> = ({ onDataLoaded, mode = 'expense' }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    setError(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = read(bstr, { type: 'binary' });
        
        // Grab the first sheet
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to JSON
        const data = utils.sheet_to_json(ws);

        if (data.length === 0) {
            throw new Error("File Excel kosong atau format tidak terbaca.");
        }

        const mappedItems = data.map((row: any) => {
            // Flexible column mapping (case insensitive matching)
            const keys = Object.keys(row);
            const getKey = (search: string) => keys.find(k => k.toLowerCase().includes(search));

            if (mode === 'labor') {
                const nameKey = getKey('nama') || getKey('name') || getKey('pekerja');
                const posKey = getKey('posisi') || getKey('jabatan') || getKey('role');
                const rateKey = getKey('harian') || getKey('gaji') || getKey('upah') || getKey('rate');
                const otKey = getKey('lembur') || getKey('overtime') || getKey('ot');

                // Determine position
                let position: 'Mandor' | 'Tukang' | 'Laden' = 'Laden';
                const rawPos = String(row[posKey!] || '').toLowerCase();
                if (rawPos.includes('mandor')) position = 'Mandor';
                else if (rawPos.includes('tukang')) position = 'Tukang';

                return {
                    name: row[nameKey!] || "Pekerja Import",
                    position: position,
                    dailyRate: Number(row[rateKey!]) || (position === 'Mandor' ? 160000 : position === 'Tukang' ? 140000 : 100000),
                    overtimeRate: Number(row[otKey!]) || (position === 'Mandor' ? 50000 : position === 'Tukang' ? 40000 : 30000),
                    weeklyDays: Array(16).fill(0), // Initialize empty 16 weeks
                    overtimeHours: 0
                } as Partial<Laborer>;

            } else {
                // Expense Mode
                const dateKey = getKey('tgl') || getKey('tanggal') || getKey('date');
                const descKey = getKey('uraian') || getKey('barang') || getKey('item') || getKey('deskripsi');
                const volKey = getKey('vol') || getKey('qty') || getKey('jumlah');
                const unitKey = getKey('satuan') || getKey('unit');
                const priceKey = getKey('harga') || getKey('price');
                const catKey = getKey('kategori') || getKey('cat');

                // Handle Excel dates (which can be numbers)
                let dateStr = new Date().toISOString().split('T')[0];
                if (dateKey && row[dateKey]) {
                    if (typeof row[dateKey] === 'number') {
                        // Excel serial date to JS Date
                        const date = new Date(Math.round((row[dateKey] - 25569)*86400*1000));
                        dateStr = date.toISOString().split('T')[0];
                    } else {
                        dateStr = String(row[dateKey]);
                    }
                }

                return {
                    date: dateStr,
                    category: (row[catKey!] as ExpenseCategory) || ExpenseCategory.MATERIAL,
                    description: (row[descKey!] as string) || "Item Excel",
                    volume: Number(row[volKey!]) || 1,
                    unit: (row[unitKey!] as string) || "ls",
                    pricePerUnit: Number(row[priceKey!]) || 0,
                    totalPrice: (Number(row[volKey!]) || 1) * (Number(row[priceKey!]) || 0),
                    phase: 1
                } as Partial<ExpenseItem>;
            }
        });

        onDataLoaded(mappedItems);
        setIsProcessing(false);

        // Reset file input slightly later
        setTimeout(() => {
            setFileName(null);
            if(e.target) e.target.value = '';
        }, 1000);

      } catch (err) {
        console.error(err);
        setError("Gagal memproses file. Pastikan format Excel (.xlsx/.xls) benar.");
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const isLabor = mode === 'labor';
  const themeColor = isLabor ? 'blue' : 'emerald';
  const ThemeIcon = isLabor ? UserGroupIcon : TableCellsIcon;

  // Dynamic Tailwind classes need to be safe-listed or complete strings, but for simple substitution:
  const bgClass = isLabor ? 'bg-blue-50' : 'bg-emerald-50';
  const borderClass = isLabor ? 'border-blue-100' : 'border-emerald-100';
  const textTitleClass = isLabor ? 'text-blue-900' : 'text-emerald-900';
  const textSubClass = isLabor ? 'text-blue-700' : 'text-emerald-700';
  const textHintClass = isLabor ? 'text-blue-600' : 'text-emerald-600';
  const iconClass = isLabor ? 'text-blue-600' : 'text-emerald-600';
  const btnClass = isLabor ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';
  const btnProcessingClass = isLabor ? 'bg-blue-400' : 'bg-emerald-400';

  return (
    <div className={`${bgClass} border ${borderClass} rounded-lg p-4 mb-6`}>
      <div className="flex items-center gap-4">
        <div className="bg-white p-2 rounded-full shadow-sm">
           <ThemeIcon className={`w-6 h-6 ${iconClass}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${textTitleClass}`}>Import {isLabor ? 'Data Pekerja' : 'Excel Batch'}</h3>
          <p className={`text-sm ${textSubClass}`}>
            {fileName ? `File terpilih: ${fileName}` : `Upload file Excel untuk input ${isLabor ? 'daftar pekerja' : 'data'} sekaligus.`}
          </p>
          <p className={`text-xs ${textHintClass} mt-1`}>
             Format Kolom: {isLabor ? 'Nama | Posisi | Harian (Rp) | Lembur (Rp)' : 'Tanggal | Uraian | Volume | Satuan | Harga Satuan'}
          </p>
        </div>
        <div>
           <input
            type="file"
            id={`excel-upload-${mode}`}
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isProcessing}
           />
           <label 
            htmlFor={`excel-upload-${mode}`} 
            className={`cursor-pointer px-4 py-2 rounded-md font-medium text-white transition-colors flex items-center ${isProcessing ? btnProcessingClass : btnClass}`}
           >
            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
            {isProcessing ? 'Importing...' : 'Upload Excel'}
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