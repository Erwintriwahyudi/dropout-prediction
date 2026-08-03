"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import api from "@/lib/api";
import {
  Printer, Trash2, Plus, FileText, AlertTriangle, ShieldCheck,
  TrendingUp, X, RefreshCw, Eye, Search, Info, ChevronDown, CheckCircle2
} from "lucide-react";

const RISK_BADGE: Record<string, string> = {
  Tinggi: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  Sedang: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Rendah: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};
const RISK_ICON: Record<string, ReactNode> = {
  Tinggi: <AlertTriangle className="w-3 h-3" />,
  Sedang: <TrendingUp className="w-3 h-3" />,
  Rendah: <ShieldCheck className="w-3 h-3" />,
};

// ─── Print Preview Component ───────────────────────────────────────────────
function PrintPreview({ laporan, onClose }: { laporan: any; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const siswa = laporan.siswa || {};
  const hadirPersen = siswa.jumlah_absensi != null
    ? Math.round(((240 - siswa.jumlah_absensi) / 240) * 100) : null;
  const tanggal = laporan.tanggal
    ? new Date(laporan.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-indigo-400" />
            <h2 className="text-white font-bold">Detail Laporan #{laporan.laporan_id}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow"
            >
              <Printer className="w-4 h-4" /> Cetak Laporan
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="p-6 print:p-0">
          <div className="bg-white text-slate-900 p-8 rounded-2xl print:rounded-none">
            {/* Doc Header */}
            <div className="text-center border-b-2 border-slate-800 pb-5 mb-6">
              <h1 className="text-lg font-bold uppercase tracking-wide">MTS ISLAM ARRIDHO</h1>
              <p className="text-xs text-slate-500 mt-1">Laporan Hasil Prediksi Risiko Drop-Out Siswa</p>
              <p className="text-xs text-slate-500">Sistem Prediksi Berbasis Metode Hybrid (C4.5 + Naive Bayes)</p>
            </div>

            {/* Doc Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><p className="text-slate-500">Nomor Laporan:</p><p className="font-bold">LAP-{String(laporan.laporan_id).padStart(4, "0")}</p></div>
              <div><p className="text-slate-500">Tanggal Laporan:</p><p className="font-bold">{tanggal}</p></div>
              <div><p className="text-slate-500">Status:</p><p className="font-bold">{laporan.status}</p></div>
              <div><p className="text-slate-500">Metode Prediksi:</p><p className="font-bold">Hybrid C4.5 + Naive Bayes</p></div>
            </div>

            {/* Student Info */}
            <h3 className="text-sm font-bold uppercase mb-3 text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Data Siswa
            </h3>
            <table className="w-full text-xs mb-6 border-collapse border border-slate-200">
              <tbody>
                {[
                  ["Nama Lengkap", siswa.nama_lengkap || "-"],
                  ["Kelas", siswa.kelas || "-"],
                  ["Tahun Ajaran", siswa.tahun_ajaran || "2026/2027"],
                  ["Kehadiran", hadirPersen != null ? `${hadirPersen}% (${siswa.jumlah_absensi} hari absen)` : "-"],
                  ["Nilai Rata-rata", siswa.nilai_rata != null ? Number(siswa.nilai_rata).toFixed(1) : "-"],
                  ["Jumlah Pelanggaran", siswa.jumlah_pelanggaran != null ? `${siswa.jumlah_pelanggaran} kali` : "-"],
                  ["Status SPP", siswa.status_spp || "-"],
                  ["Status Orang Tua", siswa.status_ortu || "-"],
                  ["Pekerjaan Orang Tua", siswa.pekerjaan_ortu || "-"],
                  ["Penghasilan Orang Tua", siswa.penghasilan_ortu || "-"],
                ].map(([label, val]) => (
                  <tr key={label} className="border-b border-slate-200">
                    <td className="p-2 font-semibold text-slate-600 bg-slate-50 w-1/3">{label}</td>
                    <td className="p-2">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Risk Result */}
            <h3 className="text-sm font-bold uppercase mb-3 text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Hasil Prediksi Risiko
            </h3>
            <div className={`p-4 rounded-xl mb-6 border text-sm font-semibold ${laporan.kategori_risiko === "Tinggi" ? "bg-rose-50 border-rose-200 text-rose-700"
              : laporan.kategori_risiko === "Sedang" ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}>
              Kategori Risiko: <span className="font-extrabold">{laporan.kategori_risiko || "-"}</span>
              {laporan.skor_probabilitas && <span className="ml-3 font-normal text-xs">(Probabilitas: {(laporan.skor_probabilitas / 100).toFixed(2).replace('.', ',')}%)</span>}
            </div>

            {/* Notes */}
            {laporan.keterangan && (
              <>
                <h3 className="text-sm font-bold uppercase mb-2 text-slate-700">Catatan & Rekomendasi</h3>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6">{laporan.keterangan}</p>
              </>
            )}

            {/* Signature */}
            <div className="flex justify-end text-xs mt-12 print:mt-20">
              <div className="text-center w-44">
                <p>Mengetahui,</p>
                <p className="font-semibold mt-0.5">Kepala Sekolah MTS Islam Arridho</p>
                <div className="h-14" />
                <p className="font-bold underline">Hj. Fitri Prihatin, M.Pd</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tambah Laporan Modal ─────────────────────────────────────────────────────
function TambahModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [prediksiList, setPrediksiList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [catatan, setCatatan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/laporan/admin/prediksi-list")
      .then(res => setPrediksiList(res.data.data || []))
      .catch(() => { });
  }, []);

  const filtered = prediksiList.filter(p =>
    !search || (p.nama_lengkap || "").toLowerCase().includes(search.toLowerCase())
    || (p.kelas || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selected) return alert("Pilih data prediksi siswa terlebih dahulu.");
    if (!catatan.trim()) return alert("Catatan wajib diisi.");
    setSaving(true);
    try {
      await api.post("/laporan/admin/create", {
        prediksi_id: selected.prediksi_id,
        catatan,
        rekomendasi,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Gagal menyimpan laporan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-bold">Tambah Laporan Baru</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Select Prediction */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              1. Pilih Data Hasil Prediksi Siswa
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama atau kelas siswa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Tidak ada data prediksi tersedia. Harap jalankan proses Hybrid terlebih dahulu.
                </div>
              ) : (
                filtered.map(p => (
                  <button
                    key={p.prediksi_id}
                    onClick={() => setSelected(p)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${selected?.prediksi_id === p.prediksi_id
                      ? "bg-emerald-900/30 text-white"
                      : "hover:bg-slate-800 text-slate-300"
                      }`}
                  >
                    <div>
                      <p className="font-semibold">{p.nama_lengkap}</p>
                      <p className="text-xs text-slate-500">{p.kelas} · {p.tanggal_prediksi}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${RISK_BADGE[p.kategori_risiko] || RISK_BADGE.Sedang}`}>
                        {RISK_ICON[p.kategori_risiko]}
                        {p.kategori_risiko}
                      </span>
                      {selected?.prediksi_id === p.prediksi_id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Step 2: Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              2. Catatan <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Isi catatan untuk laporan ini..."
              className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Step 3: Rekomendasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              3. Rekomendasi Tindakan (opsional)
            </label>
            <textarea
              rows={2}
              value={rekomendasi}
              onChange={e => setRekomendasi(e.target.value)}
              placeholder="Rekomendasi tindak lanjut (opsional)..."
              className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors text-sm font-semibold">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selected}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${saving || !selected
                ? "bg-emerald-600/40 text-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                }`}
            >
              {saving ? "Menyimpan..." : "Simpan Laporan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteDialog({ laporan, onClose, onDeleted }: { laporan: any; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/laporan/admin/${laporan.laporan_id}`);
      onDeleted();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Gagal menghapus laporan.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-rose-800/40 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-500/10 rounded-xl">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          <h2 className="text-white font-bold">Hapus Laporan?</h2>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Anda akan menghapus laporan <strong className="text-white">LAP-{String(laporan.laporan_id).padStart(4, "0")}</strong> untuk siswa{" "}
          <strong className="text-white">{laporan.siswa?.nama_lengkap || "-"}</strong>.
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors text-sm font-semibold">
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow"
          >
            {deleting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const [animIn, setAnimIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [laporan, setLaporan] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showTambah, setShowTambah] = useState(false);
  const [printItem, setPrintItem] = useState<any | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  // Filter
  const [filterRisiko, setFilterRisiko] = useState("Semua");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setAnimIn(true);
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/laporan/admin/all");
      setLaporan(res.data.laporan || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Gagal mengambil data laporan.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = laporan.filter(l => {
    const nama = l.siswa?.nama_lengkap || "";
    const matchSearch = !search || nama.toLowerCase().includes(search.toLowerCase());
    const matchRisiko = filterRisiko === "Semua" || l.kategori_risiko === filterRisiko;
    return matchSearch && matchRisiko;
  });

  return (
    <>
      {/* Modals */}
      {showTambah && <TambahModal onClose={() => setShowTambah(false)} onSaved={fetchLaporan} />}
      {printItem && <PrintPreview laporan={printItem} onClose={() => setPrintItem(null)} />}
      {deleteItem && <DeleteDialog laporan={deleteItem} onClose={() => setDeleteItem(null)} onDeleted={fetchLaporan} />}

      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${animIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <Printer className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Laporan Hasil Prediksi</h1>
                <p className="text-slate-400 text-sm mt-0.5">Kelola, cetak, dan hapus laporan hasil analisis risiko drop-out</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchLaporan}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors text-sm font-semibold"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowTambah(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors text-sm font-semibold shadow-lg hover:shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                Tambah Laporan
              </button>
            </div>
          </div>

          {/* ── Filter Bar ──────────────────────────────────────────── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="relative">
                <select
                  value={filterRisiko}
                  onChange={e => setFilterRisiko(e.target.value)}
                  className="appearance-none bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-indigo-500 transition-colors"
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

          {/* ── Content ─────────────────────────────────────────────── */}
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center shadow-lg">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Mengambil data laporan dari database...</p>
            </div>
          ) : error ? (
            <div className="bg-red-950/20 border border-red-800/40 rounded-2xl p-8 text-center shadow-lg">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 font-semibold mb-1">Gagal Mengambil Data</p>
              <p className="text-slate-400 text-sm">{error}</p>
            </div>
          ) : laporan.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center shadow-lg">
              <Info className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Belum Ada Laporan Tersimpan</p>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Klik <strong>Tambah Laporan</strong> untuk memilih data prediksi dan membuat laporan baru.
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-500 text-xs mb-3 ml-1">
                Menampilkan <span className="text-white font-semibold">{filtered.length}</span> dari{" "}
                <span className="text-white font-semibold">{laporan.length}</span> laporan
              </p>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-5 py-4 text-left">No. Laporan</th>
                        <th className="px-5 py-4 text-left">Nama Siswa</th>
                        <th className="px-5 py-4 text-left">Kelas</th>
                        <th className="px-5 py-4 text-left">Hasil Prediksi</th>
                        <th className="px-5 py-4 text-left">Probabilitas</th>
                        <th className="px-5 py-4 text-left">Tanggal Laporan</th>
                        <th className="px-5 py-4 text-left">Status</th>
                        <th className="px-5 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-slate-500 text-sm">
                            Tidak ada laporan yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((l, idx) => {
                          const siswa = l.siswa || {};
                          const risiko = l.kategori_risiko || "Sedang";
                          const tanggal = l.tanggal
                            ? new Date(l.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                            : "-";
                          return (
                            <tr key={l.laporan_id} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                              <td className="px-5 py-4 text-slate-400 font-mono text-xs font-semibold">
                                LAP-{String(l.laporan_id).padStart(4, "0")}
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-white font-semibold">{siswa.nama_lengkap || "-"}</p>
                                <p className="text-slate-500 text-xs">{siswa.siswa_id || "-"}</p>
                              </td>
                              <td className="px-5 py-4 text-slate-300 text-sm">{siswa.kelas || "-"}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${RISK_BADGE[risiko] || RISK_BADGE.Sedang}`}>
                                  {RISK_ICON[risiko]}
                                  {risiko}
                                </span>
                              </td>
                              <td className="px-5 py-4 font-mono text-white font-bold text-sm">
                                {l.skor_probabilitas != null ? `${(l.skor_probabilitas / 100).toFixed(2).replace('.', ',')}%` : "-"}
                              </td>
                              <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{tanggal}</td>
                              <td className="px-5 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.status === "Tersimpan" ? "bg-blue-500/10 text-blue-400"
                                  : l.status === "Dikirim" ? "bg-amber-500/10 text-amber-400"
                                    : "bg-emerald-500/10 text-emerald-400"
                                  }`}>
                                  {l.status}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  {/* Print */}
                                  <button
                                    onClick={() => setPrintItem(l)}
                                    title="Lihat & Cetak Laporan"
                                    className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={() => setDeleteItem(l)}
                                    title="Hapus Laporan"
                                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
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
    </>
  );
}
