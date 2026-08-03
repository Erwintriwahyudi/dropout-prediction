"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  FileText, CheckCircle, Clock, Loader2, X, ChevronDown, ChevronUp,
  XCircle, AlertCircle, AlertTriangle
} from "lucide-react";

interface LaporanItem {
  laporan_id: number;
  siswa: {
    nama: string;
    siswa_id: string;
    kelas: string;
    status_risiko: string;
    jumlah_absensi?: number | null;
    nilai_rata?: number | null;
    jumlah_pelanggaran?: number | null;
    pekerjaan_ortu?: string | null;
    penghasilan_ortu?: string | null;
    status_spp?: string | null;
    status_ortu?: string | null;
  };
  keterangan: string;
  status: string;
  tanggal: string;
}

const risikoColor: Record<string, string> = {
  Tinggi: "bg-rose-500/20 border-rose-500/50 text-rose-400",
  Sedang: "bg-amber-500/20 border-amber-500/50 text-amber-400",
  Rendah: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
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

export default function WaliLaporanRisikoPage() {
  const [laporan, setLaporan] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [konfirmingId, setKonfirmingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const res = await api.get("/laporan/");
      setLaporan(res.data.laporan);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLaporan(); }, []);

  const handleKonfirmasi = async (id: number) => {
    if (!confirm("Konfirmasi laporan siswa berisiko ini?")) return;
    setKonfirmingId(id);
    try {
      await api.put(`/laporan/${id}/konfirmasi`);
      setAlertMsg({ type: "success", msg: "Laporan berhasil dikonfirmasi." });
      fetchLaporan();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAlertMsg({ type: "error", msg: err.response?.data?.message || "Gagal mengkonfirmasi." });
    } finally {
      setKonfirmingId(null);
    }
  };

  const levelIcon = (level: "risiko" | "waspada" | "aman") => {
    if (level === "risiko") return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
    if (level === "waspada") return <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
    return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  };

  const levelRowClass = (level: "risiko" | "waspada" | "aman") => {
    if (level === "risiko") return "bg-rose-500/5 border border-rose-500/20 rounded-lg";
    if (level === "waspada") return "bg-amber-500/5 border border-amber-500/20 rounded-lg";
    return "bg-slate-950/50 border border-slate-800 rounded-lg";
  };

  const belumDikonfirmasi = laporan.filter((l) => l.status === "Dikirim");
  const sudahDikonfirmasi = laporan.filter((l) => l.status === "Dikonfirmasi");

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-400" />
            Laporan Siswa Berisiko
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Laporan dari Guru BK mengenai siswa berisiko dropout di kelas Anda.
          </p>
        </header>

        {alertMsg && (
          <div className={`mb-4 p-3 rounded-lg border text-sm flex items-center justify-between ${alertMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
            <span>{alertMsg.msg}</span>
            <button onClick={() => setAlertMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat laporan...
          </div>
        ) : laporan.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Belum ada laporan dari Guru BK.</p>
          </div>
        ) : (
          <>
            {/* Laporan Menunggu Konfirmasi */}
            {belumDikonfirmasi.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Menunggu Konfirmasi ({belumDikonfirmasi.length})
                </h2>
                <div className="space-y-3">
                  {belumDikonfirmasi.map((item) => {
                    const faktorList = item.siswa ? getRisikoFaktor(item.siswa) : [];
                    const jumlahRisiko = faktorList.filter((f) => f.level === "risiko").length;
                    const jumlahWaspada = faktorList.filter((f) => f.level === "waspada").length;

                    return (
                      <div key={item.laporan_id} className="bg-gray-900 border border-amber-500/30 rounded-xl overflow-hidden">
                        <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-semibold text-white">{item.siswa?.nama}</span>
                              <span className="text-xs text-gray-400">{item.siswa?.siswa_id}</span>
                              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">Kelas {item.siswa?.kelas}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${risikoColor[item.siswa?.status_risiko] || "bg-slate-500/20 border-slate-500/50 text-slate-400"}`}>
                                Risiko {item.siswa?.status_risiko}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">Terkirim: {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                            <p className="text-sm text-gray-300 mt-2 line-clamp-2">{item.keterangan}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => setExpandedId(expandedId === item.laporan_id ? null : item.laporan_id)}
                              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors flex items-center gap-1">
                              {expandedId === item.laporan_id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Detail
                            </button>
                            <button
                              onClick={() => handleKonfirmasi(item.laporan_id)}
                              disabled={konfirmingId === item.laporan_id}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                              {konfirmingId === item.laporan_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Konfirmasi
                            </button>
                          </div>
                        </div>
                        
                        {expandedId === item.laporan_id && (
                          <div className="border-t border-gray-800 p-5 bg-gray-950/70 space-y-4">
                            {/* Detailed Risk Factors */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">📊 Analisis Faktor Risiko</p>
                                <div className="flex gap-2 text-xs">
                                  <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" />{jumlahRisiko} faktor risiko</span>
                                  <span className="flex items-center gap-1 text-amber-400"><AlertCircle className="w-3 h-3" />{jumlahWaspada} perlu pantau</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                {faktorList.map((f) => (
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

                            <div className="border-t border-gray-800 pt-3">
                              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Catatan dari Guru BK</p>
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.keterangan}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Laporan Sudah Dikonfirmasi */}
            {sudahDikonfirmasi.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Sudah Dikonfirmasi ({sudahDikonfirmasi.length})
                </h2>
                <div className="space-y-2">
                  {sudahDikonfirmasi.map((item) => {
                    const faktorList = item.siswa ? getRisikoFaktor(item.siswa) : [];
                    const jumlahRisiko = faktorList.filter((f) => f.level === "risiko").length;
                    const jumlahWaspada = faktorList.filter((f) => f.level === "waspada").length;

                    return (
                      <div key={item.laporan_id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-semibold text-white text-sm">{item.siswa?.nama}</span>
                              <span className="text-xs text-gray-500">{item.siswa?.siswa_id}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${risikoColor[item.siswa?.status_risiko] || ""}`}>
                                Risiko {item.siswa?.status_risiko}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Dikonfirmasi · {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                          </div>
                          <div>
                            <button
                              onClick={() => setExpandedId(expandedId === item.laporan_id ? null : item.laporan_id)}
                              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors flex items-center gap-1">
                              {expandedId === item.laporan_id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Detail
                            </button>
                          </div>
                        </div>

                        {expandedId === item.laporan_id && (
                          <div className="border-t border-gray-800 p-5 bg-gray-950/70 space-y-4">
                            {/* Detailed Risk Factors */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">📊 Analisis Faktor Risiko</p>
                                <div className="flex gap-2 text-xs">
                                  <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" />{jumlahRisiko} faktor risiko</span>
                                  <span className="flex items-center gap-1 text-amber-400"><AlertCircle className="w-3 h-3" />{jumlahWaspada} perlu pantau</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                {faktorList.map((f) => (
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

                            <div className="border-t border-gray-800 pt-3">
                              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Catatan dari Guru BK</p>
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.keterangan}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
