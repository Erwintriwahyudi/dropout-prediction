"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Plus, X, Edit2, Trash2, Users, Eye, ChevronRight, CheckCircle, Loader2 } from "lucide-react";

interface StudentData {
  id: number;
  siswa_id: string;
  nisn: string;
  nama: string;
  kelas: string;
  kategori_kehadiran: string;
  kehadiran_angka?: number | string | null;
  jumlah_kehadiran?: number | string | null;
  kehadiran?: number | string | null;
  kategori_nilai: string;
  nilai_angka?: number | string | null;
  rata_rata_nilai?: number | string | null;
  nilai?: number | string | null;
  kategori_pelanggaran: string;
  pelanggaran_angka?: number | string | null;
  jumlah_pelanggaran?: number | string | null;
  pelanggaran?: number | string | null;
  pekerjaan_orang_tua: string;
  penghasilan_orang_tua: string;
  status_spp: string;
  status_orang_tua: string;
  status_risiko: string;
}

const KELAS_OPTIONS = ["7A", "7B", "7C", "7D", "8A", "8B", "8C", "8D", "9A", "9B", "9C", "9D"];
const PEKERJAAN_OPTIONS = ["PNS/TNI/Polri", "Karyawan Swasta", "Wiraswasta", "Buruh/Petani", "Tidak Bekerja", "Lainnya"];
const PENGHASILAN_OPTIONS = ["< Rp 2.000.000", "Rp 2.000.000 - Rp 5.000.000", "> Rp 5.000.000"];
const SPP_OPTIONS = ["Lancar", "Menunggak 1-2 Bulan", "Menunggak >2 Bulan"];
const ORTU_OPTIONS = ["Lengkap", "Yatim", "Piatu", "Yatim Piatu"];

// --- Helper Konversi Otomatis Angka ke Kategori ---
const getKategoriKehadiranFromAngka = (val: number | string | null | undefined) => {
  if (val === null || val === undefined || val === "") return "Baik";
  const num = Number(val);
  if (isNaN(num)) return "Baik";
  if (num >= 200) return "Sangat Baik";
  if (num >= 170) return "Baik";
  return "Kurang";
};

const getKategoriNilaiFromAngka = (val: number | string | null | undefined) => {
  if (val === null || val === undefined || val === "") return "Sedang";
  const num = Number(val);
  if (isNaN(num)) return "Sedang";
  if (num >= 80) return "Tinggi";
  if (num >= 70) return "Sedang";
  return "Rendah";
};

const getKategoriPelanggaranFromAngka = (val: number | string | null | undefined) => {
  if (val === null || val === undefined || val === "") return "Tidak Ada";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "Tidak Ada";
  if (num <= 3) return "Ringan";
  return "Sedang/Berat";
};

export default function SiswaPage() {
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentData | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // --- Detail modal state ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    student: { id: number; siswa_id: string; nama: string; kelas: string };
    data_raw: Record<string, string>;
    data_encoded: Record<string, number>;
    prediction_detail: {
      status_risiko: string;
      probabilitas: Record<string, number>;
      rules: string[];
      rule_summary: string;
    };
  } | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    nisn: "",
    kelas: "",
    kehadiran_angka: "" as string | number,
    nilai_angka: "" as string | number,
    pelanggaran_angka: "" as string | number,
    pekerjaan_orang_tua: "Wiraswasta",
    penghasilan_orang_tua: "Rp 2.000.000 - Rp 5.000.000",
    status_spp: "Lancar",
    status_orang_tua: "Lengkap",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/students/");
      const resData = res.data.students || res.data.data || res.data;
      setData(Array.isArray(resData) ? resData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      nama: "",
      nisn: "",
      kelas: "",
      kehadiran_angka: "",
      nilai_angka: "",
      pelanggaran_angka: "0",
      pekerjaan_orang_tua: "Wiraswasta",
      penghasilan_orang_tua: "Rp 2.000.000 - Rp 5.000.000",
      status_spp: "Lancar",
      status_orang_tua: "Lengkap",
    });
    setAlertMsg(null);
    setShowModal(true);
  };

  const openEditModal = (item: StudentData) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      nisn: item.nisn,
      kelas: item.kelas,
      kehadiran_angka: item.kehadiran_angka ?? item.jumlah_kehadiran ?? item.kehadiran ?? "",
      nilai_angka: item.nilai_angka ?? item.rata_rata_nilai ?? item.nilai ?? "",
      pelanggaran_angka: item.pelanggaran_angka ?? item.jumlah_pelanggaran ?? item.pelanggaran ?? 0,
      pekerjaan_orang_tua: item.pekerjaan_orang_tua,
      penghasilan_orang_tua: item.penghasilan_orang_tua,
      status_spp: item.status_spp,
      status_orang_tua: item.status_orang_tua,
    });
    setAlertMsg(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data siswa ini?")) return;
    try {
      await api.delete(`/students/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus siswa.");
    }
  };

  const openDetailModal = async (id: number) => {
    setDetailData(null);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/students/${id}/detail`);
      setDetailData(res.data);
    } catch (err) {
      console.error(err);
      setShowDetailModal(false);
      alert("Gagal memuat detail preprocessing.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    const katKehadiran = getKategoriKehadiranFromAngka(formData.kehadiran_angka);
    const katNilai = getKategoriNilaiFromAngka(formData.nilai_angka);
    const katPelanggaran = getKategoriPelanggaranFromAngka(formData.pelanggaran_angka);

    const payload = {
      nama: formData.nama,
      nisn: formData.nisn,
      kelas: formData.kelas,
      kategori_kehadiran: katKehadiran,
      kehadiran_angka: formData.kehadiran_angka === "" ? null : Number(formData.kehadiran_angka),
      kategori_nilai: katNilai,
      nilai_angka: formData.nilai_angka === "" ? null : Number(formData.nilai_angka),
      kategori_pelanggaran: katPelanggaran,
      pelanggaran_angka: formData.pelanggaran_angka === "" ? null : Number(formData.pelanggaran_angka),
      pekerjaan_orang_tua: formData.pekerjaan_orang_tua,
      penghasilan_orang_tua: formData.penghasilan_orang_tua,
      status_spp: formData.status_spp,
      status_orang_tua: formData.status_orang_tua,
    };

    try {
      if (editingItem) {
        await api.put(`/students/${editingItem.id}`, payload);
        setAlertMsg({ type: "success", msg: "Data siswa berhasil diperbarui." });
      } else {
        const res = await api.post("/students/", payload);
        setAlertMsg({
          type: "success",
          msg: `Siswa berhasil ditambahkan! ID: ${res.data.data?.siswa_id || res.data.siswa_id}`,
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAlertMsg({
        type: "error",
        msg: error.response?.data?.message || "Operasi gagal.",
      });
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nisn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.siswa_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = "w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors";

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-500" />
              Data Siswa
            </h1>
            <p className="text-gray-400 mt-2">Manajemen data master seluruh siswa.</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Siswa
          </button>
        </header>

        {alertMsg && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm ${alertMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
          >
            {alertMsg.msg}
          </div>
        )}

        {/* ── Detail Preprocessing Modal ── */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    Detail Transformasi Preprocessing
                  </h2>
                  {detailData && (
                    <p className="text-gray-400 text-xs mt-0.5">
                      {detailData.student.nama} — {detailData.student.siswa_id} ({detailData.student.kelas})
                    </p>
                  )}
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-5">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Memproses data...</span>
                  </div>
                ) : detailData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="px-4 py-2.5 bg-slate-800 border-b border-gray-700">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">① Sebelum Preprocessing (Data Mentah)</p>
                        </div>
                        <table className="w-full text-sm">
                          <tbody>
                            {Object.entries(detailData.data_raw).map(([key, val]) => (
                              <tr key={key} className="border-b border-gray-800/60 last:border-0">
                                <td className="px-4 py-2.5 text-gray-400 font-medium w-1/2">{key}</td>
                                <td className="px-4 py-2.5 text-white font-mono">{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-gray-950 rounded-xl border border-cyan-900/50 overflow-hidden">
                        <div className="px-4 py-2.5 bg-cyan-950/60 border-b border-cyan-900/40">
                          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">② Sesudah Preprocessing (Ordinal Encoding)</p>
                        </div>
                        <table className="w-full text-sm">
                          <tbody>
                            {Object.entries(detailData.data_encoded).map(([key, val]) => (
                              <tr key={key} className="border-b border-gray-800/60 last:border-0">
                                <td className="px-4 py-2.5 text-gray-400 font-medium w-1/2">{key}</td>
                                <td className="px-4 py-2.5">
                                  <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">{val}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">③ Jalur Keputusan C4.5 (Decision Path)</p>
                      <ol className="space-y-1.5">
                        {detailData.prediction_detail.rules.map((rule, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300 font-mono text-xs">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3">④ Probabilitas Kelas (Hybrid C4.5 + Naive Bayes)</p>
                      <div className="space-y-2">
                        {Object.entries(detailData.prediction_detail.probabilitas).sort((a, b) => b[1] - a[1]).map(([cls, prob]) => {
                          const color = cls === "Tinggi" ? "bg-rose-500" : cls === "Rendah" ? "bg-emerald-500" : "bg-amber-500";
                          const textColor = cls === "Tinggi" ? "text-rose-400" : cls === "Rendah" ? "text-emerald-400" : "text-amber-400";
                          return (
                            <div key={cls}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className={`font-semibold ${textColor}`}>Risiko {cls}</span>
                                <span className="text-white font-mono">{prob}%</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-2">
                                <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${prob}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {detailData && (
                <div className="p-4 border-t border-gray-800 bg-gray-950/60">
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${detailData.prediction_detail.status_risiko === "Tinggi"
                    ? "bg-rose-500/10 border-rose-500/30"
                    : detailData.prediction_detail.status_risiko === "Rendah"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-amber-500/10 border-amber-500/30"
                    }`}>
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 ${detailData.prediction_detail.status_risiko === "Tinggi" ? "text-rose-400"
                      : detailData.prediction_detail.status_risiko === "Rendah" ? "text-emerald-400"
                        : "text-amber-400"
                      }`} />
                    <div>
                      <p className="text-white text-sm font-semibold">
                        Kategori Risiko: <span className={detailData.prediction_detail.status_risiko === "Tinggi" ? "text-rose-400" : detailData.prediction_detail.status_risiko === "Rendah" ? "text-emerald-400" : "text-amber-400"}>{detailData.prediction_detail.status_risiko}</span>
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">{detailData.prediction_detail.rule_summary}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Add / Edit Modal ── */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingItem ? "Edit Data Siswa" : "Tambah Siswa Baru"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[75vh]">
                <form id="siswa-form" onSubmit={handleSubmit} className="space-y-4">
                  {editingItem && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">ID Siswa</label>
                      <input type="text" value={editingItem.siswa_id} readOnly
                        className="w-full px-4 py-2 bg-gray-950/50 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed font-mono" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Nama Lengkap</label>
                      <input type="text" required value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className={inputClass} placeholder="Nama siswa..." />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">NISN</label>
                      <input type="text" required value={formData.nisn}
                        onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                        className={inputClass} placeholder="NISN..." />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Kelas</label>
                      <select required value={formData.kelas}
                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                        className={inputClass}>
                        <option value="">-- Pilih Kelas --</option>
                        {KELAS_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Jumlah Kehadiran (Hari)</label>
                      <input type="number" required value={formData.kehadiran_angka}
                        onChange={(e) => setFormData({ ...formData, kehadiran_angka: e.target.value })}
                        className={inputClass} placeholder="Contoh: 210" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Rata-rata Nilai (Angka)</label>
                      <input type="number" step="0.1" required value={formData.nilai_angka}
                        onChange={(e) => setFormData({ ...formData, nilai_angka: e.target.value })}
                        className={inputClass} placeholder="Contoh: 85.5" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Jumlah Pelanggaran (Kali)</label>
                      <input type="number" required value={formData.pelanggaran_angka}
                        onChange={(e) => setFormData({ ...formData, pelanggaran_angka: e.target.value })}
                        className={inputClass} placeholder="Contoh: 0" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Pekerjaan Ortu</label>
                      <select required value={formData.pekerjaan_orang_tua}
                        onChange={(e) => setFormData({ ...formData, pekerjaan_orang_tua: e.target.value })}
                        className={inputClass}>
                        {PEKERJAAN_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Penghasilan Ortu</label>
                      <select required value={formData.penghasilan_orang_tua}
                        onChange={(e) => setFormData({ ...formData, penghasilan_orang_tua: e.target.value })}
                        className={inputClass}>
                        {PENGHASILAN_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Status SPP</label>
                      <select required value={formData.status_spp}
                        onChange={(e) => setFormData({ ...formData, status_spp: e.target.value })}
                        className={inputClass}>
                        {SPP_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Status Ortu</label>
                      <select required value={formData.status_orang_tua}
                        onChange={(e) => setFormData({ ...formData, status_orang_tua: e.target.value })}
                        className={inputClass}>
                        {ORTU_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>

                  {!editingItem && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <p className="text-xs text-orange-400">
                        💡 <strong>ID Siswa</strong> akan dibuat otomatis setelah data disimpan (contoh: S-001, S-002, dst.)
                      </p>
                    </div>
                  )}
                </form>
              </div>
              <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                  Batal
                </button>
                <button type="submit" form="siswa-form"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium">
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Table Siswa Utama ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Cari nama, NISN, ID, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400 whitespace-nowrap">
              <thead className="text-xs uppercase bg-gray-950/50 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-4 font-medium">ID</th>
                  <th className="px-4 py-4 font-medium">NAMA</th>
                  <th className="px-4 py-4 font-medium">NISN</th>
                  <th className="px-4 py-4 font-medium">KELAS</th>
                  <th className="px-4 py-4 font-medium">KEHADIRAN</th>
                  <th className="px-4 py-4 font-medium">NILAI</th>
                  <th className="px-4 py-4 font-medium">PELANGGARAN</th>
                  <th className="px-4 py-4 font-medium">HASIL PREDIKSI</th>
                  <th className="px-4 py-4 font-medium text-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center">Loading data...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center">Tidak ada data siswa.</td></tr>
                ) : (
                  filteredData.map((item) => {
                    // Ekstraksi nilai angka secara fleksibel dari berbagai kemungkin key backend
                    const kehadiranVal = item.kehadiran_angka ?? item.jumlah_kehadiran ?? item.kehadiran;
                    const nilaiVal = item.nilai_angka ?? item.rata_rata_nilai ?? item.nilai;
                    const pelanggaranVal = item.pelanggaran_angka ?? item.jumlah_pelanggaran ?? item.pelanggaran;

                    const katKehadiran = item.kategori_kehadiran || getKategoriKehadiranFromAngka(kehadiranVal);
                    const katNilai = item.kategori_nilai || getKategoriNilaiFromAngka(nilaiVal);
                    const katPelanggaran = item.kategori_pelanggaran || getKategoriPelanggaranFromAngka(pelanggaranVal);

                    return (
                      <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-semibold font-mono">
                            {item.siswa_id}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-white">{item.nama}</td>
                        <td className="px-4 py-4 font-mono text-gray-300">{item.nisn}</td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                            {item.kelas}
                          </span>
                        </td>

                        {/* KEHADIRAN */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start">
                            <span className={`text-sm font-medium ${katKehadiran === "Sangat Baik" || katKehadiran === "Baik"
                              ? "text-emerald-400"
                              : "text-rose-500"
                              }`}>
                              {katKehadiran}
                            </span>
                            <span className="text-xs text-gray-400 font-mono mt-0.5">
                              {kehadiranVal !== null && kehadiranVal !== undefined && kehadiranVal !== ""
                                ? `${kehadiranVal} Hari`
                                : "-"}
                            </span>
                          </div>
                        </td>

                        {/* NILAI */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start">
                            <span className={`text-sm font-medium ${katNilai === "Tinggi"
                              ? "text-emerald-400"
                              : katNilai === "Sedang"
                                ? "text-amber-500"
                                : "text-rose-500"
                              }`}>
                              {katNilai}
                            </span>
                            <span className="text-xs text-gray-400 font-mono mt-0.5">
                              {nilaiVal !== null && nilaiVal !== undefined && nilaiVal !== ""
                                ? `Nilai: ${nilaiVal}`
                                : "-"}
                            </span>
                          </div>
                        </td>

                        {/* PELANGGARAN */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start">
                            <span className={`text-sm font-medium ${katPelanggaran === "Tidak Ada"
                              ? "text-gray-300"
                              : katPelanggaran === "Ringan"
                                ? "text-amber-500"
                                : "text-rose-500"
                              }`}>
                              {katPelanggaran}
                            </span>
                            <span className="text-xs text-gray-400 font-mono mt-0.5">
                              {pelanggaranVal !== null && pelanggaranVal !== undefined && pelanggaranVal !== ""
                                ? `${pelanggaranVal} Kali`
                                : "0 Kali"}
                            </span>
                          </div>
                        </td>

                        {/* HASIL PREDIKSI */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${item.status_risiko === "Tinggi"
                            ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                            : item.status_risiko === "Rendah"
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                              : item.status_risiko === "Sedang"
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                                : "bg-slate-500/20 border-slate-500/50 text-slate-400"
                            }`}>
                            {item.status_risiko || "Belum Diprediksi"}
                          </span>
                        </td>

                        {/* AKSI */}
                        <td className="px-4 py-4 flex items-center justify-end gap-2">
                          <button onClick={() => openDetailModal(item.id)}
                            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Detail Preprocessing">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(item)}
                            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                            title="Edit Siswa">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Hapus Siswa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}