"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  AlertTriangle,
  Users,
  HeartHandshake,
  CheckCircle,
  MessageSquare,
  FileText,
  ChevronRight,
} from "lucide-react";
import { StudentData } from "@/types";

export default function DashboardBKPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "guru_bk") {
        router.push("/dashboard");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get("/students/");
        setStudents(res.data.students);
      } catch (err) {
        console.error("Error fetching students", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Memuat data...</div>
      </div>
    );
  }

  const highRisk = students.filter(
    (s) => s.jumlah_pelanggaran > 3 || s.rata_rata_nilai < 60
  );
  const mediumRisk = students.filter(
    (s) =>
      !highRisk.includes(s) &&
      (s.jumlah_pelanggaran >= 2 || s.rata_rata_nilai < 70)
  );
  const resolved = students.filter(
    (s) => s.jumlah_pelanggaran === 0 && s.rata_rata_nilai >= 75
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Bimbingan Konseling (BK)</h1>
              <p className="text-slate-400 text-sm">Monitor dan tangani siswa yang memerlukan perhatian khusus</p>
            </div>
          </div>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Siswa Risiko Tinggi"
            value={highRisk.length}
            icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
            colorClass="border-rose-500/30 bg-rose-500/10"
            textColor="text-rose-400"
          />
          <StatCard
            title="Siswa Risiko Sedang"
            value={mediumRisk.length}
            icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
            colorClass="border-amber-500/30 bg-amber-500/10"
            textColor="text-amber-400"
          />
          <StatCard
            title="Sesi Konseling Bulan Ini"
            value={0}
            icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
            colorClass="border-blue-500/30 bg-blue-500/10"
            textColor="text-blue-400"
            subtitle="Belum ada data"
          />
          <StatCard
            title="Kasus Terintervensi"
            value={resolved.length}
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
            colorClass="border-emerald-500/30 bg-emerald-500/10"
            textColor="text-emerald-400"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: High Risk Student Table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Daftar Siswa Butuh Penanganan Segera
              </h3>
              <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-full font-medium">
                {highRisk.length + mediumRisk.length} siswa
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950/60 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Nama Siswa</th>
                    <th className="px-5 py-3 font-medium">Kelas</th>
                    <th className="px-5 py-3 font-medium">Nilai Rata‑rata</th>
                    <th className="px-5 py-3 font-medium">Pelanggaran</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {[...highRisk, ...mediumRisk].length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                        Tidak ada siswa yang membutuhkan penanganan segera.
                      </td>
                    </tr>
                  ) : (
                    [...highRisk, ...mediumRisk].map((s) => {
                      const isHigh = highRisk.includes(s);
                      return (
                        <tr
                          key={s.id}
                          className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-5 py-3 font-medium text-white">{s.nama}</td>
                          <td className="px-5 py-3 text-slate-300">{s.kelas}</td>
                          <td className="px-5 py-3 text-slate-300">{s.rata_rata_nilai}</td>
                          <td className="px-5 py-3 text-slate-300">{s.jumlah_pelanggaran}x</td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                isHigh
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {isHigh ? "Risiko Tinggi" : "Risiko Sedang"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => router.push("/bk/konseling")}
                              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 ml-auto"
                            >
                              Buat Sesi
                              <ChevronRight className="w-3 h-3" />
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

          {/* Right: Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-violet-400" />
              Aksi Cepat
            </h3>
            <div className="space-y-3">
              <QuickAction
                label="Tambah Catatan Konseling"
                icon={<MessageSquare className="w-4 h-4 text-blue-400" />}
                onClick={() => router.push("/bk/konseling")}
              />
              <QuickAction
                label="Siswa Berisiko Drop‑Out"
                icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
                onClick={() => router.push("/bk/siswa-berisiko")}
              />
              <QuickAction
                label="Cetak Laporan Penanganan"
                icon={<FileText className="w-4 h-4 text-emerald-400" />}
                onClick={() => router.push("/bk/laporan")}
              />
              <QuickAction
                label="Lihat Laporan Intervensi"
                icon={<Users className="w-4 h-4 text-amber-400" />}
                onClick={() => router.push("/bk/laporan")}
              />
            </div>

            {/* Summary Badge */}
            <div className="mt-6 p-4 bg-slate-950/60 border border-slate-700 rounded-xl">
              <p className="text-xs text-slate-400 text-center mb-1">Total Siswa Butuh Perhatian</p>
              <p className="text-3xl font-bold text-center text-white">
                {highRisk.length + mediumRisk.length}
              </p>
              <p className="text-xs text-slate-500 text-center mt-1">
                dari {students.length} siswa total
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  colorClass,
  textColor,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  textColor: string;
  subtitle?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${colorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        {icon}
      </div>
      <p className={`text-4xl font-bold ${textColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function QuickAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-sm text-slate-200 group"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
    </button>
  );
}
