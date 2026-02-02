
export interface ProjectLocation {
  id: number;
  kecamatan: string;
  desa: string;
  coordinates?: string;
}

export enum ExpenseCategory {
  MATERIAL = 'MATERIAL',
  UPAH = 'UPAH',
  LAINNYA = 'BIAYA LAINNYA', // Operational/Sewa
  SEWA = 'PENYEWAAN'
}

export interface ExpenseItem {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string; // Item name
  volume: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  phase: number; // Termin 1, 2, 3, 4, 5
  evidenceImage?: string; // Base64 or URL
}

export interface Laborer {
  id: string;
  name: string;
  position: 'Mandor' | 'Tukang' | 'Laden';
  dailyRate: number;
  overtimeRate: number;
  weeklyDays: number[]; // Array of 16 numbers (weeks 1-16), value 0-7
  overtimeHours: number;
  phase: number; // Added to track which termin this labor record belongs to
}

export interface ProjectData {
  locationId: number;
  expenses: ExpenseItem[];
  laborers: Laborer[];
  budget: number; // Nilai Kontrak (Fixed 1M usually)
  receivedBudget: number; // Anggaran yang sudah masuk (Termin) - Deprecated logic, now fixed per termin
}
