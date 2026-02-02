import { ProjectLocation } from './types';

export const LOCATIONS: ProjectLocation[] = [
  { id: 1, kecamatan: 'MAJA', desa: 'TEGALSARI' },
  { id: 2, kecamatan: 'ARGAPURA', desa: 'SADASARI' },
  { id: 3, kecamatan: 'PALASAH', desa: 'TARIKOLOT' },
  { id: 4, kecamatan: 'LIGUNG', desa: 'MAJASARI' },
  { id: 5, kecamatan: 'LIGUNG', desa: 'KEDUNGKENCANA' },
  { id: 6, kecamatan: 'LIGUNG', desa: 'KODASARI' },
  { id: 7, kecamatan: 'LIGUNG', desa: 'KEDUNGSARI' },
  { id: 8, kecamatan: 'LIGUNG', desa: 'LIGUNG KIDUL' },
  { id: 9, kecamatan: 'LEUWIMUNDING', desa: 'KARANGASEM' },
  { id: 10, kecamatan: 'LEUWIMUNDING', desa: 'LEUWIKUJANG' },
  { id: 11, kecamatan: 'SINDANGWANGI', desa: 'UJUNGBERUNG' },
  { id: 12, kecamatan: 'SINDANGWANGI', desa: 'LENGKONGWETAN' },
  { id: 13, kecamatan: 'JATIWANGI', desa: 'MEKARSARI' },
  { id: 14, kecamatan: 'SUMBERJAYA', desa: 'PANCAKSUJI' },
  { id: 15, kecamatan: 'SUMBERJAYA', desa: 'GELOK MULYA' },
  { id: 16, kecamatan: 'SUMBERJAYA', desa: 'BANJARAN' },
  { id: 17, kecamatan: 'SUMBERJAYA', desa: 'LOJIKOBONG' },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const terbilang = (nilai: number): string => {
  const absNilai = Math.abs(nilai);
  const huruf = ["", "SATU", "DUA", "TIGA", "EMPAT", "LIMA", "ENAM", "TUJUH", "DELAPAN", "SEMBILAN", "SEPULUH", "SEBELAS"];
  let temp = "";

  if (absNilai < 12) {
    temp = " " + huruf[absNilai];
  } else if (absNilai < 20) {
    temp = terbilang(absNilai - 10) + " BELAS";
  } else if (absNilai < 100) {
    temp = terbilang(Math.floor(absNilai / 10)) + " PULUH" + terbilang(absNilai % 10);
  } else if (absNilai < 200) {
    temp = " SERATUS" + terbilang(absNilai - 100);
  } else if (absNilai < 1000) {
    temp = terbilang(Math.floor(absNilai / 100)) + " RATUS" + terbilang(absNilai % 100);
  } else if (absNilai < 2000) {
    temp = " SERIBU" + terbilang(absNilai - 1000);
  } else if (absNilai < 1000000) {
    temp = terbilang(Math.floor(absNilai / 1000)) + " RIBU" + terbilang(absNilai % 1000);
  } else if (absNilai < 1000000000) {
    temp = terbilang(Math.floor(absNilai / 1000000)) + " JUTA" + terbilang(absNilai % 1000000);
  } else if (absNilai < 1000000000000) {
    temp = terbilang(Math.floor(absNilai / 1000000000)) + " MILYAR" + terbilang(absNilai % 1000000000);
  }

  // Jika dipanggil dari rekursif, kembalikan dengan spasi. Jika hasil akhir, trim.
  return temp;
};