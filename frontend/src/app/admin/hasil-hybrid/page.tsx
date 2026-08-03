"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Layers, Sparkles, TrendingUp, ShieldAlert, Cpu,
  Play, CheckCircle2, RefreshCw, Database, Info,
  ChevronRight, AlertCircle
} from "lucide-react";

export default function HasilHybridPage() {
  const [animIn, setAnimIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [c45List, setC45List] = useState<any[]>([]);
  const [modelData, setModelData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<"idle" | "reading" | "combining" | "evaluating" | "saving" | "completed">("idle");
  const [processLogs, setProcessLogs] = useState<string[]>([]);

  useEffect(() => {
    setAnimIn(true);
    fetchC45List();
    fetchHybridResults();
  }, []);

  const fetchC45List = async () => {
    try {
      const res = await api.get("/naive-bayes/c45-list");
      setC45List(res.data);
    } catch (err: any) {
      console.error("Gagal mengambil daftar C4.5:", err);
    }
  };

  const fetchHybridResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/hybrid/results");
      setModelData(res.data);
      setShowResults(true); // Show if results already exist in database
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.error || "Gagal mengambil hasil Hybrid.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunHybrid = async () => {
    if (c45List.length === 0) {
      alert("Harap jalankan C4.5 terlebih dahulu sebelum memproses model Hybrid.");
      return;
    }

    setIsProcessing(true);
    setProcessStep("reading");
    setProcessLogs(["Mulai proses Hybrid...", "Membaca data C4.5 Terbaru..."]);

    try {
      // Step 2: Combining NB and C4.5
      setTimeout(() => {
        setProcessStep("combining");
        setProcessLogs(prev => [...prev, "Menggabungkan hasil C4.5 dan Probabilitas Naive Bayes..."]);
      }, 1000);

      // Step 3: Calculating evaluation matrix
      setTimeout(() => {
        setProcessStep("evaluating");
        setProcessLogs(prev => [...prev, "Menghitung matriks evaluasi..."]);
      }, 2000);

      // Step 4: Saving final hybrid results
      setTimeout(async () => {
        setProcessStep("saving");
        setProcessLogs(prev => [...prev, "Menyimpan hasil akhir hybrid ke database..."]);

        try {
          const res = await api.post("/hybrid/process", {
            id_hasil_c45: c45List[0].id_hasil_c45
          });

          setProcessStep("completed");
          setProcessLogs(prev => [...prev, "Proses Hybrid selesai!"]);

          setTimeout(() => {
            setIsProcessing(false);
            setShowResults(true);
            fetchHybridResults();
          }, 800);

        } catch (err: any) {
          const errorMsg = err?.response?.data?.error || "Terjadi kesalahan saat memproses Hybrid.";
          alert(errorMsg);
          setIsProcessing(false);
          setProcessStep("idle");
        }
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setProcessStep("idle");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8">
      <div className={`max-w-6xl mx-auto transition-all duration-700 ${animIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Layers className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Hasil Analisis Hybrid</h1>
            </div>
          </div>

          <button
            onClick={fetchHybridResults}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-800 transition-colors text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>

        {/* Comparison Alert / Intro */}
        <div className="bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-800/40 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-lg">
          <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Optimalisasi Hasil Hybrid (C4.5 + Naive Bayes)</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Model Hybrid menggabungkan keunggulan representasi aturan keputusan yang jelas dari C4.5 dengan akurasi probabilitas Naive Bayes. Alur hybrid mengevaluasi struktur pohon keputusan C4.5 terlebih dahulu, lalu menghitung tingkat risiko menggunakan pembobotan probabilitas posterior Naive Bayes.
            </p>
          </div>
        </div>

        {/* HYBRID CONTROL CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" /> Alur Pemrosesan Model Hybrid
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Proses hybrid akan menggabungkan bobot probabilitas Naive Bayes pada klasifikasi pohon keputusan C4.5 untuk menghasilkan prediksi dropout siswa yang lebih akurat.
          </p>

          <div className="flex flex-col md:flex-row items-end gap-4 bg-slate-950 p-5 rounded-xl border border-slate-850">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data Input Hasil C4.5 Utama</label>
              {c45List.length === 0 ? (
                <div className="text-amber-500 text-sm py-2">Belum ada data C4.5 di database. Harap jalankan C4.5 terlebih dahulu.</div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-blue-400">Hasil C4.5 Terbaru (Aktif)</span>
                    <span className="hidden md:inline text-slate-700">|</span>
                    <span className="text-slate-400 text-xs md:text-sm">Atribut: {c45List[0].atribut_terpilih}</span>
                  </div>
                  <span className="self-start md:self-auto text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                    Optimal
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleRunHybrid}
              disabled={isProcessing || c45List.length === 0}
              className={`w-full md:w-auto px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all shadow-lg ${isProcessing
                ? "bg-blue-600/50 text-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/10 active:scale-95"
                }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Jalankan Proses Hybrid
                </>
              )}
            </button>
          </div>

          {/* Activity Process Steps (Logs) */}
          {isProcessing && (
            <div className="mt-6 bg-slate-950/60 border border-blue-500/20 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Status Pemrosesan Sistem</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-3 rounded-lg border text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${processStep === "reading" || processStep === "combining"
                  ? "bg-blue-950/50 border-blue-500 text-white animate-pulse"
                  : processStep === "evaluating" || processStep === "saving" || processStep === "completed"
                    ? "bg-slate-900/40 border-emerald-950 text-emerald-400"
                    : "bg-slate-950 border-slate-900 text-slate-600"
                  }`}>
                  {processStep !== "reading" && processStep !== "combining" && (processStep === "evaluating" || processStep === "saving" || processStep === "completed") ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : null}
                  1. Gabung C4.5 & NB
                </div>

                <div className={`p-3 rounded-lg border text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${processStep === "evaluating"
                  ? "bg-blue-950/50 border-blue-500 text-white animate-pulse"
                  : processStep === "saving" || processStep === "completed"
                    ? "bg-slate-900/40 border-emerald-950 text-emerald-400"
                    : "bg-slate-950 border-slate-900 text-slate-600"
                  }`}>
                  {processStep === "saving" || processStep === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : null}
                  2. Hitung Matriks Evaluasi
                </div>

                <div className={`p-3 rounded-lg border text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${processStep === "saving"
                  ? "bg-blue-950/50 border-blue-500 text-white animate-pulse"
                  : processStep === "completed"
                    ? "bg-slate-900/40 border-emerald-950 text-emerald-400"
                    : "bg-slate-950 border-slate-900 text-slate-600"
                  }`}>
                  {processStep === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : null}
                  3. Simpan Hasil Akhir ke DB
                </div>

                <div className={`p-3 rounded-lg border text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${processStep === "completed"
                  ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                  : "bg-slate-950 border-slate-900 text-slate-600"
                  }`}>
                  {processStep === "completed" ? <CheckCircle2 className="w-4 h-4" /> : null}
                  4. Selesai
                </div>
              </div>

              <div className="font-mono text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-1">
                {processLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-blue-500" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RESULTS CONTAINER */}
        {error && (
          <div className="bg-red-950/20 border border-red-800/40 rounded-2xl p-5 mb-8 flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-semibold text-sm">Gagal Mengambil Data</h3>
              <p className="text-slate-400 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {!showResults || !modelData ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <Info className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <p className="font-medium text-white mb-1">Belum Ada Hasil Hybrid</p>
            <p className="text-sm max-w-md mx-auto text-slate-400 leading-normal">
              Silakan klik tombol <strong>Jalankan Proses Hybrid</strong> di atas untuk menggabungkan model, menghitung evaluasi, dan menyimpan hasilnya.
            </p>
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Akurasi Hybrid", value: `${modelData.metrics.accuracy}%`, desc: "Ketepatan prediksi keseluruhan", color: "emerald" },
                { label: "Presisi Hybrid", value: `${modelData.metrics.precision}%`, desc: "Ketepatan prediksi positif", color: "blue" },
                { label: "Recall Hybrid", value: `${modelData.metrics.recall}%`, desc: "Sensitivitas deteksi kelas berisiko", color: "purple" },
                { label: "F1-Score Hybrid", value: `${modelData.metrics.f1_score}%`, desc: "Keseimbangan presisi & recall", color: "cyan" }
              ].map((metric, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-lg">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{metric.label}</span>
                  <p className={`text-3xl font-extrabold text-${metric.color}-400 my-1`}>{metric.value}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">{metric.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Confusion Matrix */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                  <Cpu className="w-4 h-4 text-blue-400" /> Confusion Matrix (Hybrid)
                </h2>

                {/* Visual Confusion Matrix Table */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold mb-2 text-slate-400">
                    <div></div>
                    <div className="col-span-3 text-center border-b border-slate-800 pb-1">PREDIKSI KELAS (HYBRID)</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold mb-2 text-slate-500">
                    <div className="text-left">AKTUAL</div>
                    {modelData.class_names.map((name: string) => (
                      <div key={name} className="truncate">{name}</div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {modelData.class_names.map((actName: string) => (
                      <div key={actName} className="grid grid-cols-4 gap-2 text-center items-center">
                        <div className="text-left text-[11px] font-semibold text-slate-400 truncate">{actName}</div>
                        {modelData.class_names.map((predName: string) => {
                          const item = modelData.confusion_matrix.find(
                            (c: any) => c.actual === actName && c.predicted === predName
                          );
                          const count = item ? item.count : 0;
                          const isDiagonal = actName === predName;
                          return (
                            <div
                              key={predName}
                              className={`p-3 rounded-lg border text-sm font-bold ${isDiagonal
                                ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400"
                                : count > 0
                                  ? "bg-rose-950/20 border-rose-900/50 text-rose-400"
                                  : "bg-slate-900/30 border-slate-900 text-slate-600"
                                }`}
                            >
                              {count}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Comparison */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Perbandingan Akurasi Algoritma
                </h2>
                <div className="space-y-4">
                  {modelData.comparisons && modelData.comparisons.map((alg: any, idx: number) => (
                    <div key={idx} className={`p-4 rounded-xl border ${alg.highlight ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-950 border-slate-850"}`}>
                      <div className="flex justify-between items-center mb-1.5 text-sm">
                        <span className={`font-semibold ${alg.highlight ? "text-emerald-400" : "text-slate-300"}`}>{alg.label}</span>
                        <span className="font-mono font-bold text-white">{alg.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${alg.color} transition-all duration-1000`} style={{ width: `${alg.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
