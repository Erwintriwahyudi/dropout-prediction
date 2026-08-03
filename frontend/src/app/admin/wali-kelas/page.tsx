"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Plus, X, Edit2, Trash2, UserCheck } from "lucide-react";

interface WaliKelasData {
  id: number;
  user_code: string;
  nama: string;
  nip: string;
  kelas_diampu: string;
  username: string;
}

const KELAS_OPTIONS = [
  "7A", "7B", "7C", "7D",
  "8A", "8B", "8C", "8D",
  "9A", "9B", "9C", "9D",
];

export default function WaliKelasPage() {
  const [data, setData] = useState<WaliKelasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WaliKelasData | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    kelas_diampu: "",
    username: "",
    password: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/wali-kelas/");
      setData(res.data.data);
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
    setFormData({ nama: "", nip: "", kelas_diampu: "", username: "", password: "" });
    setAlertMsg(null);
    setShowModal(true);
  };

  const openEditModal = (item: WaliKelasData) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      nip: item.nip,
      kelas_diampu: item.kelas_diampu,
      username: item.username,
      password: "",
    });
    setAlertMsg(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus Wali Kelas ini beserta akun loginnya?")) return;
    try {
      await api.delete(`/wali-kelas/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus Wali Kelas.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    try {
      if (editingItem) {
        const payload: Record<string, string> = {
          nama: formData.nama,
          nip: formData.nip,
          kelas_diampu: formData.kelas_diampu,
          username: formData.username,
        };
        if (formData.password) payload.password = formData.password;
        await api.put(`/wali-kelas/${editingItem.id}`, payload);
        setAlertMsg({ type: "success", msg: "Data Wali Kelas berhasil diperbarui." });
        setShowModal(false);
        fetchData();
      } else {
        const res = await api.post("/wali-kelas/", formData);
        setAlertMsg({
          type: "success",
          msg: `Wali Kelas berhasil ditambahkan! Kode: ${res.data.data.user_code}`,
        });
        setShowModal(false);
        fetchData();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAlertMsg({
        type: "error",
        msg: error.response?.data?.message || "Operasi gagal. Periksa kembali data Anda.",
      });
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelas_diampu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-teal-500" />
              Kelola Wali Kelas
            </h1>
            <p className="text-gray-400 mt-2">Manajemen akun Wali Kelas dan kelas yang diampu.</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Wali Kelas
          </button>
        </header>

        {alertMsg && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm ${
              alertMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {alertMsg.msg}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingItem ? "Edit Wali Kelas" : "Tambah Wali Kelas Baru"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form id="wali-kelas-form" onSubmit={handleSubmit} className="space-y-4">
                  {editingItem && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Kode Wali Kelas</label>
                      <input
                        type="text"
                        value={editingItem.user_code}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-950/50 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                      placeholder="Masukkan nama lengkap..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">NIP</label>
                    <input
                      type="text"
                      required
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                      placeholder="Masukkan NIP..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Kelas Diampu</label>
                    <select
                      required
                      value={formData.kelas_diampu}
                      onChange={(e) => setFormData({ ...formData, kelas_diampu: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {KELAS_OPTIONS.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Username Login</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                      placeholder="Masukkan username..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Password Login{" "}
                      {editingItem && (
                        <span className="text-xs text-gray-500">(kosongkan jika tidak diubah)</span>
                      )}
                    </label>
                    <input
                      type="password"
                      required={!editingItem}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
                      placeholder="Masukkan password..."
                    />
                  </div>
                  {!editingItem && (
                    <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
                      <p className="text-xs text-teal-400">
                        💡 <strong>Kode Wali Kelas</strong> akan dibuat otomatis setelah data disimpan (contoh: WK-001, WK-002, dst.)
                      </p>
                    </div>
                  )}
                </form>
              </div>
              <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="wali-kelas-form"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Cari nama, NIP, kelas, atau username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400 whitespace-nowrap">
              <thead className="text-xs uppercase bg-gray-950/50 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Kode</th>
                  <th className="px-6 py-4 font-medium">Nama Lengkap</th>
                  <th className="px-6 py-4 font-medium">NIP</th>
                  <th className="px-6 py-4 font-medium">Kelas Diampu</th>
                  <th className="px-6 py-4 font-medium">Username</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">Loading data...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">Tidak ada data Wali Kelas.</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-medium">
                          {item.user_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{item.nama}</td>
                      <td className="px-6 py-4">{item.nip}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium">
                          Kelas {item.kelas_diampu}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.username}</td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-teal-500 hover:bg-teal-500/10 rounded-lg transition-colors"
                          title="Edit Wali Kelas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Hapus Wali Kelas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
