"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { Database, Play, CheckCircle2, RefreshCw, FileSpreadsheet, HardDrive, Filter, Binary, Upload, Download } from "lucide-react";

export default function PreprocessingPage() {
  const [selectedSource, setSelectedSource] = useState("db_master");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<"idle" | "cleaning" | "transforming" | "saving" | "completed">("idle");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [preprocessedList, setPreprocessedList] = useState<any[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(preprocessedList.length / itemsPerPage);
  const paginatedData = preprocessedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Mengambil data ter-preprocessing yang ada di DB saat halaman dimuat
  const fetchExistingData = async () => {
    try {
      const res = await api.get("/preprocessing/results");
      if (res.data) {
        setSummaryData(res.data.summary);
        setPreprocessedList(res.data.data || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Belum ada data preprocessing terproses:", err);
    }
  };

  useEffect(() => {
    fetchExistingData();
  }, []);

  // Fungsi Eksekusi Alur Preprocessing Sesuai Activity Diagram
  const handleStartPreprocessing = async () => {
    setIsProcessing(true);
    setProcessStep("cleaning");

    try {
      // Simulasi indikator visual tahapan sistem
      setTimeout(() => setProcessStep("transforming"), 1000);
      setTimeout(() => setProcessStep("saving"), 2000);

      // Panggil API Backend untuk eksekusi Cleaning, Transformasi, & Simpan Ke Database
      let res;
      if (selectedSource === "csv_upload" && csvFile) {
        const formData = new FormData();
        formData.append("source", "csv_upload");
        formData.append("file", csvFile);
        res = await api.post("/preprocessing/process", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/preprocessing/process", { source: selectedSource });
      }

      setTimeout(() => {
        setProcessStep("completed");
        setIsProcessing(false);
        setSummaryData(res.data.summary);
        setPreprocessedList(res.data.data || []);
        setCurrentPage(1);
      }, 2800);

    } catch (err) {
      console.error("Gagal memproses preprocessing:", err);
      alert("Terjadi kesalahan saat memproses data.");
      setIsProcessing(false);
      setProcessStep("idle");
    }
  };

  // Fungsi untuk mengunduh data hasil preprocessing dalam format CSV
  const handleDownloadCSV = () => {
    if (!preprocessedList || preprocessedList.length === 0) {
      alert("Tidak ada data untuk diunduh.");
      return;
    }

    // Header kolom diselaraskan persis dengan FEATURE_NAMES + TARGET_COL di backend
    const headers = [
      "Kategori Kehadiran",
      "Kategori Nilai",
      "Kategori Pelanggaran",
      "Pekerjaan Orang Tua",
      "Penghasilan Orang Tua",
      "Status SPP",
      "Status Orang Tua",
      "Risiko Drop-Out"
    ];

    // Pemetaan data ordinal ke nama kolom dataset dengan urutan yang benar
    const rows = preprocessedList.map(row => [
      row.kategori_kehadiran ?? "",
      row.kategori_nilai ?? "",
      row.kategori_pelanggaran ?? "",
      row.pekerjaan_orang_tua ?? "",
      row.penghasilan_orang_tua ?? "",
      row.status_spp ?? "",
      row.status_orang_tua ?? "",
      row["Risiko Drop-Out"] ?? row.kategori_risiko ?? "Sedang"
    ]);

    const csvContent = "\ufeff" + [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `hasil_preprocessing_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="w-8 h-8 text-cyan-400" />
          Preprocessing Data
        </h1>
        <p className="text-gray-400 mt-1">
          Alur penyiapan data mentah (Cleaning & Encoding) untuk model C4.5 dan Naive Bayes.
        </p>
      </div>

      {/* 🟢 STEP 1: ADMIN PILIH DATA MENTAH & EKSEKUSI PROSES */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          Langkah 1: Pilih Data Mentah (Input Admin)
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-2/3 space-y-3">
            <label className="text-xs text-gray-400">Sumber Data Mentah (Raw Dataset):</label>
            <select
              value={selectedSource}
              onChange={(e) => { setSelectedSource(e.target.value); setCsvFile(null); }}
              disabled={isProcessing}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="db_master">Database Master (Data Siswa Terinput)</option>
              <option value="csv_upload">Upload File CSV</option>
            </select>

            {/* File Upload Area - tampil hanya saat csv_upload dipilih */}
            {selectedSource === "csv_upload" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.endsWith(".csv")) setCsvFile(file);
                  else alert("Hanya file .csv yang diizinkan.");
                }}
                className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isDragOver
                  ? "border-cyan-400 bg-cyan-950/40"
                  : csvFile
                    ? "border-emerald-500 bg-emerald-950/30"
                    : "border-gray-700 hover:border-cyan-700 bg-gray-950"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCsvFile(file);
                  }}
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
                    <p>Drag & drop file CSV di sini, atau <span className="text-cyan-400 underline">klik untuk memilih</span></p>
                    <p className="text-xs text-gray-600">Hanya file .csv • Pastikan kolom sesuai format dataset</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleStartPreprocessing}
            disabled={isProcessing}
            className="w-full md:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
                <span>Memproses Data...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Proses Preprocessing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 🟡 STEP 2: INDIKATOR PROSES SISTEM (CLEANING -> TRANSFORMASI -> SIMPAN DB) */}
      {isProcessing && (
        <div className="bg-gray-900 border border-cyan-900/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
            Sistem Sedang Bekerja...
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* CLEANING */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${processStep === "cleaning" ? "bg-cyan-950/60 border-cyan-500 text-white" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
              <Filter className={`w-5 h-5 ${processStep === "cleaning" ? "animate-bounce text-cyan-400" : ""}`} />
              <div>
                <p className="font-bold">1. Cleaning Data</p>
                <p className="text-[10px]">Pembersihan data kosong & duplikat</p>
              </div>
            </div>

            {/* TRANSFORMASI */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${processStep === "transforming" ? "bg-cyan-950/60 border-cyan-500 text-white" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
              <Binary className={`w-5 h-5 ${processStep === "transforming" ? "animate-bounce text-cyan-400" : ""}`} />
              <div>
                <p className="font-bold">2. Transformasi Data</p>
                <p className="text-[10px]">Kategorisasi & Ordinal Encoding</p>
              </div>
            </div>

            {/* SIMPAN DB */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${processStep === "saving" ? "bg-cyan-950/60 border-cyan-500 text-white" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
              <HardDrive className={`w-5 h-5 ${processStep === "saving" ? "animate-bounce text-cyan-400" : ""}`} />
              <div>
                <p className="font-bold">3. Menyimpan Hasil</p>
                <p className="text-[10px]">Menyimpan matriks ke Database</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔵 STEP 3: HASIL PREPROCESSING YANG SUDAH TERSIMPAN DI DATABASE */}
      {summaryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
              <p className="text-gray-400 text-xs font-semibold uppercase">Total Data Mentah</p>
              <p className="text-2xl font-bold text-white mt-1">{summaryData.total_raw || 2000}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
              <p className="text-gray-400 text-xs font-semibold uppercase">Jumlah Data Bersih</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summaryData.total_clean || 2000}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
              <p className="text-gray-400 text-xs font-semibold uppercase">Status Penyimpanan DB</p>
              <p className="text-sm font-bold text-cyan-400 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Tersimpan di Database
              </p>
            </div>
          </div>

          {/* TABEL HASIL ENCODING */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Data Hasil Preprocessing
              </h3>
              <button
                onClick={handleDownloadCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Hasil Preprocessing (CSV)</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-gray-950 text-gray-300 uppercase border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Kehadiran</th>
                    <th className="px-4 py-3">Nilai</th>
                    <th className="px-4 py-3">Pelanggaran</th>
                    <th className="px-4 py-3">Pekerjaan Ortu</th>
                    <th className="px-4 py-3">Penghasilan Ortu</th>
                    <th className="px-4 py-3">Status Ortu</th>
                    <th className="px-4 py-3">Status SPP</th>
                    <th className="px-4 py-3 text-emerald-400">Risiko Drop-Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 font-mono">
                  {paginatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="px-4 py-3 text-cyan-400">{row.kategori_kehadiran ?? 1}</td>
                      <td className="px-4 py-3 text-cyan-400">{row.kategori_nilai ?? 2}</td>
                      <td className="px-4 py-3 text-cyan-400">{row.kategori_pelanggaran ?? 0}</td>
                      <td className="px-4 py-3 text-cyan-400">{row.pekerjaan_orang_tua ?? 2}</td>
                      <td className="px-4 py-3 text-cyan-400">{row.penghasilan_orang_tua ?? 1}</td>
                      <td className="px-4 py-3 text-cyan-400">{row.status_orang_tua ?? 0}</td>
                      <td className="px-4 py-3 text-cyan-400">{row.status_spp ?? 0}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">{row["Risiko Drop-Out"] ?? row.kategori_risiko ?? "Sedang"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-950/50">
                <span className="text-xs text-gray-500">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, preprocessedList.length)} dari {preprocessedList.length} data
                </span>
                <div className="flex items-center gap-6">
                  {/* Lompat Halaman */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 font-medium">Halaman:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) {
                          setCurrentPage(val);
                        }
                      }}
                      className="w-14 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-center text-white focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-gray-500">/ {totalPages}</span>
                  </div>

                  {/* Tombol Navigasi */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 rounded-lg transition-colors border border-gray-700"
                      title="Halaman Pertama"
                    >
                      « Awal
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-gray-700"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-gray-700"
                    >
                      Selanjutnya
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 rounded-lg transition-colors border border-gray-700"
                      title="Halaman Terakhir"
                    >
                      Akhir »
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}