"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Users, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { StudentData } from "@/types";

export default function DashboardPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
      if (user.role === "wali_kelas") {
        router.push("/dashboard-wali");
        return;
      }
    } catch (e) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/students/");
        const mappedStudents = (res.data.students || []).map((s: any) => ({
          ...s,
          persentase_kehadiran: s.persentase_kehadiran ?? Math.round(((240 - (s.jumlah_absensi ?? 0)) / 240) * 100),
          rata_rata_nilai: s.rata_rata_nilai ?? s.nilai_rata ?? s.nilai_angka ?? 0,
          jumlah_pelanggaran: s.jumlah_pelanggaran ?? s.pelanggaran_angka ?? 0,
        }));
        setStudents(mappedStudents);
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

  // Chart config and state
  const chartData = students.slice(0, 10); // Display up to 10 students for readability

  const svgWidth = 600;
  const svgHeight = 180;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 30;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-2">Ringkasan status risiko drop-out siswa.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Siswa"
            value={totalStudents}
            icon={<Users className="w-6 h-6 text-blue-500" />}
            color="bg-blue-500/10 border-blue-500/20"
          />
          <StatCard
            title="Siswa Aman"
            value={safeCount}
            icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
            color="bg-emerald-500/10 border-emerald-500/20"
          />
          <StatCard
            title="Siswa Berisiko"
            value={highRiskCount}
            icon={<AlertTriangle className="w-6 h-6 text-rose-500" />}
            color="bg-rose-500/10 border-rose-500/20"
          />
          <StatCard
            title="Rata-rata Kehadiran"
            value={
              totalStudents
                ? `${(
                    students.reduce((acc, curr) => acc + curr.persentase_kehadiran, 0) /
                    totalStudents
                  ).toFixed(1)}%`
                : "0%"
            }
            icon={<Activity className="w-6 h-6 text-purple-500" />}
            color="bg-purple-500/10 border-purple-500/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="relative">
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-950/50 rounded-xl border border-gray-800">
                  Tidak ada data siswa
                </div>
              ) : (
                <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800/80">
                  <div className="flex items-center justify-end gap-4 mb-2 text-xs">
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
                      Kehadiran (%)
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <span className="w-3 h-3 bg-purple-500 rounded-sm"></span>
                      Rata-rata Nilai
                    </div>
                  </div>
                  
                  <div className="relative h-64">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      {[0, 25, 50, 75, 100].map((val) => {
                        const y = paddingTop + chartHeight - (val / 100) * chartHeight;
                        return (
                          <g key={val} className="opacity-20">
                            <line
                              x1={paddingLeft}
                              y1={y}
                              x2={svgWidth - paddingRight}
                              y2={y}
                              stroke="#4b5563"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={paddingLeft - 8}
                              y={y + 4}
                              fill="#9ca3af"
                              fontSize="10"
                              textAnchor="end"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Bars */}
                      {chartData.map((student, idx) => {
                        const colWidth = chartWidth / chartData.length;
                        const groupX = paddingLeft + idx * colWidth;
                        const centerX = groupX + colWidth / 2;
                        
                        const barWidth = 10;
                        const gap = 3;
                        
                        const valKehadiran = student.persentase_kehadiran;
                        const valNilai = student.rata_rata_nilai;
                        
                        const hKehadiran = (valKehadiran / 100) * chartHeight;
                        const hNilai = (valNilai / 100) * chartHeight;
                        
                        const yKehadiran = paddingTop + chartHeight - hKehadiran;
                        const yNilai = paddingTop + chartHeight - hNilai;

                        const isHovered = hoveredIdx === idx;

                        return (
                          <g
                            key={student.id}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className="cursor-pointer"
                          >
                            {/* Hover Highlight Overlay Background */}
                            <rect
                              x={groupX + 4}
                              y={paddingTop - 5}
                              width={colWidth - 8}
                              height={chartHeight + 10}
                              fill={isHovered ? "rgba(255,255,255,0.05)" : "transparent"}
                              rx="6"
                              className="transition-all duration-200"
                            />

                            {/* Kehadiran Bar */}
                            <rect
                              x={centerX - barWidth - gap/2}
                              y={yKehadiran}
                              width={barWidth}
                              height={hKehadiran}
                              fill="url(#blueGradient)"
                              rx="2"
                              className="transition-all duration-300"
                            />

                            {/* Nilai Bar */}
                            <rect
                              x={centerX + gap/2}
                              y={yNilai}
                              width={barWidth}
                              height={hNilai}
                              fill="url(#purpleGradient)"
                              rx="2"
                              className="transition-all duration-300"
                            />

                            {/* X Axis Student Label */}
                            <text
                              x={centerX}
                              y={paddingTop + chartHeight + 16}
                              fill={isHovered ? "#ffffff" : "#9ca3af"}
                              fontSize="10"
                              textAnchor="middle"
                              className="transition-colors duration-200"
                            >
                              {student.nama.length > 8
                                ? `${student.nama.slice(0, 8)}...`
                                : student.nama}
                            </text>
                          </g>
                        );
                      })}

                      {/* Defs for gradients */}
                      <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#7e22ce" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Interactive Tooltip */}
                    {hoveredIdx !== null && chartData[hoveredIdx] && (
                      <div
                        className="absolute bg-gray-900/95 border border-gray-800/90 text-white p-3 rounded-xl shadow-2xl text-xs space-y-1 z-10 transition-all pointer-events-none duration-150"
                        style={{
                          left: `${Math.min(
                            Math.max(
                              (hoveredIdx * (chartWidth / chartData.length)) + paddingLeft - 30,
                              10
                            ),
                            chartWidth - 110
                          )}px`,
                          top: "20px",
                        }}
                      >
                        <p className="font-semibold border-b border-gray-800 pb-1 mb-1 text-gray-200">
                          {chartData[hoveredIdx].nama}
                        </p>
                        <p className="flex justify-between gap-4 text-gray-400">
                          <span>Kehadiran:</span>
                          <span className="font-bold text-blue-400">{chartData[hoveredIdx].persentase_kehadiran}%</span>
                        </p>
                        <p className="flex justify-between gap-4 text-gray-400">
                          <span>Rata Nilai:</span>
                          <span className="font-bold text-purple-400">{chartData[hoveredIdx].rata_rata_nilai}</span>
                        </p>
                        <p className="flex justify-between gap-4 text-gray-400">
                          <span>Kelas:</span>
                          <span className="font-bold text-white">{chartData[hoveredIdx].kelas}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Aksi Cepat</h3>
            <div className="space-y-4">
              <button onClick={() => router.push('/data-siswa')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors text-gray-200 text-sm flex items-center justify-between">
                Kelola Data Siswa
                <Users className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={() => router.push('/prediksi')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors text-gray-200 text-sm flex items-center justify-between">
                Lakukan Prediksi Baru
                <Activity className="w-4 h-4 text-gray-400" />
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
    <div className={`rounded-2xl p-6 border ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
