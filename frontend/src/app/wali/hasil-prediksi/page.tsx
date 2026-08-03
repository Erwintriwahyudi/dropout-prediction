"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ClipboardList, Loader2 } from "lucide-react";

interface StudentData {
  id: number;
  siswa_id: string;
  nama: string;
  kelas: string;
  kategori_kehadiran: string;
  kategori_nilai: string;
  kategori_pelanggaran: string;
  jumlah_kehadiran?: number | null;
  rata_rata_nilai?: number | null;
  jumlah_pelanggaran?: number | null;
  status_risiko: string;
}

const risikoColor: Record<string, string> = {
  Tinggi: "bg-rose-500/20 border-rose-500/50 text-rose-400",
  Sedang: "bg-amber-500/20 border-amber-500/50 text-amber-400",
  Rendah: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
};

export default function WaliHasilPrediksiPage() {
  const [myKelas, setMyKelas] = useState<string>("");
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const profileRes = await api.get("/wali-kelas/profile");
        const kelas = profileRes.data?.kelas_diampu || "";
        setMyKelas(kelas);
        const res = await api.get("/students/");
        const all: StudentData[] = res.data.students;
        setData(all.filter((s) => s.kelas === kelas));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tinggi = data.filter((s) => s.status_risiko === "Tinggi");
  const sedang = data.filter((s) => s.status_risiko === "Sedang");
  const rendah = data.filter((s) => s.status_risiko === "Rendah");

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-400" />
            Hasil Prediksi Kelas {myKelas}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Ringkasan hasil prediksi risiko dropout siswa di kelas Anda.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />Memuat data...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900 border border-rose-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase">Risiko Tinggi</p>
                <p className="text-4xl font-bold text-rose-400 mt-1">{tinggi.length}</p>
              </div>
              <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase">Risiko Sedang</p>
                <p className="text-4xl font-bold text-amber-400 mt-1">{sedang.length}</p>
              </div>
              <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase">Risiko Rendah</p>
                <p className="text-4xl font-bold text-emerald-400 mt-1">{rendah.length}</p>
              </div>
            </div>

            {/* Tabel */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400 whitespace-nowrap">
                  <thead className="text-xs uppercase bg-gray-950/50 border-b border-gray-800">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Kehadiran</th>
                      <th className="px-4 py-3">Nilai</th>
                      <th className="px-4 py-3">Pelanggaran</th>
                      <th className="px-4 py-3">Status Risiko</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Tidak ada data siswa.</td></tr>
                    ) : (
                      [...tinggi, ...sedang, ...rendah].map((item) => (
                        <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-500">{item.siswa_id}</td>
                          <td className="px-4 py-3 font-medium text-white">{item.nama}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className={`text-xs font-medium ${item.kategori_kehadiran === "Kurang" ? "text-rose-400" : "text-emerald-400"}`}>{item.kategori_kehadiran}</span>
                              {item.jumlah_kehadiran != null && <span className="text-gray-600 text-xs">({item.jumlah_kehadiran} hari)</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className={`text-xs font-medium ${item.kategori_nilai === "Rendah" ? "text-rose-400" : item.kategori_nilai === "Sedang" ? "text-amber-400" : "text-emerald-400"}`}>{item.kategori_nilai}</span>
                              {item.rata_rata_nilai != null && <span className="text-gray-600 text-xs">({item.rata_rata_nilai})</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className={`text-xs font-medium ${item.kategori_pelanggaran === "Tidak Ada" ? "text-gray-400" : item.kategori_pelanggaran === "Ringan" ? "text-amber-400" : "text-rose-400"}`}>{item.kategori_pelanggaran}</span>
                              {item.jumlah_pelanggaran != null && <span className="text-gray-600 text-xs">({item.jumlah_pelanggaran} kasus)</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${risikoColor[item.status_risiko] || "bg-slate-500/20 border-slate-500/50 text-slate-400"}`}>
                              {item.status_risiko}
                            </span>
                          </td>
                        </tr>
                      ))
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
