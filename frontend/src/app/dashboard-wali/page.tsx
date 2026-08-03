"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Users, AlertCircle, CheckCircle, BookOpen } from "lucide-react";
import { StudentData } from "@/types";

export default function DashboardWaliPage() {
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
      if (user.role !== "wali_kelas") {
        router.push("/dashboard");
        return;
      }
    } catch (e) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/students/");
        setStudents(res.data.students);
      } catch (err) {
        console.error("Error fetching students", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  const totalStudents = students.length;
  // This is a naive calculation for demonstration. In a real app, the backend might provide these stats.
  const highRiskCount = students.filter(s => s.jumlah_pelanggaran > 2 || s.rata_rata_nilai < 65).length;
  const safeCount = totalStudents - highRiskCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Wali Kelas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Ringkasan data siswa kelas Anda.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Siswa"
            value={totalStudents}
            icon={<Users className="w-6 h-6 text-blue-500" />}
            color="bg-white dark:bg-blue-500/10 border-gray-200 dark:border-blue-500/20"
          />
          <StatCard
            title="Siswa Kondisi Baik"
            value={safeCount}
            icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
            color="bg-white dark:bg-emerald-500/10 border-gray-200 dark:border-emerald-500/20"
          />
          <StatCard
            title="Siswa Perlu Perhatian"
            value={highRiskCount}
            icon={<AlertCircle className="w-6 h-6 text-amber-500" />}
            color="bg-white dark:bg-amber-500/10 border-gray-200 dark:border-amber-500/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pengumuman & Informasi</h3>
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
              <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" />
              <p>Belum ada informasi terbaru untuk wali kelas.</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aksi Cepat</h3>
            <div className="space-y-4">
              <button onClick={() => router.push('/data-siswa')} className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors text-gray-700 dark:text-gray-200 text-sm flex items-center justify-between">
                Kelola Data Siswa
                <Users className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-2xl p-6 border shadow-sm transition-colors duration-300 ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
