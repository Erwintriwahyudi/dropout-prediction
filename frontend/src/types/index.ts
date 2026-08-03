export interface User {
  id: number;
  username: string;
  role: string;
}

export interface StudentData {
  id: number;
  siswa_id: string;
  nisn: string;
  nama: string;
  kelas: string;
  persentase_kehadiran: number;
  jumlah_absensi: number;
  rata_rata_nilai: number;
  jumlah_pelanggaran: number;
  kondisi_ekonomi: string;
}

export interface PredictionResponse {
  status_risiko: string;
  probabilitas: number;
  faktor_dominan: string;
}
