"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import {
  GitFork, CheckCircle, FileCode, Cpu, Layers, RefreshCw,
  AlertCircle, Database, BarChart2, ChevronDown, ChevronUp,
  Folder, FolderOpen, Play, Info, FileSpreadsheet, Calculator,
  Upload, CheckCircle2, ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  Tinggi: "text-red-400 bg-red-950/40 border-red-800/50",
  Sedang: "text-amber-400 bg-amber-950/40 border-amber-800/50",
  Rendah: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50",
};

// ── KOMPONEN REKURSIF POHON KEPUTUSAN VERTIKAL (TOP-DOWN) ───────────────────
interface TreeNodeProps {
  node: {
    name: string;
    is_leaf: boolean;
    class_name?: string;
    samples: number;
    confidence?: string;
    threshold?: number;
    children?: Array<{
      condition: string;
      node: any;
    }>;
  };
}

function TreeNode({ node }: TreeNodeProps) {
  if (node.is_leaf) {
    return (
      <div className="flex flex-col items-center p-2 relative">
        <div className={`px-4 py-2.5 rounded-xl border shadow-lg text-center min-w-[140px] max-w-[180px] transition-all hover:scale-105 hover:shadow-cyan-500/10 ${RISK_COLORS[node.class_name!] || "text-gray-300 bg-gray-800 border-gray-700"}`}>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Hasil Klasifikasi</p>
          <p className="font-sans font-extrabold text-sm mt-0.5">{node.class_name}</p>
          <span className="text-[9px] block text-gray-400 mt-1 bg-black/35 py-0.5 px-1.5 rounded">
            {node.samples} data ({node.confidence})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-4">
      {/* Node Fitur Induk */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl px-5 py-2 text-center shadow-[0_0_15px_rgba(6,182,212,0.15)] z-10 min-w-[150px]">
        <span className="text-cyan-300 text-xs font-bold tracking-wide uppercase">{node.name.replace(/ATRIBUT FITUR/i, '').trim()}</span>
        <span className="text-[10px] text-gray-500 block font-sans mt-0.5">n = {node.samples}</span>
      </div>

      {/* Anak Cabang */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-row justify-center mt-6 relative w-full">
          {node.children.map((child, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === node.children!.length - 1;
            const isSingle = node.children!.length === 1;

            return (
              <div key={idx} className="flex flex-col items-center relative px-4 min-w-[140px] flex-1">
                {/* Garis horizontal penghubung antar dahan */}
                {!isSingle && (
                  <div 
                    className={`absolute top-0 h-px bg-cyan-800/40 ${
                      isFirst ? "left-1/2 right-0" : isLast ? "left-0 right-1/2" : "left-0 right-0"
                    }`} 
                  />
                )}
                
                {/* Garis vertikal kecil ke bawah menuju anak */}
                <div className="w-px h-4 bg-cyan-800/40" />

                {/* Bubble Kondisi / Aturan Pemisahan */}
                <div className="z-10 -mt-2 mb-2">
                  <span className="text-[9px] font-sans font-bold bg-slate-900 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                    {child.condition}
                  </span>
                </div>

                <TreeNode node={child.node} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── COMPONENT UTAMA ──────────────────────────────────────────────────────────
export default function HasilC45Page() {
  const [loading, setLoading] = useState(false);
  const [modelData, setModelData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllRules, setShowAllRules] = useState(false);
  const [filterClass, setFilterClass] = useState("Semua");
  const [activeTab, setActiveTab] = useState<"rules" | "tree">("rules");

  // State untuk Kontrol Zoom Tree (%)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 180));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 40));
  const handleResetZoom = () => setZoomLevel(100);

  // Selection state (mengikuti alur Activity Diagram)
  const [selectedDataset, setSelectedDataset] = useState("db_master");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<"idle" | "counting" | "entropy" | "gain" | "rules" | "saving" | "completed">("idle");

  const fetchC45Results = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/c45/results");
      setModelData(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Gagal mengambil data C4.5.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRunC45 = async () => {
    if (selectedDataset === "csv_upload" && !csvFile) {
      alert("Pilih file CSV terlebih dahulu.");
      return;
    }
    setIsProcessing(true);
    setProcessStep("counting");

    try {
      setTimeout(() => setProcessStep("entropy"), 800);
      setTimeout(() => setProcessStep("gain"), 1600);
      setTimeout(() => setProcessStep("rules"), 2400);
      setTimeout(() => setProcessStep("saving"), 3200);

      let res;
      if (selectedDataset === "csv_upload" && csvFile) {
        const formData = new FormData();
        formData.append("source", "csv_upload");
        formData.append("file", csvFile);
        res = await api.post("/c45/process", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/c45/process", { source: selectedDataset });
      }

      setTimeout(() => {
        setProcessStep("completed");
        setIsProcessing(false);
        fetchC45Results();
      }, 4000);

    } catch (err: any) {
      console.error("Gagal memproses C4.5:", err);
      const errorMsg = err?.response?.data?.error || "Terjadi kesalahan saat melatih algoritma C4.5.";
      alert(errorMsg);
      setIsProcessing(false);
      setProcessStep("idle");
    }
  };

  // ── Filtered rules ────────────────────────────────────────────────────────
  const allRules: any[] = modelData?.rules || [];
  const filteredRules = filterClass === "Semua"
    ? allRules
    : allRules.filter((r: any) => r.conclusion === filterClass);
  const displayRules = showAllRules ? filteredRules : filteredRules.slice(0, 10);

  // ── Belum diproses / Error ────────────────────────────────────────────────
  if (!modelData || error || !modelData?.model_ready) {

    return (
      <div className="min-h-screen bg-gray-950 p-8 text-white space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GitFork className="w-8 h-8 text-cyan-400" />
            Hasil Analisis Algoritma C4.5
          </h1>
          <p className="text-gray-400 mt-1">Pohon Keputusan &amp; Aturan IF-THEN dari data yang sudah dipreprocessing.</p>
        </div>

        {/* Jalankan C4.5 Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            Pilih Dataset &amp; Latih Model C4.5
          </h2>
          <div className="flex flex-col gap-4">
            <div className="w-full space-y-3">
              <label className="text-xs text-gray-400">Sumber Data:</label>
              <select
                value={selectedDataset}
                onChange={(e) => { setSelectedDataset(e.target.value); setCsvFile(null); }}
                disabled={isProcessing}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="db_master">Database Master (Data Siswa Terinput)</option>
                <option value="csv_upload">Upload File CSV</option>
              </select>

              {selectedDataset === "csv_upload" && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.name.endsWith(".csv")) setCsvFile(file);
                    else alert("Hanya file .csv yang diizinkan.");
                  }}
                  className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isDragOver ? "border-cyan-400 bg-cyan-950/40"
                    : csvFile ? "border-emerald-500 bg-emerald-950/30"
                      : "border-gray-700 hover:border-cyan-700 bg-gray-950"
                    }`}
                >
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setCsvFile(f); }}
                  />
                  {csvFile ? (
                    <div className="flex items-center justify-center gap-3 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-semibold">{csvFile.name}</span>
                      <span className="text-xs text-gray-500">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm space-y-1">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p>Drag &amp; drop file CSV di sini, atau <span className="text-cyan-400 underline">klik untuk memilih</span></p>
                      <p className="text-xs text-gray-600">Hanya file .csv • Pastikan kolom sesuai format dataset</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleRunC45}
              disabled={isProcessing}
              className="w-full md:w-auto self-end px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {isProcessing
                ? <><RefreshCw className="w-4 h-4 animate-spin text-cyan-300" /><span>Melatih Model C4.5...</span></>
                : <><Play className="w-4 h-4 fill-current" /><span>Jalankan C4.5</span></>}
            </button>
          </div>
        </div>

        {/* Langkah proses (saat isProcessing) */}
        {isProcessing && (
          <div className="bg-gray-900 border border-cyan-900/50 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Sedang Memproses</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className={`p-3 rounded-lg border ${processStep === "counting" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-600"}`}>1. Menghitung Kasus Tiap Kelas</div>
              <div className={`p-3 rounded-lg border ${processStep === "entropy" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-600"}`}>2. Menghitung Entropy Total</div>
              <div className={`p-3 rounded-lg border ${processStep === "gain" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-600"}`}>3. Menghitung Gain &amp; Gain Ratio</div>
              <div className={`p-3 rounded-lg border ${processStep === "rules" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-600"}`}>4. Membentuk Aturan IF-THEN</div>
              <div className={`p-3 rounded-lg border ${processStep === "saving" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-600"}`}>5. Menyimpan Model ke DB</div>
            </div>
          </div>
        )}

        {/* Status box: error atau belum diproses */}
        {error ? (
          <div className="bg-red-950/30 border border-red-800/50 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-300 text-sm max-w-md">{error}</p>
          </div>
        ) : (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
            <GitFork className="w-12 h-12 text-gray-700" />
            <p className="text-gray-500 text-sm max-w-md">
              Hasil analisis C4.5 akan ditampilkan di sini setelah Anda memilih sumber data dan menekan tombol <span className="text-cyan-400 font-semibold">Jalankan C4.5</span>.
            </p>
          </div>
        )}
      </div>
    );
  }

  const { metrics, dataset_info, per_class_metrics, class_distribution, rules, tree_structure, calculation_c45 } = modelData;


  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white space-y-8">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GitFork className="w-8 h-8 text-cyan-400" />
            Hasil Analisis Algoritma C4.5
          </h1>
          <p className="text-gray-400 mt-1">
            Pohon Keputusan &amp; Aturan IF-THEN dari data yang sudah dipreprocessing.
          </p>
        </div>
      </div>

      {/* ── 🟢 LANGKAH 1: MEMILIH DATASET PREPROCESSING DAN JALANKAN C4.5 ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          Langkah Admin: Memilih Dataset Preprocessing &amp; Jalankan C4.5
        </h2>
        <div className="flex flex-col gap-4">
          <div className="w-full space-y-3">
            <label className="text-xs text-gray-400">Sumber Data Mentah (Raw Dataset):</label>
            <select
              value={selectedDataset}
              onChange={(e) => { setSelectedDataset(e.target.value); setCsvFile(null); }}
              disabled={isProcessing}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="db_master">Database Master (Data Siswa Terinput)</option>
              <option value="csv_upload">Upload File CSV</option>
            </select>

            {selectedDataset === "csv_upload" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.endsWith(".csv")) setCsvFile(file);
                  else alert("Hanya file .csv yang diizinkan.");
                }}
                className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isDragOver ? "border-cyan-400 bg-cyan-950/40"
                  : csvFile ? "border-emerald-500 bg-emerald-950/30"
                    : "border-gray-700 hover:border-cyan-700 bg-gray-950"
                  }`}
              >
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setCsvFile(f); }}
                />
                {csvFile ? (
                  <div className="flex items-center justify-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-semibold">{csvFile.name}</span>
                    <span className="text-xs text-gray-500">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm space-y-1">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <p>Drag &amp; drop file CSV di sini, atau <span className="text-cyan-400 underline">klik untuk memilih</span></p>
                    <p className="text-xs text-gray-600">Hanya file .csv • Pastikan kolom sesuai format dataset</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleRunC45}
            disabled={isProcessing}
            className="w-full md:w-auto self-end px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            {isProcessing ? (
              <><RefreshCw className="w-4 h-4 animate-spin text-cyan-300" /><span>Melatih Model C4.5...</span></>
            ) : (
              <><Play className="w-4 h-4 fill-current" /><span>Jalankan C4.5</span></>
            )}
          </button>
        </div>
      </div>

      {/* ── 🟡 LANGKAH SISTEM: PROSES PEMBENTUKAN POHON C4.5 ── */}
      {isProcessing && (
        <div className="bg-gray-900 border border-cyan-950 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4" />
            Sistem: Sedang Proses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${processStep === "counting" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
              <span className="font-bold">1. Kasus Kelas</span>
              <span className="text-[10px] mt-1">Menghitung total kasus tiap kelas</span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${processStep === "entropy" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
              <span className="font-bold">2. Entropy Total</span>
              <span className="text-[10px] mt-1">Menghitung Nilai Entropy Total</span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${processStep === "gain" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
              <span className="font-bold">3. Gain &amp; Ratio</span>
              <span className="text-[10px] mt-1">Menghitung Gain Tiap Atribut</span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${processStep === "rules" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
              <span className="font-bold">4. Pohon &amp; Aturan</span>
              <span className="text-[10px] mt-1">Membentuk Aturan IF-THEN</span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${processStep === "saving" ? "bg-cyan-950/60 border-cyan-500 text-white animate-pulse" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
              <span className="font-bold">5. Simpan DB</span>
              <span className="text-[10px] mt-1">Menyimpan Pohon ke Database</span>
            </div>
          </div>
        </div>
      )}

      {/* ── INFO DATASET ─────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <p className="text-gray-500 uppercase font-semibold">Total Data Bersih</p>
          <p className="text-white text-xl font-bold mt-1">{dataset_info?.total_data?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 uppercase font-semibold">Data Latih (80%)</p>
          <p className="text-cyan-400 text-xl font-bold mt-1">{dataset_info?.total_training?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 uppercase font-semibold">Data Uji (20%)</p>
          <p className="text-amber-400 text-xl font-bold mt-1">{dataset_info?.total_testing?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 uppercase font-semibold">Jumlah Fitur</p>
          <p className="text-purple-400 text-xl font-bold mt-1">{dataset_info?.fitur?.length}</p>
        </div>
      </div>

      {/* ── CARD METRICS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Akurasi", value: `${metrics.accuracy}%`, color: "text-emerald-400", icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
          { label: "Presisi", value: `${metrics.precision}%`, color: "text-cyan-400", icon: <Cpu className="w-4 h-4 text-cyan-400" /> },
          { label: "Recall", value: `${metrics.recall}%`, color: "text-sky-400", icon: <BarChart2 className="w-4 h-4 text-sky-400" /> },
          { label: "F1-Score", value: `${metrics.f1_score}%`, color: "text-violet-400", icon: <Database className="w-4 h-4 text-violet-400" /> },
          { label: "Total Aturan", value: metrics.total_rules, color: "text-amber-400", icon: <FileCode className="w-4 h-4 text-amber-400" /> },
          { label: "Pohon Keputusan", value: `${metrics.max_depth} Level`, color: "text-purple-400", icon: <Layers className="w-4 h-4 text-purple-400" /> },
        ].map((m) => (
          <div key={m.label} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
            <div className="flex justify-between items-center text-gray-400 text-[10px] font-semibold uppercase">
              <span>{m.label}</span>{m.icon}
            </div>
            <p className={`text-2xl font-bold mt-2 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── 🔵 TABEL PERHITUNGAN ENTROPY, GAIN, & GAIN RATIO ── */}
      {calculation_c45 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                Matriks Perhitungan C4.5 (Entropy &amp; Gain Ratio)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Nilai Entropy Total Dataset: <span className="text-cyan-400 font-mono font-semibold">{calculation_c45.entropy_total}</span>
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Kasus: {Object.entries(calculation_c45.target_counts).map(([cls, count]) => `${cls} (${count})`).join(" | ")}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-950 text-gray-400 uppercase border-b border-gray-800">
                <tr>
                  <th className="px-5 py-3">Atribut Fitur</th>
                  <th className="px-5 py-3">Entropy Atribut</th>
                  <th className="px-5 py-3">Information Gain</th>
                  <th className="px-5 py-3">Split Info</th>
                  <th className="px-5 py-3">Gain Ratio</th>
                  <th className="px-5 py-3 text-right">Prioritas Split</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 font-mono">
                {calculation_c45.gain_ratios.map((g: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3 text-white font-sans font-medium">{g.attribute}</td>
                    <td className="px-5 py-3 text-gray-300">{g.entropy}</td>
                    <td className="px-5 py-3 text-cyan-400">{g.gain}</td>
                    <td className="px-5 py-3 text-gray-300">{g.split_info}</td>
                    <td className="px-5 py-3 text-emerald-400 font-bold">{g.gain_ratio}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans ${idx === 0 ? "bg-cyan-950 text-cyan-400 border border-cyan-800" : "bg-gray-950 text-gray-600 border border-gray-800"}`}>
                        {idx === 0 ? "Node Akar (Terbesar)" : `Prio ${idx + 1}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PER-CLASS METRICS ─────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Evaluasi Per Kelas Risiko
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-950 text-gray-400 uppercase border-b border-gray-800">
              <tr>
                <th className="px-5 py-3">Kelas Risiko</th>
                <th className="px-5 py-3">Precision</th>
                <th className="px-5 py-3">Recall</th>
                <th className="px-5 py-3">F1-Score</th>
                <th className="px-5 py-3">Support (Sampel Uji)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {per_class_metrics?.map((c: any) => (
                <tr key={c.class} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`px-3 py-1 rounded-full border text-[11px] font-semibold ${RISK_COLORS[c.class] || "text-gray-300 bg-gray-800 border-gray-700"}`}>
                      {c.class}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-cyan-400">{c.precision}%</td>
                  <td className="px-5 py-3 font-mono text-sky-400">{c.recall}%</td>
                  <td className="px-5 py-3 font-mono text-violet-400">{c.f1}%</td>
                  <td className="px-5 py-3 font-mono text-gray-300">{c.support?.toLocaleString()} data</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TAB NAVIGASI ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === "rules"
            ? "border-cyan-500 text-cyan-400"
            : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
        >
          Daftar Aturan (IF-THEN)
        </button>
        <button
          onClick={() => setActiveTab("tree")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === "tree"
            ? "border-cyan-500 text-cyan-400"
            : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
        >
          Pohon Keputusan Interaktif
        </button>
      </div>

      {/* ── KONTEN TAB: DAFTAR ATURAN ────────────────────────────────────── */}
      {activeTab === "rules" ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                Ekstraksi Aturan Keputusan (Decision Rules)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Menampilkan {displayRules.length} dari {filteredRules.length} aturan
                {filterClass !== "Semua" ? ` untuk kelas "${filterClass}"` : ""}
              </p>
            </div>
            {/* Filter Kelas */}
            <div className="flex gap-2 flex-wrap">
              {["Semua", ...(dataset_info?.kelas || [])].map((cls) => (
                <button
                  key={cls}
                  onClick={() => { setFilterClass(cls); setShowAllRules(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterClass === cls
                    ? "bg-cyan-600 border-cyan-500 text-white"
                    : "bg-gray-950 border-gray-700 text-gray-400 hover:border-cyan-700"
                    }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-800/60 font-mono text-xs">
            {displayRules.map((rule: any, index: number) => (
              <div
                key={index}
                className="px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-md shrink-0">
                    R{index + 1}
                  </span>
                  <p className="text-gray-300 leading-relaxed pt-0.5 break-words">{rule.text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] px-3 py-1 rounded-full border font-sans font-medium ${RISK_COLORS[rule.conclusion] || "text-gray-300 bg-gray-800 border-gray-700"}`}>
                    {rule.conclusion}
                  </span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full font-sans font-medium whitespace-nowrap">
                    {rule.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredRules.length > 10 && (
            <div className="p-4 border-t border-gray-800 flex justify-center">
              <button
                onClick={() => setShowAllRules((v) => !v)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                {showAllRules ? (
                  <><ChevronUp className="w-4 h-4" /> Tampilkan Lebih Sedikit</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Tampilkan Semua {filteredRules.length} Aturan</>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── KONTEN TAB: POHON INTERAKTIF + FITUR ZOOM CONTROLS ── */
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitFork className="w-5 h-5 text-cyan-400" />
                Struktur Pohon Keputusan C4.5
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Visualisasi pohon keputusan hierarki dari kiri ke kanan (Left-to-Right).
              </p>
            </div>

            {/* Kontrol Zoom In / Zoom Out / Reset */}
            <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl">
              <span className="text-[11px] text-gray-400 font-mono mr-1">Zoom: {zoomLevel}%</span>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-lg transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Zoom (100%)"
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-lg transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Container Pohon dengan Transform Scale */}
          <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-8 overflow-auto text-xs min-h-[450px]">
            {tree_structure ? (
              <div
                className="w-max min-w-full py-4 pr-6 flex items-center transition-transform duration-200 origin-top-left"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                <TreeNode node={tree_structure} />
              </div>
            ) : (
              <p className="text-gray-500">Struktur pohon tidak tersedia.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}