"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Plus, X, Edit2, Trash2 } from "lucide-react";

interface WaliKelas {
  id: number;
  user_code: string;
  nama: string;
  nip: string;
  kelas_diampu: string;
  username: string;
}

export default function WaliKelasPage() {
  const [data, setData] = useState<WaliKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WaliKelas | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    nama: "",
    nip: "",
    kelas_diampu: ""
  });

  const fetchData = async () => {
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
    setFormData({ username: "", password: "", nama: "", nip: "", kelas_diampu: "" });
    setShowModal(true);
  };

  const openEditModal = (item: WaliKelas) => {
    setEditingItem(item);
    setFormData({
      username: item.username,
      password: "", // Keep blank unless updating
      nama: item.nama,
      nip: item.nip,
      kelas_diampu: item.kelas_diampu
    });
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
    try {
      if (editingItem) {
        // Edit mode
        const payload: any = {
          nama: formData.nama,
          nip: formData.nip,
          kelas_diampu: formData.kelas_diampu,
          username: formData.username
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.put(`/wali-kelas/${editingItem.id}`, payload);
      } else {
        // Add mode
        await api.post("/wali-kelas/", formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Operasi gagal. Pastikan username belum digunakan.");
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_code.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Wali Kelas</h1>
            <p className="text-gray-400 mt-2">Data Wali Kelas yang terdaftar di sistem.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Wali Kelas
          </button>
        </header>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingItem ? "Edit Wali Kelas" : "Tambah Wali Kelas"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="submit-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Username Login</label>
                    <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Password Login {editingItem && <span className="text-xs text-gray-500">(kosongkan jika tidak diubah)</span>}
                    </label>
                    <input type="password" required={!editingItem} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                  </div>
                  <div className="border-t border-gray-800 pt-4 mt-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nama Lengkap</label>
                    <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">NIP</label>
                    <input type="text" required value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Kelas yang Diampu</label>
                    <input type="text" required value={formData.kelas_diampu} placeholder="Contoh: 10-A" onChange={e => setFormData({...formData, kelas_diampu: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Batal</button>
                <button type="submit" form="submit-form" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Simpan</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Cari Wali Kelas..."
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
                  <th className="px-6 py-4 font-medium">User ID</th>
                  <th className="px-6 py-4 font-medium">Nama</th>
                  <th className="px-6 py-4 font-medium">NIP</th>
                  <th className="px-6 py-4 font-medium">Kelas Diampu</th>
                  <th className="px-6 py-4 font-medium">Username Login</th>
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
                      <td className="px-6 py-4 text-gray-300 font-medium">{item.user_code}</td>
                      <td className="px-6 py-4 font-medium text-white">{item.nama}</td>
                      <td className="px-6 py-4 text-gray-300">{item.nip}</td>
                      <td className="px-6 py-4 text-gray-300">{item.kelas_diampu}</td>
                      <td className="px-6 py-4 text-gray-300">{item.username}</td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
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
