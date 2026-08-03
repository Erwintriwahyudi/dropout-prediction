"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { FileText, CheckCircle, Clock, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";

interface LaporanItem {
  laporan_id: number;
  siswa: {
    nama: string;
    siswa_id: string;
    kelas: string;
    status_risiko: string;
  };
  keterangan: string;
  status: string;
  tanggal: string;
}

const risikoColor: Record<string, string> = {
  Tinggi: "bg-rose-500/20 border-rose-500/50 text-rose-400",
  Sedang: "bg-amber-500/20 border-amber-500/50 text-amber-400",
  Rendah: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
};

export default function BKLaporanPage() {
  const [laporan, setLaporan] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const res = await api.get("/laporan/");
      setLaporan(res.data.laporan);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLaporan(); }, []);

  const dikirim = laporan.filter((l) => l.status === "Dikirim");
  const dikonfirmasi = laporan.filter((l) => l.status === "Dikonfirmasi");

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-400" />
            Laporan Siswa Berisiko
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Riwayat laporan yang telah Anda buat dan status konfirmasinya dari Wali Kelas.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Menunggu Konfirmasi</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">{dikirim.length}</p>
          </div>
          <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Sudah Dikonfirmasi</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">{dikonfirmasi.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />Memuat laporan...
          </div>
        ) : laporan.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Belum ada laporan yang dibuat.</p>
            <p className="text-gray-500 text-xs mt-1">Buat laporan dari menu <strong>Siswa Berisiko</strong>.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {laporan.map((item) => (
              <div
                key={item.laporan_id}
                className={`bg-gray-900 border rounded-xl overflow-hidden ${item.status === "Dikonfirmasi" ? "border-emerald-500/20 opacity-80" : "border-gray-800"}`}>
                <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {item.status === "Dikonfirmasi"
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        : <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                      <span className="font-semibold text-white">{item.siswa?.nama}</span>
                      <span className="text-xs text-gray-500">{item.siswa?.siswa_id}</span>
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">Kelas {item.siswa?.kelas}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${risikoColor[item.siswa?.status_risiko] || ""}`}>
                        Risiko {item.siswa?.status_risiko}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Terkirim: {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-sm text-gray-300 mt-1.5 line-clamp-2">{item.keterangan}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${item.status === "Dikonfirmasi" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-amber-500/20 border-amber-500/50 text-amber-400"}`}>
                      {item.status}
                    </span>
                    <button
                      onClick={() => setExpandedId(expandedId === item.laporan_id ? null : item.laporan_id)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                      {expandedId === item.laporan_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {expandedId === item.laporan_id && (
                  <div className="border-t border-gray-800 p-4 bg-gray-950/50">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Catatan Lengkap</p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.keterangan}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
