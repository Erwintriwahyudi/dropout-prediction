import api from '../lib/api';

export interface PredictPayload {
  nama_siswa: string;
  kelas: string;
  jumlah_kehadiran: number;
  nilai_rata_rata: number;
  jumlah_pelanggaran: number;
  pekerjaan_orang_tua: string;
  penghasilan_orang_tua: string;
  status_spp: string;
  status_orang_tua: string;
}

export interface PredictionDetailResult {
  data_raw: Record<string, string>;
  data_encoded: Record<string, number>;
  prediction_detail: {
    status_risiko: string;
    probabilitas: {
      'Risiko Rendah'?: number;
      'Risiko Sedang'?: number;
      'Risiko Tinggi'?: number;
    };
    rules: string[];
    rule_summary: string;
  };
}

export interface SavePredictPayload {
  nisn: string;
  nama: string;
  kelas: string;
  tahun_ajaran: string;
  jumlah_kehadiran: number;
  rata_rata_nilai: number;
  jumlah_pelanggaran: number;
  pekerjaan_ortu: string;
  penghasilan_ortu: string;
  status_spp: string;
  status_ortu: string;
  status_risiko: string;
  probabilitas: number;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function getPredictionDetail(
  payload: PredictPayload
): Promise<PredictionDetailResult> {
  const response = await fetch(`${API_URL}/predict/detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal mengambil data prediksi');
  }

  return response.json();
}

export async function savePrediction(
  payload: SavePredictPayload
) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const response = await fetch(`${API_URL}/predict/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal menyimpan prediksi ke database.');
  }

  return data;
}
