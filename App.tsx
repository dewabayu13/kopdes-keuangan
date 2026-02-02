import React, { useState, useEffect } from 'react';
import { LOCATIONS, formatCurrency } from './constants';
import { ProjectData, ExpenseCategory, ExpenseItem, Laborer } from './types';
import { ExcelUploader } from './components/ExcelUploader';
import { EvidenceUploader } from './components/EvidenceUploader';
import { CoverPage, ResumeReport, MaterialReport, RentalReport, LaborReport, EvidenceReport, CostDetailReport } from './components/Reports';
import { 
  PrinterIcon, 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  PencilSquareIcon, 
  CheckIcon, 
  XMarkIcon, 
  BanknotesIcon, 
  CalculatorIcon, 
  PhotoIcon,
  Bars3Icon,
  ChevronLeftIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// --- IndexedDB Helpers ---
const DB_NAME = 'KopdesDB';
const STORE_NAME = 'projects';
const DATA_KEY = 'kopdes_data_v2';

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
        request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
};

const dbSave = async (data: any) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, DATA_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

const dbLoad = async (): Promise<any> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(DATA_KEY);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};
// -------------------------

const App: React.FC = () => {
  const [selectedLocId, setSelectedLocId] = useState<number>(1);
  const [activeTermin, setActiveTermin] = useState<number>(1); // 1 to 5
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  // State initialization: start empty, load async
  const [projects, setProjects] = useState<Record<number, ProjectData>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<'input' | 'reports'>('input');
  const [activeForm, setActiveForm] = useState<'material' | 'labor'>('material');
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  // Edit States
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [contractInput, setContractInput] = useState("");

  // LOAD DATA
  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Try Loading from IndexedDB
            const dbData = await dbLoad();
            
            if (dbData && Object.keys(dbData).length > 0) {
                // Sanitize / Migration Logic
                Object.values(dbData).forEach((p: any) => {
                    if (p.laborers) {
                        p.laborers = p.laborers.map((l: any) => ({
                            ...l,
                            phase: l.phase || 1,
                            weeklyDays: l.weeklyDays || Array(16).fill(0)
                        }));
                    }
                    if (p.expenses) {
                        p.expenses = p.expenses.map((e: any) => ({
                            ...e,
                            phase: e.phase || 1
                        }));
                    }
                });
                setProjects(dbData);
            } else {
                // 2. Fallback: Check LocalStorage (Migration from old version)
                const local = localStorage.getItem('kopdes_project_data_v2');
                if (local) {
                    try {
                        const parsed = JSON.parse(local);
                        // Apply similar sanitization if needed
                        setProjects(parsed);
                        // Save to DB immediately to complete migration
                        await dbSave(parsed);
                        // Optional: localStorage.removeItem('kopdes_project_data_v2'); 
                    } catch (e) {
                        console.error("Local storage parse error", e);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load data from DB", e);
        } finally {
            setIsDataLoaded(true);
        }
    };
    loadData();
  }, []);

  // SAVE DATA
  useEffect(() => {
      if (!isDataLoaded) return; // Don't overwrite DB with empty state on initial mount

      const timer = setTimeout(async () => {
          if (Object.keys(projects).length > 0) {
              try {
                await dbSave(projects);
                setShowSaveIndicator(true);
                setTimeout(() => setShowSaveIndicator(false), 2000);
              } catch (e) {
                  console.error("Save failed", e);
                  // Silently fail or retry, but don't crash app
              }
          }
      }, 1000); // Debounce save

      return () => clearTimeout(timer);
  }, [projects, isDataLoaded]);

  const generateDefaultData = (id: number): ProjectData => ({
        locationId: id,
        budget: 1000000000, 
        receivedBudget: 200000000,
        expenses: [],
        laborers: []
  });

  const getProjectData = (id: number): ProjectData => {
    return projects[id] || generateDefaultData(id);
  };

  const currentData = getProjectData(selectedLocId);
  const terminExpenses = currentData.expenses.filter(e => e.phase === activeTermin);
  const terminLaborers = currentData.laborers.filter(l => l.phase === activeTermin);
  
  const TERMIN_BUDGET = 200000000;
  const terminMaterialTotal = terminExpenses.reduce((sum, e) => sum + e.totalPrice, 0);
  const terminLaborTotal = terminLaborers.reduce((sum, l) => {
        const totalDays = l.weeklyDays.reduce((a, b) => a + b, 0);
        return sum + (totalDays * l.dailyRate) + (l.overtimeHours * l.overtimeRate);
  }, 0);
  const terminTotalExpenses = terminMaterialTotal + terminLaborTotal;
  const terminCashBalance = TERMIN_BUDGET - terminTotalExpenses;

  const updateProject = (id: number, data: ProjectData) => {
    setProjects(prev => ({ ...prev, [id]: data }));
  };

  const handleResetLocation = () => {
    if (confirm(`Reset data untuk LOKASI ini (Termin ${activeTermin} saja)? Data termin lain aman.`)) {
        const cleanedExpenses = currentData.expenses.filter(e => e.phase !== activeTermin);
        const cleanedLaborers = currentData.laborers.filter(l => l.phase !== activeTermin);
        updateProject(selectedLocId, { ...currentData, expenses: cleanedExpenses, laborers: cleanedLaborers });
    }
  };

  const handlePrint = () => {
      if (activeTab !== 'reports') {
          setActiveTab('reports');
          setTimeout(() => window.print(), 500);
      } else {
          window.print();
      }
  };

  const startEditingContract = () => {
    setContractInput(currentData.budget.toString());
    setIsEditingContract(true);
  };

  const saveContract = () => {
      const val = parseFloat(contractInput);
      if (!isNaN(val) && val >= 0) {
          updateProject(selectedLocId, { ...currentData, budget: val });
      }
      setIsEditingContract(false);
  };

  const handleAddExpense = (items: Partial<ExpenseItem>[]) => {
      const newItems = items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          phase: activeTermin,
          category: item.category || ExpenseCategory.MATERIAL,
          totalPrice: (item.volume || 0) * (item.pricePerUnit || 0)
      } as ExpenseItem));

      setProjects(prev => {
          const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
          return { ...prev, [selectedLocId]: { ...project, expenses: [...newItems, ...project.expenses] } };
      });
  };

  const handleUpdateExpense = (id: string, field: keyof ExpenseItem, value: any) => {
      setProjects(prev => {
          const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
          const updatedExpenses = project.expenses.map(exp => {
            if (exp.id === id) {
                const updated = { ...exp, [field]: value };
                if (field === 'volume' || field === 'pricePerUnit') {
                    updated.totalPrice = Number(updated.volume) * Number(updated.pricePerUnit);
                }
                return updated;
            }
            return exp;
          });
          return { ...prev, [selectedLocId]: { ...project, expenses: updatedExpenses } };
      });
  };

  const handleBatchAddLaborers = (items: Partial<Laborer>[]) => {
      const newLaborers = items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          name: item.name || 'Pekerja Baru',
          position: item.position || 'Laden',
          dailyRate: item.dailyRate || 100000,
          overtimeRate: item.overtimeRate || 30000,
          weeklyDays: item.weeklyDays || Array(16).fill(0),
          overtimeHours: item.overtimeHours || 0,
          phase: activeTermin
      } as Laborer));

      setProjects(prev => {
          const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
          return { ...prev, [selectedLocId]: { ...project, laborers: [...project.laborers, ...newLaborers] } };
      });
  };

  const handleUpdateLabor = (laborId: string, field: keyof Laborer, value: any) => {
      setProjects(prev => {
          const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
          const updatedLaborers = project.laborers.map(l => l.id === laborId ? { ...l, [field]: value } : l);
          return { ...prev, [selectedLocId]: { ...project, laborers: updatedLaborers } };
      });
  }

  const handleUpdateWeek = (laborId: string, weekIndex: number, value: string) => {
      let numVal = parseInt(value) || 0;
      numVal = Math.max(0, Math.min(7, numVal));

      setProjects(prev => {
          const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
          const updatedLaborers = project.laborers.map(l => {
              if (l.id === laborId) {
                  const newWeeks = [...l.weeklyDays];
                  newWeeks[weekIndex] = numVal;
                  return { ...l, weeklyDays: newWeeks };
              }
              return l;
          });
          return { ...prev, [selectedLocId]: { ...project, laborers: updatedLaborers } };
      });
  }

  const handleAddLaborer = () => {
      const newLaborer: Laborer = {
          id: Math.random().toString(36).substr(2, 9),
          name: "Pekerja Baru",
          position: "Laden",
          dailyRate: 100000,
          overtimeRate: 30000,
          weeklyDays: Array(16).fill(0),
          overtimeHours: 0,
          phase: activeTermin
      };
      setProjects(prev => {
          const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
          return { ...prev, [selectedLocId]: { ...project, laborers: [...project.laborers, newLaborer] } };
      });
  };

  const copyLaborersFromPreviousTermin = () => {
      if (activeTermin === 1) return;
      const prevTermin = activeTermin - 1;
      const prevLaborers = currentData.laborers.filter(l => l.phase === prevTermin);
      
      if (prevLaborers.length === 0) {
          alert(`Tidak ada pekerja di Termin ${prevTermin} untuk disalin.`);
          return;
      }

      if (confirm(`Salin ${prevLaborers.length} pekerja dari Termin ${prevTermin} ke Termin ${activeTermin}?`)) {
          const newLaborers = prevLaborers.map(l => ({
              ...l,
              id: Math.random().toString(36).substr(2, 9),
              phase: activeTermin,
              weeklyDays: Array(16).fill(0),
              overtimeHours: 0
          }));

           setProjects(prev => {
            const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
            return { ...prev, [selectedLocId]: { ...project, laborers: [...project.laborers, ...newLaborers] } };
        });
      }
  }

  const handleDeleteLaborer = (laborId: string) => {
      setProjects(prev => {
          const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
          return { ...prev, [selectedLocId]: { ...project, laborers: project.laborers.filter(l => l.id !== laborId) } };
      });
  };

  const handleDeleteExpense = (expenseId: string) => {
      setProjects(prev => {
          const project = prev[selectedLocId] || generateDefaultData(selectedLocId);
          return { ...prev, [selectedLocId]: { ...project, expenses: project.expenses.filter(e => e.id !== expenseId) } };
      });
  };

  const currentLoc = LOCATIONS.find(l => l.id === selectedLocId);

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible print:block relative bg-gray-100">
      
      {/* Sidebar - Collapsible */}
      <aside 
        className={`bg-slate-900 text-white flex flex-col overflow-y-auto no-print transition-all duration-300 ease-in-out shadow-2xl z-40 ${isSidebarOpen ? 'w-64' : 'w-0'}`}
      >
        <div className={`p-6 border-b border-slate-700 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">KOPDES</h1>
                    <p className="text-xs text-slate-400">Sistem Keuangan Proyek</p>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
        <nav className={`flex-1 p-4 space-y-1 overflow-x-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
            <p className="px-2 text-xs font-semibold text-slate-500 uppercase mb-2">Pilih Lokasi</p>
            {LOCATIONS.map(loc => (
                <button
                    key={loc.id}
                    onClick={() => {
                        setSelectedLocId(loc.id);
                        setIsEditingContract(false);
                        setActiveTab('input'); // Default back to input when switching location
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedLocId === loc.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                    <div className="font-medium truncate">{loc.desa}</div>
                    <div className="text-xs opacity-70">KEC. {loc.kecamatan}</div>
                </button>
            ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-8 print:p-0 print:bg-white print:overflow-visible print:h-auto print:block transition-all duration-300">
        
        {/* Header (No Print) */}
        <div className="flex justify-between items-center mb-6 no-print">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-gray-200"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900">DESA {currentLoc?.desa}</h2>
                        {showSaveIndicator && (
                            <span className="hidden md:flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                <CheckCircleIcon className="w-3 h-3 mr-1" /> Tersimpan
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm">Manajemen Laporan Keuangan Pembangunan</p>
                </div>
            </div>
            
            <div className="flex space-x-3">
                 {activeTab === 'reports' && (
                    <button 
                        onClick={() => setActiveTab('input')}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center hover:bg-gray-50 transition-colors shadow-sm font-semibold"
                    >
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Tutup Preview
                    </button>
                 )}

                 <button 
                    onClick={handleResetLocation}
                    className="bg-white text-red-600 border border-red-200 px-3 py-2 rounded-lg flex items-center hover:bg-red-50 transition-colors shadow-sm text-sm"
                 >
                    <ArrowPathIcon className="w-4 h-4 mr-1" /> Reset Termin
                 </button>

                 <button 
                    onClick={handlePrint}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center hover:bg-indigo-700 shadow-lg transition-all font-semibold"
                 >
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Print Laporan
                 </button>
            </div>
        </div>

        {/* PERSISTENT NAVIGATION TABS (NO PRINT) */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 no-print">
            <div className="flex space-x-2 bg-gray-200 p-1 rounded-xl w-max">
                <button 
                    onClick={() => setActiveTab('input')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'input' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Data Input
                </button>
                <button 
                    onClick={() => setActiveTab('reports')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Preview Laporan
                </button>
            </div>

            <div className="flex space-x-2 p-1 bg-white rounded-xl shadow-sm border border-gray-200 w-max overflow-x-auto">
                {[1, 2, 3, 4, 5].map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTermin(t)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTermin === t 
                            ? 'bg-slate-800 text-white shadow-md' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                    >
                        T-{t}
                    </button>
                ))}
            </div>
        </div>

        {/* --- INPUT VIEW --- */}
        {activeTab === 'input' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg border border-slate-700 relative group">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nilai Kontrak Total</p>
                                {isEditingContract ? (
                                    <div className="flex items-center gap-1 mt-1">
                                        <input type="number" value={contractInput} onChange={(e) => setContractInput(e.target.value)} className="w-full bg-slate-700 border-slate-600 rounded text-white text-sm p-1" autoFocus onKeyDown={(e) => e.key==='Enter' && saveContract()} />
                                        <button onClick={saveContract} className="text-green-400"><CheckIcon className="w-4 h-4"/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-bold mt-1 truncate">{formatCurrency(currentData.budget)}</p>
                                        <button onClick={startEditingContract} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"><PencilSquareIcon className="w-4 h-4" /></button>
                                    </div>
                                )}
                             </div>
                             <BanknotesIcon className="w-8 h-8 text-slate-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Anggaran Termin {activeTermin}</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(TERMIN_BUDGET)}</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengeluaran T-{activeTermin}</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(terminTotalExpenses)}</p>
                    </div>

                    <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 ${terminCashBalance < 0 ? 'border-l-red-600' : 'border-l-emerald-500'}`}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sisa Kas (T-{activeTermin})</p>
                        <p className={`text-2xl font-bold mt-1 ${terminCashBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {formatCurrency(terminCashBalance)}
                        </p>
                    </div>
                </div>

                {/* Input Content */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden min-h-[500px]">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex gap-6">
                        <button onClick={() => setActiveForm('material')} className={`pb-1 text-sm font-bold border-b-2 transition-all ${activeForm === 'material' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>MATERIAL & SEWA</button>
                        <button onClick={() => setActiveForm('labor')} className={`pb-1 text-sm font-bold border-b-2 transition-all ${activeForm === 'labor' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>ABSENSI & UPAH</button>
                    </div>
                    
                    <div className="p-6">
                        {activeForm === 'material' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <ExcelUploader onDataLoaded={handleAddExpense} />
                                    <EvidenceUploader 
                                        label="Scan/Upload Nota Material"
                                        subLabel="Upload bukti belanja material bangunan"
                                        onImagesLoaded={handleAddExpense} 
                                        category={ExpenseCategory.MATERIAL}
                                        colorTheme="purple"
                                    />
                                    <EvidenceUploader 
                                        label="Scan/Upload Kwitansi Sewa"
                                        subLabel="Upload bukti sewa peralatan/mesin"
                                        onImagesLoaded={handleAddExpense} 
                                        category={ExpenseCategory.SEWA}
                                        colorTheme="orange"
                                    />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                                        <thead className="bg-gray-50 uppercase text-gray-400 font-bold">
                                            <tr>
                                                <th className="px-3 py-2 text-left w-24">Tanggal</th>
                                                <th className="px-3 py-2 text-left w-24">Kategori</th>
                                                <th className="px-3 py-2 text-left">Barang</th>
                                                <th className="px-3 py-2 text-right w-16">Vol</th>
                                                <th className="px-3 py-2 text-right w-24">Harga</th>
                                                <th className="px-3 py-2 text-right w-24">Total</th>
                                                <th className="px-3 py-2 text-center w-10">#</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {terminExpenses.map((expense) => (
                                                <tr key={expense.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2"><input type="date" value={expense.date} onChange={(e) => handleUpdateExpense(expense.id, 'date', e.target.value)} className="bg-transparent border-none p-0 text-xs w-full" /></td>
                                                    <td className="px-3 py-2">
                                                        <select 
                                                            value={expense.category} 
                                                            onChange={(e) => handleUpdateExpense(expense.id, 'category', e.target.value)}
                                                            className="bg-transparent border-none p-0 text-xs w-full focus:ring-0 font-medium text-gray-600"
                                                        >
                                                            <option value={ExpenseCategory.MATERIAL}>MATERIAL</option>
                                                            <option value={ExpenseCategory.SEWA}>SEWA ALAT</option>
                                                            <option value={ExpenseCategory.LAINNYA}>LAINNYA</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2 flex items-center gap-2">
                                                        {expense.evidenceImage && <PhotoIcon className="w-4 h-4 text-indigo-500 shrink-0" />}
                                                        <input type="text" value={expense.description} onChange={(e) => handleUpdateExpense(expense.id, 'description', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0" />
                                                    </td>
                                                    <td className="px-3 py-2 text-right"><input type="number" value={expense.volume} onChange={(e) => handleUpdateExpense(expense.id, 'volume', e.target.value)} className="w-full text-right bg-transparent border-none p-0" /></td>
                                                    <td className="px-3 py-2 text-right"><input type="number" value={expense.pricePerUnit} onChange={(e) => handleUpdateExpense(expense.id, 'pricePerUnit', e.target.value)} className="w-full text-right bg-transparent border-none p-0" /></td>
                                                    <td className="px-3 py-2 font-bold text-right">{formatCurrency(expense.totalPrice).replace('Rp', '')}</td>
                                                    <td className="px-3 py-2 text-center"><button onClick={() => handleDeleteExpense(expense.id)} className="text-gray-300 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-6 flex gap-4 items-start">
                                    <div className="flex-1"><ExcelUploader mode="labor" onDataLoaded={handleBatchAddLaborers} /></div>
                                    {activeTermin > 1 && (
                                        <button onClick={copyLaborersFromPreviousTermin} className="h-[88px] px-6 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-600 transition-colors">
                                            <DocumentDuplicateIcon className="w-6 h-6 mb-2" />
                                            <span className="text-xs font-bold">Copy T-{activeTermin - 1}</span>
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-max border border-gray-200 text-xs">
                                        <thead className="bg-gray-50 font-bold uppercase text-gray-500">
                                            <tr>
                                                <th className="px-3 py-2 text-left sticky left-0 bg-gray-50 z-10 border-r w-40">NAMA</th>
                                                <th className="px-3 py-2 text-right w-24">RATE (Rp)</th>
                                                {Array.from({length: 16}).map((_, i) => <th key={i} className="px-1 py-2 text-center">M{i+1}</th>)}
                                                <th className="px-3 py-2 text-right font-bold text-gray-900">UPAH</th>
                                                <th className="px-3 py-2 text-center">#</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {terminLaborers.map((labor) => {
                                                const totalDays = labor.weeklyDays.reduce((a, b) => a + b, 0);
                                                const totalPay = (totalDays * labor.dailyRate) + (labor.overtimeHours * labor.overtimeRate);
                                                return (
                                                    <tr key={labor.id} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r shadow-sm font-bold">
                                                            <input type="text" value={labor.name} onChange={(e) => handleUpdateLabor(labor.id, 'name', e.target.value)} className="w-full border-none p-0 focus:ring-0" />
                                                        </td>
                                                        <td className="px-3 py-2 text-right"><input type="number" value={labor.dailyRate} onChange={(e) => handleUpdateLabor(labor.id, 'dailyRate', parseInt(e.target.value))} className="w-16 text-right bg-transparent border-none p-0" /></td>
                                                        {labor.weeklyDays.map((days, i) => (
                                                            <td key={i} className="px-1 py-2 text-center">
                                                                <input type="number" value={days} onChange={(e) => handleUpdateWeek(labor.id, i, e.target.value)} className={`w-8 text-center border-none p-0 ${days > 0 ? 'font-bold text-indigo-600' : 'text-gray-300'}`} />
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-2 text-right font-bold">{formatCurrency(totalPay).replace('Rp','')}</td>
                                                        <td className="px-3 py-2 text-center"><button onClick={() => handleDeleteLaborer(labor.id)} className="text-gray-300 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={handleAddLaborer} className="mt-4 flex items-center text-xs text-indigo-600 font-bold hover:underline"><PlusIcon className="w-4 h-4 mr-1" /> TAMBAH PEKERJA</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- REPORT VIEW --- */}
        {activeTab === 'reports' && (
             <div className="flex flex-col items-center print:block print:w-full animate-in zoom-in-95 duration-500">
                <div className="no-print mb-8 w-full max-w-4xl bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <PrinterIcon className="w-6 h-6 text-indigo-600" />
                        <div>
                            <p className="font-bold text-indigo-900">Preview Laporan Termin {activeTermin}</p>
                            <p className="text-xs text-indigo-700">Tampilan ini adalah simulasi kertas A4 yang akan diprint.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActiveTab('input')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Kembali ke Input
                    </button>
                </div>

                <CoverPage data={currentData} locationId={selectedLocId} termin={activeTermin} />
                <ResumeReport data={currentData} locationId={selectedLocId} termin={activeTermin} />
                <CostDetailReport data={currentData} locationId={selectedLocId} termin={activeTermin} />
                <MaterialReport data={currentData} locationId={selectedLocId} termin={activeTermin} />
                <RentalReport data={currentData} locationId={selectedLocId} termin={activeTermin} />
                <EvidenceReport data={currentData} locationId={selectedLocId} termin={activeTermin} />
                <LaborReport data={currentData} locationId={selectedLocId} termin={activeTermin} />
             </div>
        )}

      </main>
    </div>
  );
};

export default App;
