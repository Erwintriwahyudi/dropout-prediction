"use client";

import { Cpu } from "lucide-react";

export default function ProsesAlgoritmaPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-blue-500" />
            Proses Algoritma
          </h1>
          <p className="text-gray-400 mt-2">Halaman ini akan menampilkan penjelasan mengenai proses dari algoritma prediksi yang digunakan.</p>
        </header>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
          <Cpu className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <h2 className="text-xl font-medium text-white mb-2">Segera Hadir</h2>
          <p>Fitur penjelasan step-by-step pemrosesan data dengan algoritma prediksi sedang dalam pengembangan.</p>
        </div>
      </div>
    </div>
  );
}
