"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  GraduationCap, Plus, X, Edit2, Trash2, Search, Loader2,
  ChevronRight, CheckCircle, Eye,
} from "lucide-react";

interface StudentData {
  id: number;
  siswa_id: string;
  nisn: string;
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
}

const PEKERJAAN_OPTIONS = ["PNS/TNI/Polri", "Karyawan Swasta", "Wiraswasta", "Buruh/Petani", "Tidak Bekerja", "Lainnya"];
const PENGHASILAN_OPTIONS = ["< Rp 2.000.000", "Rp 2.000.000 - Rp 5.000.000", "> Rp 5.000.000"];
const SPP_OPTIONS = ["Lancar", "Menunggak 1-2 Bulan", "Menunggak >2 Bulan"];
const ORTU_OPTIONS = ["Lengkap", "Yatim", "Piatu", "Yatim Piatu"];

const getKategoriKehadiran = (v: string | number) => {
  const n = Number(v);
  if (isNaN(n) || v === "") return "Baik";
  if (n >= 200) return "Sangat Baik";
  if (n >= 170) return "Baik";
  return "Kurang";
};
const getKategoriNilai = (v: string | number) => {
  const n = Number(v);
  if (isNaN(n) || v === "") return "Sedang";
  if (n >= 80) return "Tinggi";
  if (n >= 70) return "Sedang";
  return "Rendah";
};
const getKategoriPelanggaran = (v: string | number) => {
  const n = Number(v);
  if (isNaN(n) || v === "") return "Tidak Ada";
  if (n === 0) return "Tidak Ada";
  if (n <= 3) return "Ringan";
  return "Sedang/Berat";
};

const risikoColor: Record<string, string> = {
  Tinggi: "bg-rose-500/20 border-rose-500/50 text-rose-400",
  Sedang: "bg-amber-500/20 border-amber-500/50 text-amber-400",
  Rendah: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
};

export default function WaliSiswaPage() {
  const [myKelas, setMyKelas] = useState<string>("");
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentData | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [form, setForm] = useState({
    nama: "", nisn: "",
    jumlah_kehadiran: "" as string | number,
    rata_rata_nilai: "" as string | number,
    jumlah_pelanggaran: "" as string | number,
    pekerjaan_orang_tua: "Wiraswasta",
    penghasilan_orang_tua: "Rp 2.000.000 - Rp 5.000.000",
    status_spp: "Lancar",
    status_orang_tua: "Lengkap",
  });

  const inputClass = "w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors";

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/students/");
      const allStudents: StudentData[] = res.data.students;
      // Ambil kelas dari profil wali kelas
      const profileRes = await api.get("/wali-kelas/profile");
      const kelas = profileRes.data?.kelas_diampu || "";
      setMyKelas(kelas);
      setData(allStudents.filter((s) => s.kelas === kelas));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => setForm({
    nama: "", nisn: "",
    jumlah_kehadiran: "", rata_rata_nilai: "", jumlah_pelanggaran: "",
    pekerjaan_orang_tua: "Wiraswasta",
    penghasilan_orang_tua: "Rp 2.000.000 - Rp 5.000.000",
    status_spp: "Lancar", status_orang_tua: "Lengkap",
  });

  const openAdd = () => { resetForm(); setEditingItem(null); setAlertMsg(null); setShowModal(true); };
  const openEdit = (item: StudentData) => {
    setEditingItem(item);
    setForm({
      nama: item.nama, nisn: item.nisn,
      jumlah_kehadiran: item.jumlah_kehadiran ?? "",
      rata_rata_nilai: item.rata_rata_nilai ?? "",
      jumlah_pelanggaran: item.jumlah_pelanggaran ?? "",
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
    } catch { alert("Gagal menghapus."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    const payload = {
      nama: form.nama, nisn: form.nisn, kelas: myKelas,
      kehadiran_angka: form.jumlah_kehadiran === "" ? null : Number(form.jumlah_kehadiran),
      nilai_angka: form.rata_rata_nilai === "" ? null : Number(form.rata_rata_nilai),
      pelanggaran_angka: form.jumlah_pelanggaran === "" ? null : Number(form.jumlah_pelanggaran),
      kategori_kehadiran: getKategoriKehadiran(form.jumlah_kehadiran),
      kategori_nilai: getKategoriNilai(form.rata_rata_nilai),
      kategori_pelanggaran: getKategoriPelanggaran(form.jumlah_pelanggaran),
      pekerjaan_orang_tua: form.pekerjaan_orang_tua,
      penghasilan_orang_tua: form.penghasilan_orang_tua,
      status_spp: form.status_spp,
      status_orang_tua: form.status_orang_tua,
    };
    try {
      if (editingItem) {
        await api.put(`/students/${editingItem.id}`, payload);
        setAlertMsg({ type: "success", msg: "Data siswa berhasil diperbarui." });
      } else {
        const res = await api.post("/students/", payload);
        setAlertMsg({ type: "success", msg: `Siswa ditambahkan! ID: ${res.data.data.siswa_id}` });
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAlertMsg({ type: "error", msg: e.response?.data?.message || "Operasi gagal." });
    }
  };

  const filtered = data.filter(
    (s) => s.nama.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-blue-400" />
              Data Siswa Kelas {myKelas}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Input dan kelola data siswa kelas yang Anda ampu.</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>
        </header>

        {alertMsg && (
          <div className={`mb-4 p-3 rounded-lg border text-sm ${alertMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
            {alertMsg.msg}
          </div>
        )}

        {/* Info Box — auto konversi */}
        <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          <strong>💡 Panduan Input Angka:</strong>&nbsp;
          Kehadiran ≥200 = Sangat Baik | ≥170 = Baik | &lt;170 = Kurang &nbsp;•&nbsp;
          Nilai ≥80 = Tinggi | ≥70 = Sedang | &lt;70 = Rendah &nbsp;•&nbsp;
          Pelanggaran 0 = Tidak Ada | 1–3 = Ringan | &gt;3 = Sedang/Berat
        </div>

        {/* Tabel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Cari nama atau NISN..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400 whitespace-nowrap">
              <thead className="text-xs uppercase bg-gray-950/50 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">NISN</th>
                  <th className="px-4 py-3">Kehadiran</th>
                  <th className="px-4 py-3">Nilai Rata-rata</th>
                  <th className="px-4 py-3">Pelanggaran</th>
                  <th className="px-4 py-3">Risiko</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading...
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500">Tidak ada data siswa.</td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs">{item.siswa_id}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{item.nama}</td>
                    <td className="px-4 py-3">{item.nisn}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={`font-medium text-xs ${item.kategori_kehadiran === "Sangat Baik" || item.kategori_kehadiran === "Baik" ? "text-emerald-400" : "text-rose-400"}`}>
                          {item.kategori_kehadiran}
                        </span>
                        {item.jumlah_kehadiran != null && <span className="text-gray-500 text-xs">({item.jumlah_kehadiran} hari)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={`font-medium text-xs ${item.kategori_nilai === "Tinggi" ? "text-emerald-400" : item.kategori_nilai === "Sedang" ? "text-amber-400" : "text-rose-400"}`}>
                          {item.kategori_nilai}
                        </span>
                        {item.rata_rata_nilai != null && <span className="text-gray-500 text-xs">({item.rata_rata_nilai})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={`font-medium text-xs ${item.kategori_pelanggaran === "Tidak Ada" ? "text-gray-400" : item.kategori_pelanggaran === "Ringan" ? "text-amber-400" : "text-rose-400"}`}>
                          {item.kategori_pelanggaran}
                        </span>
                        {item.jumlah_pelanggaran != null && <span className="text-gray-500 text-xs">({item.jumlah_pelanggaran} kasus)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${risikoColor[item.status_risiko] || "bg-slate-500/20 border-slate-500/50 text-slate-400"}`}>
                        {item.status_risiko || "Belum Diprediksi"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editingItem ? "Edit Data Siswa" : "Tambah Siswa Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[70vh]">
              {alertMsg && (
                <div className={`mb-4 p-3 rounded-lg border text-sm ${alertMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
                  {alertMsg.msg}
                </div>
              )}
              <form id="wali-siswa-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Nama Lengkap *</label>
                    <input type="text" required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className={inputClass} placeholder="Nama siswa..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">NISN *</label>
                    <input type="text" required value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} className={inputClass} placeholder="NISN..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Kelas</label>
                    <input type="text" readOnly value={myKelas} className="w-full px-4 py-2 bg-gray-950/50 border border-gray-800 rounded-lg text-gray-400 cursor-not-allowed" />
                  </div>

                  {/* Numerik */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Jumlah Kehadiran (hari)</label>
                    <input type="number" min="0" value={form.jumlah_kehadiran} onChange={(e) => setForm({ ...form, jumlah_kehadiran: e.target.value })} className={inputClass} placeholder="Contoh: 201" />
                    {form.jumlah_kehadiran !== "" && (
                      <p className="text-xs text-blue-400 mt-1">→ Kategori: <strong>{getKategoriKehadiran(form.jumlah_kehadiran)}</strong></p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Nilai Rata-rata</label>
                    <input type="number" min="0" max="100" step="0.1" value={form.rata_rata_nilai} onChange={(e) => setForm({ ...form, rata_rata_nilai: e.target.value })} className={inputClass} placeholder="Contoh: 80.5" />
                    {form.rata_rata_nilai !== "" && (
                      <p className="text-xs text-blue-400 mt-1">→ Kategori: <strong>{getKategoriNilai(form.rata_rata_nilai)}</strong></p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Jumlah Pelanggaran</label>
                    <input type="number" min="0" value={form.jumlah_pelanggaran} onChange={(e) => setForm({ ...form, jumlah_pelanggaran: e.target.value })} className={inputClass} placeholder="Contoh: 3" />
                    {form.jumlah_pelanggaran !== "" && (
                      <p className="text-xs text-blue-400 mt-1">→ Kategori: <strong>{getKategoriPelanggaran(form.jumlah_pelanggaran)}</strong></p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Pekerjaan Ortu</label>
                    <select value={form.pekerjaan_orang_tua} onChange={(e) => setForm({ ...form, pekerjaan_orang_tua: e.target.value })} className={inputClass}>
                      {PEKERJAAN_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Penghasilan Ortu</label>
                    <select value={form.penghasilan_orang_tua} onChange={(e) => setForm({ ...form, penghasilan_orang_tua: e.target.value })} className={inputClass}>
                      {PENGHASILAN_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Status SPP</label>
                    <select value={form.status_spp} onChange={(e) => setForm({ ...form, status_spp: e.target.value })} className={inputClass}>
                      {SPP_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Status Ortu</label>
                    <select value={form.status_orang_tua} onChange={(e) => setForm({ ...form, status_orang_tua: e.target.value })} className={inputClass}>
                      {ORTU_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>
                {!editingItem && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
                    💡 <strong>ID Siswa</strong> akan dibuat otomatis. Sistem akan mengklasifikasi risiko secara otomatis berdasarkan angka yang Anda input.
                  </div>
                )}
              </form>
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">Batal</button>
              <button type="submit" form="wali-siswa-form" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
