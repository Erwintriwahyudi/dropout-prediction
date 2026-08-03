"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Plus, X, Edit2, Trash2, ShieldCheck } from "lucide-react";

interface AdminData {
  id: number;
  admin_code: string;
  username: string;
}

export default function AdminUsersPage() {
  const [data, setData] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminData | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/");
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
    setFormData({ username: "", password: "" });
    setAlertMsg(null);
    setShowModal(true);
  };

  const openEditModal = (item: AdminData) => {
    setEditingItem(item);
    setFormData({ username: item.username, password: "" });
    setAlertMsg(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus admin ini beserta akun loginnya?")) return;
    try {
      await api.delete(`/admin/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus admin.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    try {
      if (editingItem) {
        const payload: Record<string, string> = { username: formData.username };
        if (formData.password) payload.password = formData.password;
        await api.put(`/admin/${editingItem.id}`, payload);
        setAlertMsg({ type: "success", msg: "Admin berhasil diperbarui." });
      } else {
        const res = await api.post("/admin/", formData);
        setAlertMsg({
          type: "success",
          msg: `Admin berhasil ditambahkan! Admin ID: ${res.data.data.admin_code}`,
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAlertMsg({
        type: "error",
        msg: error.response?.data?.message || "Operasi gagal. Pastikan username belum digunakan.",
      });
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.admin_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
              Kelola Admin
            </h1>
            <p className="text-gray-400 mt-2">Manajemen akun administrator sistem.</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Admin
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
                  {editingItem ? "Edit Admin" : "Tambah Admin Baru"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <form id="admin-form" onSubmit={handleSubmit} className="space-y-4">
                  {editingItem && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Admin ID</label>
                      <input
                        type="text"
                        value={editingItem.admin_code}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-950/50 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-600 mt-1">Admin ID dibuat otomatis dan tidak dapat diubah.</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Username Login</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Masukkan password..."
                    />
                  </div>
                  {!editingItem && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-xs text-blue-400">
                        💡 <strong>Admin ID</strong> akan dibuat otomatis setelah data disimpan (contoh: ADM-002, ADM-003, dst.)
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
                  form="admin-form"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
                placeholder="Cari Admin ID atau username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400 whitespace-nowrap">
              <thead className="text-xs uppercase bg-gray-950/50 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Admin ID</th>
                  <th className="px-6 py-4 font-medium">Username Login</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center">
                      Loading data...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center">
                      Tidak ada data admin.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          {item.admin_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{item.username}</td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit Admin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Hapus Admin"
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
