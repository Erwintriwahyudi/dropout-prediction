"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  BrainCircuit,
  Calculator,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
  BookOpen
} from "lucide-react";

interface SiswaOption {
  id: number;
  siswa_id: string;
  nama: string;
  kelas: string;
  kehadiran_angka?: number;
  nilai_angka?: number;
  pelanggaran_angka?: number;
  pekerjaan_orang_tua: string;
  penghasilan_orang_tua: string;
  status_spp: string;
  status_orang_tua: string;
  nisn: string;
}

interface PredictionResult {
  status_risiko: string;
  probabilitas: Record<string, number>;
  rules: string[];
  rule_summary: string;
  kategori_kehadiran: string;
  kategori_nilai: string;
  kategori_pelanggaran: string;
}

// --- Helper Konversi Otomatis Angka ke Kategori Bab IV ---
const getKategoriKehadiran = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num) || val === "") return "Baik";
  if (num >= 200) return "Sangat Baik";
  if (num >= 170) return "Baik";
  return "Kurang";
};

const getKategoriNilai = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num) || val === "") return "Sedang";
  if (num >= 80) return "Tinggi";
  if (num >= 70) return "Sedang";
  return "Rendah";
};

const getKategoriPelanggaran = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num) || val === "") return "Tidak Ada";
  if (num === 0) return "Tidak Ada";
  if (num <= 3) return "Ringan";
  return "Sedang/Berat";
};

export default function PrediksiPage() {
  const [siswaList, setSiswaList] = useState<SiswaOption[]>([]);
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [loadingSiswa, setLoadingSiswa] = useState<boolean>(true);
  const [predicting, setPredicting] = useState<boolean>(false);

  // Form Input Angka Real & Faktor Sosial
  const [formData, setFormData] = useState({
    nama: "",
    kelas: "",
    kehadiran_angka: "" as string | number,
    nilai_angka: "" as string | number,
    pelanggaran_angka: "0" as string | number,
    pekerjaan_orang_tua: "Wiraswasta",
    penghasilan_orang_tua: "Rp 2.000.000 - Rp 5.000.000",
    status_spp: "Lancar",
    status_orang_tua: "Lengkap",
    nisn: "",
  });

  const [result, setResult] = useState<PredictionResult | null>(null);

  // Fetch daftar siswa untuk dropdown
  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        const res = await api.get("/students/");
        const data = res.data.students || res.data.data || res.data;
        if (Array.isArray(data)) setSiswaList(data);
      } catch (err) {
        console.error("Gagal memuat data siswa:", err);
      } finally {
        setLoadingSiswa(false);
      }
    };
    fetchSiswa();
  }, []);

  // Autofill saat Wali Kelas memilih siswa dari dropdown
  const handleSelectSiswa = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSiswaId(id);

    if (!id) {
      setFormData({
        nama: "",
        kelas: "",
        kehadiran_angka: "",
        nilai_angka: "",
        pelanggaran_angka: "0",
        pekerjaan_orang_tua: "Wiraswasta",
        penghasilan_orang_tua: "Rp 2.000.000 - Rp 5.000.000",
        status_spp: "Lancar",
        status_orang_tua: "Lengkap",
        nisn: "",
      });
      return;
    }

    const s = siswaList.find((item) => item.id.toString() === id || item.siswa_id === id);
    if (s) {
      setFormData({
        nama: s.nama,
        kelas: s.kelas,
        kehadiran_angka: s.kehadiran_angka ?? "",
        nilai_angka: s.nilai_angka ?? "",
        pelanggaran_angka: s.pelanggaran_angka ?? 0,
        pekerjaan_orang_tua: s.pekerjaan_orang_tua || "Wiraswasta",
        penghasilan_orang_tua: s.penghasilan_orang_tua || "Rp 2.000.000 - Rp 5.000.000",
        status_spp: s.status_spp || "Lancar",
        status_orang_tua: s.status_orang_tua || "Lengkap",
        nisn: s.nisn || "",
      });
    }
  };

  const handleProcessPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    setResult(null);

    // Kategori dihitung otomatis dari angka
    const katKehadiran = getKategoriKehadiran(formData.kehadiran_angka);
    const katNilai = getKategoriNilai(formData.nilai_angka);
    const katPelanggaran = getKategoriPelanggaran(formData.pelanggaran_angka);

    const payload = {
      nama: formData.nama,
      kelas: formData.kelas,
      kehadiran_angka: Number(formData.kehadiran_angka),
      nilai_angka: Number(formData.nilai_angka),
      pelanggaran_angka: Number(formData.pelanggaran_angka),
      kategori_kehadiran: katKehadiran,
      kategori_nilai: katNilai,
      kategori_pelanggaran: katPelanggaran,
      pekerjaan_orang_tua: formData.pekerjaan_orang_tua,
      pekerjaan_ortu: formData.pekerjaan_orang_tua,
      penghasilan_orang_tua: formData.penghasilan_orang_tua,
      penghasilan_ortu: formData.penghasilan_orang_tua,
      status_spp: formData.status_spp,
      status_orang_tua: formData.status_orang_tua,
      status_ortu: formData.status_orang_tua,
      nisn: formData.nisn,
      rata_rata_nilai: Number(formData.nilai_angka),
      jumlah_kehadiran: Number(formData.kehadiran_angka),
    };

    try {
      // Jika siswa dipilih dari dropdown (punya nisn/id), kita simpan ke DB. Jika manual, simulasi saja.
      const endpoint = selectedSiswaId ? "/predict/save" : "/predict/detail";
      const res = await api.post(endpoint, payload);
      const resData = res.data;
      const detailData = resData.prediction_detail || resData;
      setResult({
        status_risiko: detailData.status_risiko,
        probabilitas: detailData.probabilitas,
        rules: detailData.rules,
        rule_summary: detailData.rule_summary,
        kategori_kehadiran: katKehadiran,
        kategori_nilai: katNilai,
        kategori_pelanggaran: katPelanggaran,
      });
    } catch (err) {
      console.error(err);
      alert("Gagal memproses prediksi. Pastikan backend Flask aktif.");
    } finally {
      setPredicting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors";

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-gray-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <header>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Simulasi Prediksi Dropout
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Panel Khusus Wali Kelas untuk menganalisis dan memprediksi tingkat risiko potensi putus sekolah siswa.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* PANEL KIRI: FORM INPUT DATA SISWA */}
          <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-orange-500" />
                Input Indikator Siswa
              </h2>
              <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-medium">
                Sistem C4.5
              </span>
            </div>

            {/* PILIH SISWA TERDAFTAR */}
            <div className="bg-gray-950/60 p-4 rounded-xl border border-gray-800 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-orange-400">
                Akses Cepat Data Siswa Diampu
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedSiswaId}
                  onChange={handleSelectSiswa}
                  disabled={loadingSiswa}
                  className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Siswa atau Input Manual --</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siswa_id} - {s.nama} ({s.kelas})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleProcessPrediction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nama Siswa</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className={inputClass}
                    placeholder="Nama siswa..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className={inputClass}
                    placeholder="Contoh: 7A, 8B"
                  />
                </div>

                {/* INPUT ANGKA REAL */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Jumlah Kehadiran <span className="text-orange-400">(Hari)</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.kehadiran_angka}
                    onChange={(e) => setFormData({ ...formData, kehadiran_angka: e.target.value })}
                    className={inputClass}
                    placeholder="Contoh: 180"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Kategori Otomatis: <strong className="text-gray-300">{getKategoriKehadiran(formData.kehadiran_angka)}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Rata-rata Nilai <span className="text-orange-400">(Angka)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.nilai_angka}
                    onChange={(e) => setFormData({ ...formData, nilai_angka: e.target.value })}
                    className={inputClass}
                    placeholder="Contoh: 75.5"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Kategori Otomatis: <strong className="text-gray-300">{getKategoriNilai(formData.nilai_angka)}</strong>
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Jumlah Pelanggaran <span className="text-orange-400">(Kali)</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.pelanggaran_angka}
                    onChange={(e) => setFormData({ ...formData, pelanggaran_angka: e.target.value })}
                    className={inputClass}
                    placeholder="Contoh: 0"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Kategori Otomatis: <strong className="text-gray-300">{getKategoriPelanggaran(formData.pelanggaran_angka)}</strong>
                  </span>
                </div>

                {/* FAKTOR ORTU & SPP */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Pekerjaan Ortu</label>
                  <select
                    value={formData.pekerjaan_orang_tua}
                    onChange={(e) => setFormData({ ...formData, pekerjaan_orang_tua: e.target.value })}
                    className={inputClass}
                  >
                    <option value="PNS/TNI/Polri">PNS/TNI/Polri</option>
                    <option value="Karyawan Swasta">Karyawan Swasta</option>
                    <option value="Wiraswasta">Wiraswasta</option>
                    <option value="Buruh/Petani">Buruh/Petani</option>
                    <option value="Tidak Bekerja">Tidak Bekerja</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Penghasilan Ortu</label>
                  <select
                    value={formData.penghasilan_orang_tua}
                    onChange={(e) => setFormData({ ...formData, penghasilan_orang_tua: e.target.value })}
                    className={inputClass}
                  >
                    <option value="< Rp 2.000.000">&lt; Rp 2.000.000</option>
                    <option value="Rp 2.000.000 - Rp 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                    <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status Pembayaran SPP</label>
                  <select
                    value={formData.status_spp}
                    onChange={(e) => setFormData({ ...formData, status_spp: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Lancar">Lancar</option>
                    <option value="Menunggak 1-2 Bulan">Menunggak 1-2 Bulan</option>
                    <option value="Menunggak >2 Bulan">Menunggak &gt;2 Bulan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status Orang Tua</label>
                  <select
                    value={formData.status_orang_tua}
                    onChange={(e) => setFormData({ ...formData, status_orang_tua: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Lengkap">Lengkap</option>
                    <option value="Yatim">Yatim</option>
                    <option value="Piatu">Piatu</option>
                    <option value="Yatim Piatu">Yatim Piatu</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={predicting}
                className="w-full mt-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
              >
                {predicting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Memproses Prediksi C4.5...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Proses Prediksi Risiko
                  </>
                )}
              </button>
              
              {selectedSiswaId && (
                <div className="text-center mt-2">
                  <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Siswa terdaftar. Hasil akan otomatis tersimpan & terkirim ke Guru BK!
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* PANEL KANAN: HASIL ANALISIS & REKOMENDASI WALI KELAS */}
          <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="border-b border-gray-800 pb-4 mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  Hasil Prediksi & Catatan
                </h2>
              </div>

              {!result ? (
                <div className="py-20 text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-gray-700 mx-auto" />
                  <p className="text-sm text-gray-500">
                    Isi form indikator di sebelah kiri dan klik tombol <strong>"Proses Prediksi Risiko"</strong> untuk melihat hasil analisis.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* BADGE HASIL UTAMA */}
                  <div
                    className={`p-5 rounded-2xl border flex items-center gap-4 ${result.status_risiko === "Tinggi"
                        ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                        : result.status_risiko === "Rendah"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/40 text-amber-400"
                      }`}
                  >
                    {result.status_risiko === "Tinggi" ? (
                      <AlertTriangle className="w-10 h-10 flex-shrink-0" />
                    ) : result.status_risiko === "Rendah" ? (
                      <CheckCircle2 className="w-10 h-10 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-10 h-10 flex-shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider block opacity-80">
                        Tingkat Risiko Dropout
                      </span>
                      <h3 className="text-2xl font-bold mt-0.5">
                        Risiko {result.status_risiko}
                      </h3>
                    </div>
                  </div>

                  {/* PROBABILITAS KELAS */}
                  {result.probabilitas && (
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Persentase Keyakinan Model
                      </p>
                      <div className="space-y-2">
                        {Object.entries(result.probabilitas).map(([cls, prob]) => {
                          const color =
                            cls === "Tinggi"
                              ? "bg-rose-500"
                              : cls === "Rendah"
                                ? "bg-emerald-500"
                                : "bg-amber-500";
                          return (
                            <div key={cls}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-300">Risiko {cls}</span>
                                <span className="font-mono text-white font-bold">{prob.toString().replace('.', ',')}%</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-2">
                                <div
                                  className={`${color} h-2 rounded-full transition-all duration-500`}
                                  style={{ width: `${prob}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* RINGKASAN REKOMENDASI WALI KELAS */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                      Tindakan Lanjutan Wali Kelas
                    </p>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {result.status_risiko === "Tinggi"
                        ? "🚨 Perlu perhatian khusus. Disarankan Wali Kelas segera menjadwalkan pembinaan individu dan berkoordinasi dengan pihak sekolah/orang tua."
                        : result.status_risiko === "Sedang"
                          ? "⚠️ Memerlukan pemantauan berkala pada kehadiran dan perkembangan nilai akademik bulanan."
                          : "✅ Kondisi akademik dan indikator siswa stabil. Pertahankan performa secara rutin."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 text-center">
              <span className="text-[11px] text-gray-500">
                Data otomatis dikalkulasi menggunakan kombinasi aturan Ordinal Encoding & Pohon C4.5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}