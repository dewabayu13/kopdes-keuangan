import React, { useState } from 'react';
import { ProjectData, ExpenseCategory, ExpenseItem, Laborer } from '../types';
import { formatCurrency, LOCATIONS, terbilang } from '../constants';

interface ReportProps {
  data: ProjectData;
  locationId: number;
  termin: number;
}

const HeaderKorem = () => (
    <div className="absolute top-[20mm] left-[20mm] text-left leading-tight z-10">
        <p className="text-xs font-bold uppercase">KOREM 063/SUNAN GUNUNG JATI</p>
        <p className="text-xs font-bold uppercase">KOMANDO DISTRIK MILITER 0617</p>
    </div>
);

export const CoverPage: React.FC<ReportProps> = ({ locationId, termin }) => {
    const loc = LOCATIONS.find(l => l.id === locationId);
    const [logoError, setLogoError] = useState(false);
    const romanTermin = ["", "I", "II", "III", "IV", "V"][termin] || termin;

    return (
        <div className="a4-portrait page-break mb-8 mx-auto font-[Arial] relative flex flex-col">
             <div className="border-[6px] double border-black w-full h-full flex-1 flex flex-col items-center p-8 relative bg-white">
                
                {/* Logo Section */}
                <div className="w-full flex justify-center mb-6 mt-4 h-48 items-center">
                    {!logoError ? (
                        <img 
                            src="logo.png" 
                            alt="Logo Header" 
                            className="max-h-full max-w-[90%] object-contain" 
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div className="w-40 h-40 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 rounded-lg print:border-black">
                            <div className="text-3xl font-bold text-gray-300 print:text-black">LOGO</div>
                            <div className="text-xs text-gray-400 mt-2 print:hidden">logo.png missing</div>
                        </div>
                    )}
                </div>

                {/* Title Section Updated */}
                <div className="space-y-2 mt-8 text-center">
                    <div style={{ fontFamily: '"Berlin Sans FB Demi", sans-serif' }} className="text-black">
                        <h1 className="text-[30pt] leading-tight uppercase">BUKTI PENGGUNAAN DANA</h1>
                        <h1 className="text-[30pt] leading-tight uppercase">PEMBANGUNAN KDKMP</h1>
                    </div>
                    
                    <div className="py-4">
                    </div>
                </div>

                <div className="my-auto space-y-8 w-full text-center">
                    <div className="mt-8 space-y-3">
                        <div className="print:bg-transparent p-4">
                            <h2 className="text-3xl font-bold uppercase text-black mb-2">DESA {loc?.desa}</h2>
                            <h3 className="text-2xl font-bold uppercase">KEC. {loc?.kecamatan}</h3>
                            {loc?.coordinates && (
                                <p className="text-lg font-mono mt-2">Co. {loc.coordinates}</p>
                            )}
                            {!loc?.coordinates && (
                                <p className="text-lg font-mono mt-2 text-gray-400 print:hidden">Co. -6.848635° 108.246088° (Contoh)</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-12 w-full text-center">
                    <h2 className="text-2xl font-bold uppercase tracking-wide">KODIM 0617/MAJALENGKA</h2>
                    <br/>
                    <div className="flex justify-between items-end w-full px-12 mt-8 font-bold text-lg">
                        <p className="uppercase">MAJALENGKA,</p>
                        <p className="uppercase text-red-600 print:text-red-600">FEBRUARI 2026</p>
                    </div>
                </div>
             </div>
        </div>
    )
}

export const ResumeReport: React.FC<ReportProps> = ({ data, locationId, termin }) => {
  const loc = LOCATIONS.find(l => l.id === locationId);
  const romanTermin = ["", "I", "II", "III", "IV", "V"][termin] || termin;

  // FILTER BY TERMIN
  const terminExpenses = data.expenses.filter(e => e.phase === termin);
  const terminLaborers = data.laborers.filter(l => l.phase === termin);

  // Group by category
  const laborTotal = terminExpenses.filter(e => e.category === ExpenseCategory.UPAH).reduce((sum, item) => sum + item.totalPrice, 0) + terminLaborers.reduce((sum, l) => {
    const totalDays = l.weeklyDays.reduce((a,b)=>a+b, 0);
    return sum + (totalDays * l.dailyRate) + (l.overtimeHours * l.overtimeRate);
  }, 0);
  
  const materialTotal = terminExpenses.filter(e => e.category === ExpenseCategory.MATERIAL).reduce((sum, item) => sum + item.totalPrice, 0);
  const otherTotal = terminExpenses.filter(e => e.category === ExpenseCategory.LAINNYA || e.category === ExpenseCategory.SEWA).reduce((sum, item) => sum + item.totalPrice, 0);

  const grandTotal = laborTotal + materialTotal + otherTotal;

  return (
    <div className="a4-portrait page-break mb-8 mx-auto font-[Arial] relative">
      <div className="absolute top-[20mm] left-[20mm] text-left leading-tight z-10">
            <p className="text-xs font-bold uppercase">KOREM 063/SUNAN GUNUNG JATI</p>
            <p className="text-xs font-bold uppercase">KOMANDO DISTRIK MILITER 0617</p>
            <div className="w-full border-b border-black my-1"></div>
      </div>

      <div className="text-center mb-8 pt-16">
        <h2 className="text-xl font-bold underline decoration-2 underline-offset-4 mb-1 uppercase">RESUME PENGGUNAAN DANA PEMBANGUNAN KDKMP</h2>
        <p className="font-bold uppercase text-sm">DESA {loc?.desa} KEC. {loc?.kecamatan}</p>
        <p className="font-bold uppercase text-sm">KAB.MAJALENGKA</p>
      </div>

      <table className="w-full border-collapse border border-black text-sm mb-6">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-200 text-center font-bold">
            <th className="border border-black p-3 w-12">NO</th>
            <th className="border border-black p-3">URAIAN</th>
            <th className="border border-black p-3 w-48">JUMLAH BIAYA (RP)</th>
            <th className="border border-black p-3 w-32">BUKTI PENGELUARAN</th>
            <th className="border border-black p-3 w-32">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
           {/* TERMIN HEADER ROW */}
           <tr>
               <td className="border border-black p-2 font-bold" colSpan={5}>
                   TAHAP {termin}
               </td>
           </tr>

          {/* 1. Upah / Biaya Tukang */}
          <tr>
            <td className="border border-black p-2 text-center align-top font-bold">1</td>
            <td className="border border-black p-2 align-top">
                <div className="font-bold mb-1">Biaya Tukang</div>
                 {terminLaborers.length > 0 && (
                    <div className="pl-4 text-xs text-gray-800 print:text-black italic">
                        Minggu Pertama <br/>
                        Minggu Kedua <br/>
                        ...dst
                    </div>
                 )}
            </td>
            <td className="border border-black p-2 text-right align-top font-bold text-base">{formatCurrency(laborTotal).replace('Rp', '')},-</td>
             <td className="border border-black p-2 align-top text-center text-xs"></td>
            <td className="border border-black p-2 align-top text-center text-xs"></td>
          </tr>

          {/* 2. Material */}
          <tr>
            <td className="border border-black p-2 text-center align-top font-bold">2</td>
            <td className="border border-black p-2 align-top">
                <div className="font-bold mb-1">Pembelian Material</div>
                <div className="pl-4 text-xs text-gray-800 print:text-black italic">
                   {terminExpenses.filter(e => e.category === ExpenseCategory.MATERIAL).slice(0,3).map(e => (
                       <div key={e.id}>{e.date} : {e.description}</div>
                   ))}
                   {terminExpenses.filter(e => e.category === ExpenseCategory.MATERIAL).length > 3 && <div>...dst</div>}
                </div>
            </td>
            <td className="border border-black p-2 text-right align-top font-bold text-base">{formatCurrency(materialTotal).replace('Rp', '')},-</td>
            <td className="border border-black p-2 align-top text-center text-xs">Bukti Terlampir</td>
             <td className="border border-black p-2 align-top text-center text-xs"></td>
          </tr>

           {/* 3. Lainnya */}
           <tr>
            <td className="border border-black p-2 text-center align-top font-bold">3</td>
            <td className="border border-black p-2 align-top">
                <div className="font-bold mb-1">Biaya lain lainnya</div>
            </td>
            <td className="border border-black p-2 text-right align-top font-bold text-base">{formatCurrency(otherTotal).replace('Rp', '')},-</td>
            <td className="border border-black p-2 align-top text-center text-xs">Bukti Terlampir</td>
            <td className="border border-black p-2 align-top text-center text-xs"></td>
          </tr>

          {/* TOTAL */}
          <tr className="bg-gray-100 print:bg-gray-200 font-bold text-base">
            <td className="border border-black p-3 text-center" colSpan={2}>TOTAL</td>
            <td className="border border-black p-3 text-right">{formatCurrency(grandTotal).replace('Rp', 'Rp ')},-</td>
            <td className="border border-black p-3 bg-gray-300 print:bg-gray-300"></td>
            <td className="border border-black p-3 bg-gray-300 print:bg-gray-300"></td>
          </tr>
        </tbody>
      </table>

       <div className="flex justify-end pr-12 mt-12">
            <div className="text-center">
                <p className="mb-20">Mengetahui,<br/>Komandan Kodim 0617/Majalengka,</p>
                <p className="font-bold underline">Fahmi Guruh Rahayu, S.I.P., M.I.P</p>
                <p>Letnan Kolonel Inf NRP 11050034020582</p>
            </div>
      </div>
    </div>
  );
};

export const CostDetailReport: React.FC<ReportProps> = ({ data, locationId, termin }) => {
    const loc = LOCATIONS.find(l => l.id === locationId);
    
    const expenses = data.expenses.filter(e => e.phase === termin);
    const laborers = data.laborers.filter(l => l.phase === termin);

    const materials = expenses.filter(e => e.category === ExpenseCategory.MATERIAL);
    const others = expenses.filter(e => e.category === ExpenseCategory.LAINNYA || e.category === ExpenseCategory.SEWA);

    // Calculate totals
    const totalMaterial = materials.reduce((s, x) => s + x.totalPrice, 0);
    const totalOther = others.reduce((s, x) => s + x.totalPrice, 0);
    
    // Labor calculation
    let totalLabor = 0;
    const laborRows: any[] = [];
    laborers.forEach((l) => {
        const days = l.weeklyDays.reduce((a, b) => a + b, 0);
        const basicPay = days * l.dailyRate;
        const otPay = l.overtimeHours * l.overtimeRate;
        
        totalLabor += (basicPay + otPay);

        if (days > 0) {
            laborRows.push({
                desc: `Upah ${l.name} (${l.position})`,
                vol: days,
                unit: 'OH',
                price: l.dailyRate,
                total: basicPay
            });
        }
        if (otPay > 0) {
            laborRows.push({
                desc: `Lembur ${l.name}`,
                vol: l.overtimeHours,
                unit: 'Jam',
                price: l.overtimeRate,
                total: otPay
            });
        }
    });

    const grandTotal = totalMaterial + totalLabor + totalOther;

    return (
        <div className="a4-portrait page-break mb-8 mx-auto font-[Arial] relative">
            <HeaderKorem />
            
            <div className="text-center mb-6 pt-16">
                <h2 className="text-lg font-bold underline mb-1 uppercase">REKAPITULASI PENGELUARAN</h2>
                <h3 className="text-sm font-bold uppercase">PROYEK : KOPERASI DESA MERAH PUTIH</h3>
                <h3 className="text-sm font-bold uppercase">LOKASI : DESA {loc?.desa}, KEC. {loc?.kecamatan}</h3>
            </div>

            <table className="w-full border-collapse border border-black text-sm">
                <thead>
                    <tr className="bg-gray-100 print:bg-gray-200 font-bold text-center">
                        <th className="border border-black p-2 w-8">NO</th>
                        <th className="border border-black p-2">URAIAN</th>
                        <th className="border border-black p-2 w-40">JUMLAH BIAYA ( RP )</th>
                        <th className="border border-black p-2 w-40">KETERANGAN</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td className="border border-black p-2 font-bold" colSpan={4}>TERMIN {termin}</td></tr>
                    {/* 1. UPAH */}
                     <tr>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2 font-bold">Biaya Upah Pekerja</td>
                        <td className="border border-black p-2 text-right font-bold bg-green-200 print:bg-green-200">{formatCurrency(totalLabor).replace('Rp', '')},-</td>
                        <td className="border border-black p-2"></td>
                    </tr>
                    {/* 2. MATERIAL */}
                     <tr>
                        <td className="border border-black p-2 text-center">2</td>
                        <td className="border border-black p-2 font-bold">Pembelian Material</td>
                        <td className="border border-black p-2 text-right font-bold bg-yellow-200 print:bg-yellow-200">{formatCurrency(totalMaterial).replace('Rp', '')},-</td>
                        <td className="border border-black p-2"></td>
                    </tr>
                    {/* 3. LAINNYA */}
                     <tr>
                        <td className="border border-black p-2 text-center">3</td>
                        <td className="border border-black p-2 font-bold">Biaya lain-lain</td>
                        <td className="border border-black p-2 text-right font-bold bg-red-200 print:bg-red-200">{formatCurrency(totalOther).replace('Rp', '')},-</td>
                        <td className="border border-black p-2"></td>
                    </tr>

                    {/* GRAND TOTAL */}
                    <tr className="font-bold text-sm">
                        <td className="border border-black p-2 text-center" colSpan={2}>JUMLAH</td>
                        <td className="border border-black p-2 text-right">{formatCurrency(grandTotal).replace('Rp', '')},-</td>
                         <td className="border border-black p-2"></td>
                    </tr>
                </tbody>
            </table>
            
             <div className="flex justify-end pr-12 mt-12">
                <div className="text-center">
                    <p className="mb-20">Mengetahui,<br/>Komandan Kodim 0617/Majalengka,</p>
                    <p className="font-bold underline">Fahmi Guruh Rahayu, S.I.P., M.I.P</p>
                    <p>Letnan Kolonel Inf NRP 11050034020582</p>
                </div>
            </div>

            <div className="absolute bottom-8 left-8 text-xs font-bold">
                 <p>KOREM 063/SUNAN GUNUNG JATI</p>
                 <p>KOMANDO DISTRIK MILITER 0617</p>
            </div>
        </div>
    );
}

export const MaterialReport: React.FC<ReportProps> = ({ data, locationId, termin }) => {
    const loc = LOCATIONS.find(l => l.id === locationId);
    // Filter by termin
    const materials = data.expenses.filter(e => e.category === ExpenseCategory.MATERIAL && e.phase === termin);
    const total = materials.reduce((acc, curr) => acc + curr.totalPrice, 0);

    return (
        <div className="a4-portrait page-break mb-8 mx-auto font-[Arial] relative">
            <HeaderKorem />
             <div className="text-center mb-6 pt-16">
                <h2 className="text-lg font-bold underline mb-1 uppercase">LAPORAN PEMBELANJAAN MATERIAL</h2>
                <h3 className="text-sm font-bold uppercase">PEMBANGUNAN KOPERASI DESA MERAH PUTIH</h3>
                <h3 className="text-sm font-bold uppercase">DESA {loc?.desa}, KEC. {loc?.kecamatan}, KAB.MAJALENGKA</h3>
            </div>

            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100 print:bg-gray-200 font-bold text-center">
                        <th className="border border-black p-2 w-8">NO</th>
                        <th className="border border-black p-2 w-24">TANGGAL</th>
                        <th className="border border-black p-2">BARANG</th>
                        <th className="border border-black p-2 w-16">VOLUME</th>
                        <th className="border border-black p-2 w-16">SATUAN</th>
                        <th className="border border-black p-2 w-28">HARGA SAT (RP)</th>
                        <th className="border border-black p-2 w-32">JML HARGA(RP)</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((item, idx) => (
                        <tr key={idx}>
                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                            <td className="border border-black p-1 text-center">{item.date}</td>
                            <td className="border border-black p-1 pl-2">{item.description}</td>
                            <td className="border border-black p-1 text-center">{item.volume}</td>
                            <td className="border border-black p-1 text-center">{item.unit}</td>
                            <td className="border border-black p-1 text-right pr-2">{formatCurrency(item.pricePerUnit).replace('Rp', '')}</td>
                            <td className="border border-black p-1 text-right pr-2 font-medium">{formatCurrency(item.totalPrice).replace('Rp', '')}</td>
                        </tr>
                    ))}
                    {materials.length === 0 && (
                        <tr>
                            <td colSpan={7} className="border border-black p-8 text-center italic text-gray-500">Belum ada data material di Termin {termin}</td>
                        </tr>
                    )}
                     <tr className="bg-gray-100 print:bg-gray-200 font-bold text-sm">
                        <td className="border border-black p-2 text-right" colSpan={6}>TOTAL.........................................................................................................Rp</td>
                        <td className="border border-black p-2 text-right pr-2">{formatCurrency(total).replace('Rp', '')}</td>
                    </tr>
                </tbody>
            </table>

             <div className="flex justify-between items-end w-full px-8 mt-12 text-center text-sm">
                 <div>
                     <p>Perwira Seksi Teritorial,</p>
                     <br/><br/><br/>
                     <p className="font-bold">Mulyana</p>
                     <p>Kapten Inf NRP 21980077890976</p>
                 </div>
                 <div>
                     <p>Majalengka, November 2025</p>
                     <p>Juru Bayar,</p>
                     <br/><br/><br/>
                     <p className="font-bold">Rano Noplia</p>
                     <p>Pelda NRP 21040098611183</p>
                 </div>
             </div>
             
             <div className="text-center mt-8 text-sm">
                 <p>Mengetahui,</p>
                 <p>Komandan Kodim 0617/Majalengka</p>
                 <br/><br/><br/>
                 <p className="font-bold">Fahmi Guruh Rahayu, S.I.P., M.I.P</p>
                 <p>Letnan Kolonel Inf NRP 11050034020582</p>
             </div>
        </div>
    )
}

export const RentalReport: React.FC<ReportProps> = ({ data, locationId, termin }) => {
    const loc = LOCATIONS.find(l => l.id === locationId);
    // Filter by termin AND category SEWA
    const rentals = data.expenses.filter(e => e.category === ExpenseCategory.SEWA && e.phase === termin);
    const total = rentals.reduce((acc, curr) => acc + curr.totalPrice, 0);

    return (
        <div className="a4-portrait page-break mb-8 mx-auto font-[Arial] relative">
            <HeaderKorem />
             <div className="text-center mb-6 pt-16">
                <h2 className="text-lg font-bold underline mb-1 uppercase">LAPORAN SEWA PERALATAN</h2>
                <h3 className="text-sm font-bold uppercase">PEMBANGUNAN KOPERASI DESA MERAH PUTIH</h3>
                <h3 className="text-sm font-bold uppercase">DESA {loc?.desa}, KEC. {loc?.kecamatan}, KAB.MAJALENGKA</h3>
            </div>

            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100 print:bg-gray-200 font-bold text-center">
                        <th className="border border-black p-2 w-8">NO</th>
                        <th className="border border-black p-2 w-24">TANGGAL</th>
                        <th className="border border-black p-2">NAMA ALAT/BARANG</th>
                        <th className="border border-black p-2 w-16">VOLUME</th>
                        <th className="border border-black p-2 w-16">SATUAN</th>
                        <th className="border border-black p-2 w-28">HARGA SAT (RP)</th>
                        <th className="border border-black p-2 w-32">JML HARGA(RP)</th>
                    </tr>
                </thead>
                <tbody>
                    {rentals.map((item, idx) => (
                        <tr key={idx}>
                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                            <td className="border border-black p-1 text-center">{item.date}</td>
                            <td className="border border-black p-1 pl-2">{item.description}</td>
                            <td className="border border-black p-1 text-center">{item.volume}</td>
                            <td className="border border-black p-1 text-center">{item.unit}</td>
                            <td className="border border-black p-1 text-right pr-2">{formatCurrency(item.pricePerUnit).replace('Rp', '')}</td>
                            <td className="border border-black p-1 text-right pr-2 font-medium">{formatCurrency(item.totalPrice).replace('Rp', '')}</td>
                        </tr>
                    ))}
                    {rentals.length === 0 && (
                        <tr>
                            <td colSpan={7} className="border border-black p-8 text-center italic text-gray-500">Belum ada data sewa peralatan di Termin {termin}</td>
                        </tr>
                    )}
                     <tr className="bg-gray-100 print:bg-gray-200 font-bold text-sm">
                        <td className="border border-black p-2 text-right" colSpan={6}>TOTAL.........................................................................................................Rp</td>
                        <td className="border border-black p-2 text-right pr-2">{formatCurrency(total).replace('Rp', '')}</td>
                    </tr>
                </tbody>
            </table>

             <div className="flex justify-between items-end w-full px-8 mt-12 text-center text-sm">
                 <div>
                     <p>Perwira Seksi Teritorial,</p>
                     <br/><br/><br/>
                     <p className="font-bold">Mulyana</p>
                     <p>Kapten Inf NRP 21980077890976</p>
                 </div>
                 <div>
                     <p>Majalengka, November 2025</p>
                     <p>Juru Bayar,</p>
                     <br/><br/><br/>
                     <p className="font-bold">Rano Noplia</p>
                     <p>Pelda NRP 21040098611183</p>
                 </div>
             </div>
             
             <div className="text-center mt-8 text-sm">
                 <p>Mengetahui,</p>
                 <p>Komandan Kodim 0617/Majalengka</p>
                 <br/><br/><br/>
                 <p className="font-bold">Fahmi Guruh Rahayu, S.I.P., M.I.P</p>
                 <p>Letnan Kolonel Inf NRP 11050034020582</p>
             </div>
        </div>
    )
}

export const EvidenceReport: React.FC<ReportProps> = ({ data, locationId, termin }) => {
    const loc = LOCATIONS.find(l => l.id === locationId);
    // Filter by termin
    const itemsWithEvidence = data.expenses.filter(e => e.evidenceImage && e.phase === termin);

    if (itemsWithEvidence.length === 0) return null;

    // Chunk items into groups of 4 for 2x2 grid layout per A4 page
    const chunkSize = 4;
    const chunks = [];
    for (let i = 0; i < itemsWithEvidence.length; i += chunkSize) {
        chunks.push(itemsWithEvidence.slice(i, i + chunkSize));
    }

    return (
        <>
            {chunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="a4-portrait page-break mb-8 mx-auto font-[Arial] relative">
                     <HeaderKorem />
                     <div className="text-center mb-8 pt-16">
                        <h2 className="text-lg font-bold underline mb-1 uppercase">BUKTI PEMBELANJAAN MATERIAL</h2>
                        <h3 className="text-sm font-bold uppercase">PEMBANGUNAN KOPERASI DESA MERAH PUTIH</h3>
                        <h3 className="text-sm font-bold uppercase">DESA {loc?.desa} KEC. {loc?.kecamatan} KAB. MAJALENGKA</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-8 px-4">
                        {chunk.map((item, idx) => (
                            <div key={idx} className="flex flex-col border border-black p-2 break-inside-avoid h-[300px]">
                                <div className="text-center font-bold mb-2">( BON )</div>
                                <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-2">
                                    <img 
                                        src={item.evidenceImage} 
                                        alt={item.description}
                                        className="object-contain w-full h-full" 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="text-xs font-bold mt-4">DST</div>
                    
                     <div className="flex justify-end pr-12 mt-12 text-sm text-center">
                        <div>
                             <p>Majalengka, November 2025</p>
                             <p>Komandan Kodim 0617/Majalengka,</p>
                             <br/><br/><br/>
                             <p className="font-bold">Fahmi Guruh Rahayu, S.I.P., M.I.P</p>
                             <p>Letnan Kolonel Inf NRP 11050034020582</p>
                         </div>
                     </div>
                </div>
            ))}
        </>
    );
}

export const LaborReport: React.FC<ReportProps> = ({ data, locationId, termin }) => {
    const loc = LOCATIONS.find(l => l.id === locationId);
    
    // Filter by termin
    const laborers = data.laborers.filter(l => l.phase === termin);
    
    const totalHari = laborers.reduce((sum, l) => sum + l.weeklyDays.reduce((a,b)=>a+b, 0), 0);
    const totalLemburJam = laborers.reduce((sum, l) => sum + l.overtimeHours, 0);
    const totalLemburRp = laborers.reduce((sum, l) => sum + (l.overtimeHours * l.overtimeRate), 0);
    const totalHarianRp = laborers.reduce((sum, l) => sum + (l.weeklyDays.reduce((a,b)=>a+b, 0) * l.dailyRate), 0);
    const totalUpah = totalHarianRp + totalLemburRp;

    return (
        // Uses landscape orientation CSS
        <div className="a4-landscape page-break mb-8 mx-auto font-[Arial] text-black relative">
             <HeaderKorem />
             <div className="text-center mb-6 pt-16">
                <h2 className="text-lg font-bold underline mb-1 uppercase">DAFTAR PEMBAYARAN UPAH TENAGA KERJA</h2>
                <h3 className="text-sm font-bold uppercase">PEMBANGUNAN KOPERASI DESA MERAH PUTIH</h3>
                <h3 className="text-sm font-bold uppercase">DESA {loc?.desa}, KEC. {loc?.kecamatan}, KAB.MAJALENGKA</h3>
                
                <div className="text-left mt-4 font-bold text-xs">
                     <p>MINGGU KE I</p>
                     <p>PERIODE : 25 s.d 31 November 2025</p>
                </div>
            </div>
            
            <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                    <tr className="bg-gray-100 print:bg-transparent font-bold text-center align-middle">
                        <th className="border border-black p-1 w-6">NO</th>
                        <th className="border border-black p-1 w-32">NAMA</th>
                        <th className="border border-black p-1 w-16">POSISI</th>
                        <th className="border border-black p-1 w-20">UPAH/<br/>HARIAN (Rp)</th>
                        <th className="border border-black p-1 w-10">JML<br/>HARI</th>
                        <th className="border border-black p-1 w-20">UPAH<br/>HARIAN (RP)</th>
                        <th className="border border-black p-1 w-10">TOTAL<br/>JAM</th>
                        <th className="border border-black p-1 w-20">UPAH<br/>LEMBUR</th>
                        <th className="border border-black p-1 w-24">TOTAL<br/>UPAH (Rp)</th>
                        <th className="border border-black p-1 w-16">TTD</th>
                    </tr>
                </thead>
                <tbody>
                    {laborers.map((l, i) => {
                         const daysWorked = l.weeklyDays.reduce((a,b)=>a+b,0);
                         const wageBase = daysWorked * l.dailyRate;
                         const otPay = l.overtimeHours * l.overtimeRate;
                         return (
                            <tr key={l.id} className="text-center hover:bg-gray-50 print:hover:bg-transparent">
                                <td className="border border-black p-1">{i+1}</td>
                                <td className="border border-black p-1 text-left pl-2 font-medium">{l.name}</td>
                                <td className="border border-black p-1">{l.position}</td>
                                <td className="border border-black p-1 text-right pr-1">{formatCurrency(l.dailyRate).replace('Rp', '').replace(',00', '')}</td>
                                <td className="border border-black p-1">{daysWorked}</td>
                                <td className="border border-black p-1 text-right pr-1">{formatCurrency(wageBase).replace('Rp', '').replace(',00', '')},-</td>
                                <td className="border border-black p-1">{l.overtimeHours}</td>
                                <td className="border border-black p-1 text-right pr-1">{formatCurrency(otPay).replace('Rp', '').replace(',00', '')},-</td>
                                <td className="border border-black p-1 text-right pr-1">{formatCurrency(wageBase + otPay).replace('Rp', '').replace(',00', '')}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                         )
                    })}
                     <tr className="bg-gray-100 print:bg-gray-200 font-bold border-t-2 border-black">
                        <td className="border border-black p-1 text-left pl-2" colSpan={8}>JUMLAH</td>
                        <td className="border border-black p-1 text-right pr-1">Rp.{formatCurrency(totalUpah).replace('Rp', '').replace(',00', '')}</td>
                        <td className="border border-black p-1"></td>
                    </tr>
                </tbody>
            </table>

             <div className="flex justify-between items-end w-full px-8 mt-12 text-center text-sm">
                 <div>
                     <p>Perwira Seksi Teritorial,</p>
                     <br/><br/><br/>
                     <p className="font-bold">Mulyana</p>
                     <p>Kapten Inf NRP 21980077890976</p>
                 </div>
                 <div className="flex flex-col items-center">
                     <p>Mengetahui,</p>
                     <p>Komandan Kodim 0617/Majalengka,</p>
                     <br/><br/><br/>
                     <p className="font-bold">Fahmi Guruh Rahayu, S.I.P., M.I.P</p>
                     <p>Letnan Kolonel Inf NRP 11050034020582</p>
                 </div>
                 <div>
                     <p>Majalengka, November 2025</p>
                     <p>BABINSA</p>
                     <br/><br/><br/>
                     <p>.......................................</p>
                     <p>.......................................</p>
                 </div>
             </div>
        </div>
    )
}