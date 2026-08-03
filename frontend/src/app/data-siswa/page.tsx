"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { StudentData } from "@/types";
import { Search, Plus, Trash2, Edit2, X } from "lucide-react";

export default function DataSiswaPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    nisn: "",
    kelas: "",
    jumlah_absensi: 0,
    persentase_kehadiran: 100,
    rata_rata_nilai: 0,
    jumlah_pelanggaran: 0,
    kondisi_ekonomi: "Menengah"
  });

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students/");
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data siswa ini?")) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/students/", formData);
      setShowAddModal(false);
      setFormData({
        nama: "",
        nisn: "",
        kelas: "",
        jumlah_absensi: 0,
        persentase_kehadiran: 100,
        rata_rata_nilai: 0,
        jumlah_pelanggaran: 0,
        kondisi_ekonomi: "Menengah"
      });
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan data siswa");
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.siswa_id?.includes(searchTerm) ||
      s.nisn.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Data Siswa</h1>
            <p className="text-gray-400 mt-2">Kelola data metrik siswa untuk prediksi.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Tambah Siswa
          </button>
        </header>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Tambah Data Siswa</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="add-student-form" onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nama Lengkap</label>
                    <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">NISN</label>
                      <input type="text" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Kelas</label>
                      <input type="text" required value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Jumlah Absensi</label>
                      <input type="number" required value={formData.jumlah_absensi} onChange={e => setFormData({...formData, jumlah_absensi: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Nilai Rata-rata</label>
                      <input type="number" step="0.1" required value={formData.rata_rata_nilai} onChange={e => setFormData({...formData, rata_rata_nilai: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Jumlah Pelanggaran</label>
                      <input type="number" required value={formData.jumlah_pelanggaran} onChange={e => setFormData({...formData, jumlah_pelanggaran: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Kondisi Ekonomi</label>
                      <select required value={formData.kondisi_ekonomi} onChange={e => setFormData({...formData, kondisi_ekonomi: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white">
                        <option value="Tinggi">Tinggi</option>
                        <option value="Menengah">Menengah</option>
                        <option value="Rendah">Rendah</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Batal</button>
                <button type="submit" form="add-student-form" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Simpan</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Cari berdasarkan Nama, ID, atau NISN..."
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
                  <th className="px-6 py-4 font-medium">Siswa ID</th>
                  <th className="px-6 py-4 font-medium">NISN</th>
                  <th className="px-6 py-4 font-medium">Nama</th>
                  <th className="px-6 py-4 font-medium">Kelas</th>
                  <th className="px-6 py-4 font-medium">Absensi</th>
                  <th className="px-6 py-4 font-medium">Rata Nilai</th>
                  <th className="px-6 py-4 font-medium">Pelanggaran</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">Loading data...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">Tidak ada data siswa ditemukan.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-300 font-medium">{student.siswa_id}</td>
                      <td className="px-6 py-4 text-gray-300">{student.nisn}</td>
                      <td className="px-6 py-4 font-medium text-white">{student.nama}</td>
                      <td className="px-6 py-4 text-gray-300">{student.kelas}</td>
                      <td className="px-6 py-4">{student.jumlah_absensi} Hari</td>
                      <td className="px-6 py-4">{student.rata_rata_nilai}</td>
                      <td className="px-6 py-4">{student.jumlah_pelanggaran}</td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
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
