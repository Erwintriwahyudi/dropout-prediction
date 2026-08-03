"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Sigma, Layers, BarChart, Play, CheckCircle2,
  RefreshCw, Database, AlertCircle, Info, ChevronRight
} from "lucide-react";

export default function HasilNaiveBayesPage() {
  const [animIn, setAnimIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [c45List, setC45List] = useState<any[]>([]);
  const [selectedC45, setSelectedC45] = useState<string>("");
  const [modelData, setModelData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<"idle" | "reading" | "calculating" | "saving" | "completed">("idle");
  const [processLogs, setProcessLogs] = useState<string[]>([]);

  useEffect(() => {
    setAnimIn(true);
    fetchC45List();
  }, []);

  const fetchC45List = async () => {
    try {
      const res = await api.get("/naive-bayes/c45-list");
      setC45List(res.data);
      if (res.data.length > 0) {
        setSelectedC45(res.data[0].id_hasil_c45.toString());
      }
    } catch (err: any) {
      console.error("Gagal mengambil daftar C4.5:", err);
    }
  };

  const fetchNaiveBayesResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/naive-bayes/results");
      setModelData(res.data);
    } catch (err: any) {
      // 404 is normal if it hasn't been run yet
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.error || "Gagal mengambil hasil Naive Bayes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunNaiveBayes = async () => {
    if (c45List.length === 0) {
      alert("Harap jalankan C4.5 terlebih dahulu sebelum memproses Naive Bayes.");
      return;
    }

    const latestId = c45List[0].id_hasil_c45;
    setIsProcessing(true);
    setProcessStep("reading");
    setProcessLogs(["Mulai proses Naive Bayes...", "Membaca data C4.5 terpilih..."]);

    try {
      // Simulate steps matching activity diagram
      setTimeout(() => {
        setProcessStep("calculating");
        setProcessLogs(prev => [...prev, "Melakukan perhitungan probabilitas Naive Bayes..."]);
      }, 1000);

      setTimeout(async () => {
        setProcessStep("saving");
        setProcessLogs(prev => [...prev, "Menyimpan hasil probabilitas ke database..."]);

        try {
          const res = await api.post("/naive-bayes/process", {
            id_hasil_c45: latestId
          });

          setProcessStep("completed");
          setProcessLogs(prev => [...prev, "Proses Naive Bayes selesai!"]);

          setTimeout(() => {
            setIsProcessing(false);
            setShowResults(true);
            fetchNaiveBayesResults();
          }, 800);

        } catch (err: any) {
          const errorMsg = err?.response?.data?.error || "Terjadi kesalahan saat memproses Naive Bayes.";
          alert(errorMsg);
          setIsProcessing(false);
          setProcessStep("idle");
        }
      }, 2200);

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
            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <Sigma className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Hasil Analisis Algoritma Naive Bayes</h1>
              <p className="text-slate-400 text-sm mt-0.5">Klasifikasi probabilitas drop-out siswa berdasarkan dataset hasil C4.5</p>
            </div>
          </div>

          <button
            onClick={fetchNaiveBayesResults}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-800 transition-colors text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>

        {/* PROSES NAIVE BAYES CONTROL CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" /> Alur Pemrosesan Naive Bayes
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Algoritma Naive Bayes akan menghitung peluang bersyarat untuk memprediksi risiko drop-out siswa dengan mengambil inputan data hasil dari C4.5.
          </p>

          <div className="flex flex-col md:flex-row items-end gap-4 bg-slate-950 p-5 rounded-xl border border-slate-850">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data Input Hasil C4.5 Utama</label>
              {c45List.length === 0 ? (
                <div className="text-amber-500 text-sm py-2">Belum ada data C4.5 di database. Harap jalankan C4.5 terlebih dahulu.</div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-purple-400">Hasil C4.5 Terbaru (Aktif)</span>
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
              onClick={handleRunNaiveBayes}
              disabled={isProcessing || c45List.length === 0}
              className={`w-full md:w-auto px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all shadow-lg ${isProcessing
                  ? "bg-purple-600/50 text-purple-300 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-500/10 active:scale-95"
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
                  Jalankan Naive Bayes
                </>
              )}
            </button>
          </div>

          {/* Activity Process Steps (Logs) */}
          {isProcessing && (
            <div className="mt-6 bg-slate-950/60 border border-purple-500/20 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Status Pemrosesan Sistem</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-3 rounded-lg border text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${processStep === "reading"
                    ? "bg-purple-950/50 border-purple-500 text-white animate-pulse"
                    : processStep === "calculating" || processStep === "saving" || processStep === "completed"
                      ? "bg-slate-900/40 border-emerald-950 text-emerald-400"
                      : "bg-slate-950 border-slate-900 text-slate-600"
                  }`}>
                  {processStep !== "reading" && (processStep === "calculating" || processStep === "saving" || processStep === "completed") ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : null}
                  1. Membaca Data C4.5
                </div>

                <div className={`p-3 rounded-lg border text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${processStep === "calculating"
                    ? "bg-purple-950/50 border-purple-500 text-white animate-pulse"
                    : processStep === "saving" || processStep === "completed"
                      ? "bg-slate-900/40 border-emerald-950 text-emerald-400"
                      : "bg-slate-950 border-slate-900 text-slate-600"
                  }`}>
                  {processStep === "saving" || processStep === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : null}
                  2. Hitung Probabilitas
                </div>

                <div className={`p-3 rounded-lg border text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${processStep === "saving"
                    ? "bg-purple-950/50 border-purple-500 text-white animate-pulse"
                    : processStep === "completed"
                      ? "bg-slate-900/40 border-emerald-950 text-emerald-400"
                      : "bg-slate-950 border-slate-900 text-slate-600"
                  }`}>
                  {processStep === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : null}
                  3. Simpan ke DB
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
                    <ChevronRight className="w-3 h-3 text-purple-500" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RESULTS CONTAINER */}
        {error && (
          <div className="bg-red-950/20 border border-red-800/40 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-semibold text-sm">Gagal Mengambil Data</h3>
              <p className="text-slate-400 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {!showResults || !modelData ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <Info className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <p className="font-medium text-white mb-1">Belum Ada Hasil Naive Bayes</p>
            <p className="text-sm max-w-md mx-auto text-slate-400 leading-normal">
              Silakan pilih data hasil C4.5 di atas kemudian klik tombol <strong>Jalankan Naive Bayes</strong> untuk melihat hasil perhitungan klasifikasi.
            </p>
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Akurasi", value: `${modelData.metrics.accuracy}%`, desc: "Ketepatan prediksi keseluruhan", color: "emerald" },
                { label: "Presisi", value: `${modelData.metrics.precision}%`, desc: "Ketepatan prediksi positif", color: "blue" },
                { label: "Recall", value: `${modelData.metrics.recall}%`, desc: "Sensitivitas deteksi kelas berisiko", color: "purple" },
                { label: "F1-Score", value: `${modelData.metrics.f1_score}%`, desc: "Keseimbangan presisi & recall", color: "cyan" }
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
                  <Layers className="w-4 h-4 text-purple-400" /> Confusion Matrix (Distribusi Pengujian)
                </h2>

                {/* Visual Confusion Matrix Table */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold mb-2 text-slate-400">
                    <div></div>
                    <div className="col-span-3 text-center border-b border-slate-800 pb-1">PREDIKSI KELAS</div>
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

              {/* Probabilitas Prior & Parameter */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                  <BarChart className="w-4 h-4 text-purple-400" /> Probabilitas Prior Kelas
                </h2>
                <div className="space-y-4">
                  {modelData.prior_probabilities && modelData.prior_probabilities.map((prob: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-slate-300 font-medium">{prob.label}</span>
                        <span className="text-purple-400 font-bold font-mono">{(prob.value * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-850 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${prob.value * 100}%` }} />
                      </div>
                    </div>
                  ))}

                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[11px] text-slate-400 leading-normal flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Dihitung dari total data latih sebesar <strong>{modelData.total_samples} siswa</strong>. Naive Bayes Classifier kemudian menggunakan probabilitas prior ini dan probabilitas likelihood untuk menghasilkan prediksi kelas risiko yang paling optimal.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
