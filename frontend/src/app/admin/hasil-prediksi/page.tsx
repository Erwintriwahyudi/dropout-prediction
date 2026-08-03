"use client";

import { useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";
import {
  TrendingUp, AlertTriangle, ShieldCheck, RefreshCw,
  Users, ChevronDown, Info, Search, ClipboardList
} from "lucide-react";

const RISK_BADGE: Record<string, string> = {
  Tinggi:  "bg-rose-500/15 text-rose-400 border-rose-500/20",
  Sedang:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Rendah:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const RISK_ICON: Record<string, ReactNode> = {
  Tinggi: <AlertTriangle className="w-3.5 h-3.5" />,
  Sedang: <TrendingUp className="w-3.5 h-3.5" />,
  Rendah: <ShieldCheck className="w-3.5 h-3.5" />,
};

export default function HasilPrediksiAdminPage() {
  const [animIn, setAnimIn]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [data, setData]         = useState<any[]>([]);
  const [summary, setSummary]   = useState({ total: 0, tinggi: 0, sedang: 0, rendah: 0 });

  // Filter state
  const [filterKelas,  setFilterKelas]  = useState("Semua");
  const [filterRisiko, setFilterRisiko] = useState("Semua");
  const [search, setSearch]             = useState("");

  useEffect(() => {
    setAnimIn(true);
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/predict/results");
      setData(res.data.data || []);
      setSummary(res.data.summary || { total: 0, tinggi: 0, sedang: 0, rendah: 0 });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal mengambil data hasil prediksi.");
    } finally {
      setLoading(false);
    }
  };

  // Derived unique kelas list for filter
  const kelasList = Array.from(new Set(data.map(d => (d.kelas || "").split("-")[0].trim()))).filter(Boolean).sort();

  const filtered = data.filter(row => {
    const matchKelas  = filterKelas  === "Semua" || (row.kelas || "").startsWith(filterKelas);
    const matchRisiko = filterRisiko === "Semua" || row.kategori_risiko === filterRisiko;
    const matchSearch = !search || (row.nama_lengkap || "").toLowerCase().includes(search.toLowerCase())
                                || (row.siswa_id || "").toLowerCase().includes(search.toLowerCase());
    return matchKelas && matchRisiko && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8">
      <div className={`max-w-7xl mx-auto transition-all duration-700 ${animIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
              <ClipboardList className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Hasil Prediksi Risiko Drop-Out Siswa</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Daftar hasil akhir prediksi menggunakan model Hybrid (C4.5 + Naive Bayes)
              </p>
            </div>
          </div>

          <button
            onClick={fetchResults}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>

        {/* ── Summary Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Siswa",      value: summary.total,  color: "cyan",    icon: <Users className="w-5 h-5" /> },
            { label: "Risiko Tinggi",    value: summary.tinggi, color: "rose",    icon: <AlertTriangle className="w-5 h-5" /> },
            { label: "Risiko Sedang",    value: summary.sedang, color: "amber",   icon: <TrendingUp className="w-5 h-5" /> },
            { label: "Risiko Rendah",    value: summary.rendah, color: "emerald", icon: <ShieldCheck className="w-5 h-5" /> },
          ].map((card, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-colors">
              <div className={`text-${card.color}-400 mb-2`}>{card.icon}</div>
              <p className={`text-3xl font-extrabold text-${card.color}-400`}>{card.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters & Search ─────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama atau ID siswa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Filter Kelas */}
            <div className="relative">
              <select
                value={filterKelas}
                onChange={e => setFilterKelas(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="Semua">Semua Kelas</option>
                {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            {/* Filter Risiko */}
            <div className="relative">
              <select
                value={filterRisiko}
                onChange={e => setFilterRisiko(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="Semua">Semua Risiko</option>
                <option value="Tinggi">Risiko Tinggi</option>
                <option value="Sedang">Risiko Sedang</option>
                <option value="Rendah">Risiko Rendah</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center shadow-lg">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Mengambil data hasil prediksi dari database...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/20 border border-red-800/40 rounded-2xl p-8 text-center shadow-lg">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-semibold mb-1">Gagal Mengambil Data</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center shadow-lg">
            <Info className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">Belum Ada Hasil Prediksi</p>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Harap jalankan proses <strong>Hybrid</strong> terlebih dahulu agar hasil prediksi tersimpan ke database dan dapat ditampilkan di sini.
            </p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-slate-500 text-xs mb-3 ml-1">
              Menampilkan <span className="text-white font-semibold">{filtered.length}</span> dari{" "}
              <span className="text-white font-semibold">{data.length}</span> data prediksi siswa
            </p>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="px-5 py-4 text-left">No</th>
                      <th className="px-5 py-4 text-left">Nama Siswa</th>
                      <th className="px-5 py-4 text-left">Kelas</th>
                      <th className="px-5 py-4 text-left">Kehadiran</th>
                      <th className="px-5 py-4 text-left">Nilai Rata-rata</th>
                      <th className="px-5 py-4 text-left">Pelanggaran</th>
                      <th className="px-5 py-4 text-left">Status SPP</th>
                      <th className="px-5 py-4 text-left">Risiko Drop-Out</th>
                      <th className="px-5 py-4 text-left">Probabilitas</th>
                      <th className="px-5 py-4 text-left">Tanggal Prediksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-10 text-center text-slate-500 text-sm">
                          Tidak ada data yang cocok dengan filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row, idx) => {
                        const risiko = row.kategori_risiko || "Sedang";
                        const hadirPersen = row.jumlah_absensi != null
                          ? Math.round(((240 - row.jumlah_absensi) / 240) * 100)
                          : null;

                        return (
                          <tr key={row.prediksi_id} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-4 text-slate-500 text-xs">{idx + 1}</td>

                            <td className="px-5 py-4">
                              <p className="text-white font-semibold text-sm">{row.nama_lengkap || "-"}</p>
                              <p className="text-slate-500 text-xs mt-0.5">{row.siswa_id}</p>
                            </td>

                            <td className="px-5 py-4 text-slate-300 text-sm">{row.kelas || "-"}</td>

                            <td className="px-5 py-4">
                              {hadirPersen != null ? (
                                <>
                                  <p className="text-white text-sm font-medium">{hadirPersen}%</p>
                                  <p className="text-slate-500 text-xs">{row.jumlah_absensi} hari absen</p>
                                </>
                              ) : <span className="text-slate-600 text-xs">-</span>}
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-white text-sm font-medium">
                                {row.nilai_rata != null ? Number(row.nilai_rata).toFixed(1) : "-"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                (row.jumlah_pelanggaran || 0) > 2 ? "bg-rose-500/10 text-rose-400"
                                : (row.jumlah_pelanggaran || 0) > 0 ? "bg-amber-500/10 text-amber-400"
                                : "bg-emerald-500/10 text-emerald-400"
                              }`}>
                                {row.jumlah_pelanggaran ?? "-"}× pelanggaran
                              </span>
                            </td>

                            <td className="px-5 py-4 text-slate-400 text-xs">{row.status_spp || "-"}</td>

                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${RISK_BADGE[risiko] || RISK_BADGE.Sedang}`}>
                                {RISK_ICON[risiko] || null}
                                {risiko}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-mono font-bold text-white text-sm">
                                {row.skor_probabilitas != null ? `${(row.skor_probabilitas / 100).toFixed(2).replace('.', ',')}%` : "-"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                              {row.tanggal_prediksi || "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
