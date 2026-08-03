"use client";

import { ClipboardList, Filter, Download } from "lucide-react";

export default function HasilPrediksiPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-blue-500" />
              Hasil Prediksi
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Laporan hasil perhitungan algoritma hybrid untuk prediksi risiko drop-out siswa.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm">
              <Download className="w-4 h-4" />
              Export Laporan
            </button>
          </div>
        </header>

        {/* Content Placeholder */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm transition-colors duration-300">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Data Hasil Prediksi</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Halaman ini nantinya akan menampilkan detail hasil perhitungan dari algoritma hybrid.
              Saat ini data sedang disiapkan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
