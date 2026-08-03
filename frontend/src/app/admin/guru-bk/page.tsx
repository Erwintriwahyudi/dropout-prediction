"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Plus, X, Edit2, Trash2, UserPlus } from "lucide-react";

interface GuruBKData {
  id: number;
  user_code: string;
  nama: string;
  nip: string;
  username: string;
}

export default function GuruBKPage() {
  const [data, setData] = useState<GuruBKData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GuruBKData | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    username: "",
    password: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/guru-bk/");
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
    setFormData({ nama: "", nip: "", username: "", password: "" });
    setAlertMsg(null);
    setShowModal(true);
  };

  const openEditModal = (item: GuruBKData) => {
    setEditingItem(item);
    setFormData({ nama: item.nama, nip: item.nip, username: item.username, password: "" });
    setAlertMsg(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus Guru BK ini beserta akun loginnya?")) return;
    try {
      await api.delete(`/guru-bk/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus Guru BK.");
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
          username: formData.username,
        };
        if (formData.password) payload.password = formData.password;
        await api.put(`/guru-bk/${editingItem.id}`, payload);
        setAlertMsg({ type: "success", msg: "Data Guru BK berhasil diperbarui." });
        setShowModal(false);
        fetchData();
      } else {
        const res = await api.post("/guru-bk/", formData);
        setAlertMsg({
          type: "success",
          msg: `Guru BK berhasil ditambahkan! Kode: ${res.data.data.user_code}`,
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
      item.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-violet-500" />
              Kelola Guru BK
            </h1>
            <p className="text-gray-400 mt-2">Manajemen akun Guru Bimbingan dan Konseling.</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Guru BK
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
                  {editingItem ? "Edit Guru BK" : "Tambah Guru BK Baru"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <form id="guru-bk-form" onSubmit={handleSubmit} className="space-y-4">
                  {editingItem && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Kode Guru BK</label>
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
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
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
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="Masukkan NIP..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Username Login</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
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
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="Masukkan password..."
                    />
                  </div>
                  {!editingItem && (
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                      <p className="text-xs text-violet-400">
                        💡 <strong>Kode Guru BK</strong> akan dibuat otomatis setelah data disimpan (contoh: GBK-001, GBK-002, dst.)
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
                  form="guru-bk-form"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
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
                placeholder="Cari nama, NIP, kode, atau username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
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
                  <th className="px-6 py-4 font-medium">Username</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">Loading data...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">Tidak ada data Guru BK.</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-xs font-medium">
                          {item.user_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{item.nama}</td>
                      <td className="px-6 py-4">{item.nip}</td>
                      <td className="px-6 py-4">{item.username}</td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-violet-500 hover:bg-violet-500/10 rounded-lg transition-colors"
                          title="Edit Guru BK"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Hapus Guru BK"
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
