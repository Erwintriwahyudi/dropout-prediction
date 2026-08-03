"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AlertTriangle, Loader2, FileText, X, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SiswaBerisiko {
  id: number;
  siswa_id: string;
  nama: string;
  kelas: string;
  kategori_kehadiran: string;
  kategori_nilai: string;
  kategori_pelanggaran: string;
  jumlah_kehadiran?: number | null;
  rata_rata_nilai?: number | null;
  jumlah_pelanggaran?: number | null;
  pekerjaan_orang_tua: string;
  penghasilan_orang_tua: string;
  status_spp: string;
  status_orang_tua: string;
  status_risiko: string;
  laporan_aktif: { id: number; status: string } | null;
}

const risikoColor: Record<string, string> = {
  Tinggi: "bg-rose-500/20 border-rose-500/50 text-rose-400",
  Sedang: "bg-amber-500/20 border-amber-500/50 text-amber-400",
};

// Fungsi menentukan apakah atribut merupakan faktor risiko
function getRisikoFaktor(s: any): {
  label: string;
  nilai: string;
  angka?: string;
  level: "risiko" | "waspada" | "aman";
  alasan: string;
}[] {
  const kehadiranAngka = s.jumlah_kehadiran ?? (240 - (s.jumlah_absensi ?? 0));
  const nilaiRata = s.rata_rata_nilai ?? s.nilai_rata ?? 0;
  const jmlPelanggaran = s.jumlah_pelanggaran ?? 0;

  const getKategoriKehadiran = (num: number) => {
    if (num >= 200) return "Sangat Baik";
    if (num >= 170) return "Baik";
    return "Kurang";
  };
  const getKategoriNilai = (num: number) => {
    if (num >= 80) return "Tinggi";
    if (num >= 70) return "Sedang";
    return "Rendah";
  };
  const getKategoriPelanggaran = (num: number) => {
    if (num === 0) return "Tidak Ada";
    if (num <= 3) return "Ringan";
    return "Sedang/Berat";
  };

  const katKehadiran = s.kategori_kehadiran ?? getKategoriKehadiran(kehadiranAngka);
  const katNilai = s.kategori_nilai ?? getKategoriNilai(nilaiRata);
  const katPelanggaran = s.kategori_pelanggaran ?? getKategoriPelanggaran(jmlPelanggaran);
  const pekerjaanOrtu = s.pekerjaan_orang_tua ?? s.pekerjaan_ortu ?? "Wiraswasta";
  const penghasilanOrtu = s.penghasilan_orang_tua ?? s.penghasilan_ortu ?? "Rp 2.000.000 - Rp 5.000.000";
  const statusSpp = s.status_spp ?? "Lancar";
  const statusOrtu = s.status_orang_tua ?? s.status_ortu ?? "Lengkap";

  return [
    {
      label: "Kehadiran",
      nilai: katKehadiran,
      angka: `${kehadiranAngka} hari`,
      level:
        katKehadiran === "Kurang"
          ? "risiko"
          : katKehadiran === "Baik"
          ? "waspada"
          : "aman",
      alasan:
        katKehadiran === "Kurang"
          ? "Tingkat kehadiran rendah (<170 hari) — faktor utama risiko dropout"
          : katKehadiran === "Baik"
          ? "Kehadiran cukup baik, perlu dipertahankan"
          : "Kehadiran sangat baik (≥200 hari)",
    },
    {
      label: "Nilai Rata-rata",
      nilai: katNilai,
      angka: `${Number(nilaiRata).toFixed(1)}`,
      level:
        katNilai === "Rendah"
          ? "risiko"
          : katNilai === "Sedang"
          ? "waspada"
          : "aman",
      alasan:
        katNilai === "Rendah"
          ? "Nilai rata-rata di bawah 70 — prestasi akademik mengkhawatirkan"
          : katNilai === "Sedang"
          ? "Nilai rata-rata 70–79 — perlu perhatian agar tidak menurun"
          : "Nilai rata-rata ≥80 — prestasi akademik baik",
    },
    {
      label: "Pelanggaran",
      nilai: katPelanggaran,
      angka: `${jmlPelanggaran} kasus`,
      level:
        katPelanggaran === "Sedang/Berat"
          ? "risiko"
          : katPelanggaran === "Ringan"
          ? "waspada"
          : "aman",
      alasan:
        katPelanggaran === "Sedang/Berat"
          ? "Pelanggaran lebih dari 3 kasus — faktor risiko kedisiplinan signifikan"
          : katPelanggaran === "Ringan"
          ? "Terdapat 1–3 pelanggaran — perlu pembinaan ringan"
          : "Tidak ada catatan pelanggaran",
    },
    {
      label: "Pekerjaan Ortu",
      nilai: pekerjaanOrtu,
      level:
        pekerjaanOrtu === "Buruh/Petani" || pekerjaanOrtu === "Tidak Bekerja"
          ? "risiko"
          : pekerjaanOrtu === "Wiraswasta" || pekerjaanOrtu === "Lainnya"
          ? "waspada"
          : "aman",
      alasan:
        pekerjaanOrtu === "Tidak Bekerja"
          ? "Orang tua tidak bekerja — berpengaruh pada stabilitas ekonomi keluarga"
          : pekerjaanOrtu === "Buruh/Petani"
          ? "Pekerjaan orang tua berpotensi berdampak pada ekonomi keluarga"
          : "Pekerjaan orang tua cukup stabil",
    },
    {
      label: "Penghasilan Ortu",
      nilai: penghasilanOrtu,
      level:
        penghasilanOrtu === "< Rp 2.000.000"
          ? "risiko"
          : penghasilanOrtu === "Rp 2.000.000 - Rp 5.000.000"
          ? "waspada"
          : "aman",
      alasan:
        penghasilanOrtu === "< Rp 2.000.000"
          ? "Penghasilan di bawah UMR — risiko ketidakmampuan membiayai pendidikan"
          : penghasilanOrtu === "Rp 2.000.000 - Rp 5.000.000"
          ? "Penghasilan menengah — perlu dipantau kestabilannya"
          : "Penghasilan orang tua mencukupi",
    },
    {
      label: "Status SPP",
      nilai: statusSpp,
      level:
        statusSpp === "Menunggak >2 Bulan"
          ? "risiko"
          : statusSpp === "Menunggak 1-2 Bulan"
          ? "waspada"
          : "aman",
      alasan:
        statusSpp === "Menunggak >2 Bulan"
          ? "Menunggak SPP lebih dari 2 bulan — indikasi kesulitan finansial serius"
          : statusSpp === "Menunggak 1-2 Bulan"
          ? "SPP menunggak 1–2 bulan — perlu perhatian segera"
          : "Pembayaran SPP berjalan lancar",
    },
    {
      label: "Status Orang Tua",
      nilai: statusOrtu,
      level:
        statusOrtu === "Yatim Piatu"
          ? "risiko"
          : statusOrtu === "Yatim" || statusOrtu === "Piatu"
          ? "waspada"
          : "aman",
      alasan:
        statusOrtu === "Yatim Piatu"
          ? "Tidak memiliki orang tua — risiko kurangnya dukungan keluarga"
          : statusOrtu === "Yatim" || statusOrtu === "Piatu"
          ? "Salah satu orang tua telah tiada — perlu perhatian lebih"
          : "Kondisi keluarga lengkap",
    },
  ];
}

export default function BKSiswaBerisiko() {
  const [siswa, setSiswa] = useState<SiswaBerisiko[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaBerisiko | null>(null);
  const [catatan, setCatatan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/laporan/siswa-berisiko");
      setSiswa(res.data.siswa_berisiko);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openBuatLaporan = (item: SiswaBerisiko) => {
    setSelectedSiswa(item);
    setCatatan("");
    setRekomendasi("");
    setAlertMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa) return;
    setSubmitting(true);
    try {
      await api.post("/laporan/", {
        student_id: selectedSiswa.id,
        catatan,
        rekomendasi,
      });
      setAlertMsg({ type: "success", msg: `Laporan untuk ${selectedSiswa.nama} berhasil dikirim ke Wali Kelas.` });
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAlertMsg({ type: "error", msg: e.response?.data?.message || "Gagal membuat laporan." });
    } finally {
      setSubmitting(false);
    }
  };

  const tinggi = siswa.filter((s) => s.status_risiko === "Tinggi");
  const sedang = siswa.filter((s) => s.status_risiko === "Sedang");

  const levelIcon = (level: "risiko" | "waspada" | "aman") => {
    if (level === "risiko") return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
    if (level === "waspada") return <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
    return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  };

  const levelRowClass = (level: "risiko" | "waspada" | "aman") => {
    if (level === "risiko") return "bg-rose-500/5 border border-rose-500/20 rounded-lg";
    if (level === "waspada") return "bg-amber-500/5 border border-amber-500/20 rounded-lg";
    return "bg-gray-950/50 border border-gray-800 rounded-lg";
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
            Siswa Berisiko Drop-Out
          </h1>
          <p className="text-gray-400 text-sm mt-1">Daftar siswa dengan potensi risiko Tinggi dan Sedang berdasarkan hasil prediksi.</p>
        </header>

        {alertMsg && (
          <div className={`mb-4 p-3 rounded-lg border text-sm flex justify-between items-center ${alertMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
            <span>{alertMsg.msg}</span>
            <button onClick={() => setAlertMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />Memuat data...
          </div>
        ) : siswa.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Tidak ada siswa berisiko saat ini.</p>
          </div>
        ) : (
          <>
            {[
              { label: "🚨 Risiko Tinggi", list: tinggi, color: "rose" },
              { label: "⚠️ Risiko Sedang", list: sedang, color: "amber" },
            ].map(({ label, list, color }) =>
              list.length > 0 ? (
                <div key={label} className="mb-6">
                  <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 text-${color}-400`}>
                    {label} ({list.length} siswa)
                  </h2>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-400 whitespace-nowrap">
                        <thead className="text-xs uppercase bg-gray-950/50 border-b border-gray-800">
                          <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Kelas</th>
                            <th className="px-4 py-3">Kehadiran</th>
                            <th className="px-4 py-3">Nilai</th>
                            <th className="px-4 py-3">Pelanggaran</th>
                            <th className="px-4 py-3">Risiko</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((item) => (
                            <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                              <td className="px-4 py-3 text-xs text-gray-500">{item.siswa_id}</td>
                              <td className="px-4 py-3 font-medium text-white">{item.nama}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs">{item.kelas}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className={`text-xs font-medium ${item.kategori_kehadiran === "Kurang" ? "text-rose-400" : "text-emerald-400"}`}>{item.kategori_kehadiran}</span>
                                  {item.jumlah_kehadiran != null && <span className="text-gray-600 text-xs">({item.jumlah_kehadiran} hari)</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className={`text-xs font-medium ${item.kategori_nilai === "Rendah" ? "text-rose-400" : item.kategori_nilai === "Sedang" ? "text-amber-400" : "text-emerald-400"}`}>{item.kategori_nilai}</span>
                                  {item.rata_rata_nilai != null && <span className="text-gray-600 text-xs">({item.rata_rata_nilai})</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className={`text-xs font-medium ${item.kategori_pelanggaran === "Tidak Ada" ? "text-gray-400" : item.kategori_pelanggaran === "Ringan" ? "text-amber-400" : "text-rose-400"}`}>{item.kategori_pelanggaran}</span>
                                  {item.jumlah_pelanggaran != null && <span className="text-gray-600 text-xs">({item.jumlah_pelanggaran} kasus)</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${risikoColor[item.status_risiko] || ""}`}>
                                  {item.status_risiko}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {item.laporan_aktif ? (
                                  <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">Laporan Dikirim</span>
                                ) : (
                                  <button
                                    onClick={() => openBuatLaporan(item)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors ml-auto">
                                    <FileText className="w-3 h-3" /> Buat Laporan
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </>
        )}
      </div>

      {/* ── Modal Buat Laporan ── */}
      {showModal && selectedSiswa && (() => {
        const faktor = getRisikoFaktor(selectedSiswa);
        const jumlahRisiko = faktor.filter((f) => f.level === "risiko").length;
        const jumlahWaspada = faktor.filter((f) => f.level === "waspada").length;

        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">

              {/* Header Modal */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold text-white">Buat Laporan Siswa Berisiko</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-5">

                {/* Info Siswa */}
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 flex flex-wrap items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{selectedSiswa.nama}</p>
                    <p className="text-xs text-gray-400">{selectedSiswa.siswa_id} · Kelas {selectedSiswa.kelas}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${risikoColor[selectedSiswa.status_risiko] || ""}`}>
                    Risiko {selectedSiswa.status_risiko}
                  </span>
                </div>

                {/* ── Analisis Faktor Risiko ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">📊 Analisis Faktor Risiko</p>
                    <div className="flex gap-2 text-xs">
                      <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" />{jumlahRisiko} faktor risiko</span>
                      <span className="flex items-center gap-1 text-amber-400"><AlertCircle className="w-3 h-3" />{jumlahWaspada} perlu pantau</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {faktor.map((f) => (
                      <div key={f.label} className={`flex items-start gap-3 px-3 py-2.5 ${levelRowClass(f.level)}`}>
                        {levelIcon(f.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-300">{f.label}:</span>
                            <span className={`text-xs font-bold ${
                              f.level === "risiko" ? "text-rose-400" :
                              f.level === "waspada" ? "text-amber-400" : "text-emerald-400"
                            }`}>
                              {f.nilai}
                              {f.angka && <span className="text-gray-500 font-normal ml-1">({f.angka})</span>}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{f.alasan}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Form Laporan ── */}
                <form id="laporan-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Catatan Kondisi Siswa <span className="text-rose-400">*</span>
                    </label>
                    <textarea required rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      placeholder="Jelaskan kondisi dan permasalahan siswa yang diamati berdasarkan analisis di atas..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Rekomendasi Tindak Lanjut</label>
                    <textarea rows={2} value={rekomendasi} onChange={(e) => setRekomendasi(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      placeholder="Saran penanganan untuk Wali Kelas (opsional)..." />
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800 flex justify-end gap-3 shrink-0">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">Batal</button>
                <button type="submit" form="laporan-form" disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Kirim Laporan ke Wali Kelas
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
