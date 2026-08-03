import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';

export interface Siswa {
    id: number;
    siswa_id: string;
    nisn: string;
    nama: string;
    kelas: string;
    kategori_kehadiran: string;
    kategori_nilai: string;
    kategori_pelanggaran: string;
    jumlah_kehadiran?: number;
    persentase_kehadiran?: number;
    rata_rata_nilai?: number;
    jumlah_pelanggaran?: number;
    status_risiko: string;
}

interface TabelSiswaProps {
    dataSiswa: Siswa[];
    onView?: (siswa: Siswa) => void;
    onEdit?: (siswa: Siswa) => void;
    onDelete?: (siswa: Siswa) => void;
    isLoading?: boolean;
}

export const TabelSiswa: React.FC<TabelSiswaProps> = ({
    dataSiswa,
    onView,
    onEdit,
    onDelete,
    isLoading = false,
}) => {
    // Styling Badge Kategori
    const getKehadiranBadgeClass = (val: string) => {
        switch (val?.toLowerCase()) {
            case 'sangat baik':
            case 'baik':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'sedang':
            case 'cukup':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            default:
                return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
        }
    };

    const getNilaiBadgeClass = (val: string) => {
        switch (val?.toLowerCase()) {
            case 'tinggi':
            case 'baik':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'sedang':
            case 'cukup':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            default:
                return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
        }
    };

    const getPelanggaranBadgeClass = (val: string) => {
        switch (val?.toLowerCase()) {
            case 'tidak ada':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'ringan':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            default:
                return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
        }
    };

    const getRisikoBadgeClass = (val: string) => {
        switch (val?.toLowerCase()) {
            case 'rendah':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold';
            case 'sedang':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold';
            case 'tinggi':
                return 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-semibold';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    if (isLoading) {
        return (
            <div className="w-full py-12 text-center text-gray-400 font-mono">
                Memuat data siswa...
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
            <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    <tr>
                        <th className="px-4 py-3.5 text-center">ID</th>
                        <th className="px-4 py-3.5">Nama</th>
                        <th className="px-4 py-3.5">NISN</th>
                        <th className="px-4 py-3.5 text-center">Kelas</th>
                        <th className="px-4 py-3.5 text-center">Kehadiran</th>
                        <th className="px-4 py-3.5 text-center">Nilai</th>
                        <th className="px-4 py-3.5 text-center">Pelanggaran</th>
                        <th className="px-4 py-3.5 text-center">Hasil Prediksi</th>
                        <th className="px-4 py-3.5 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {dataSiswa.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                Tidak ada data siswa ditemukan.
                            </td>
                        </tr>
                    ) : (
                        dataSiswa.map((siswa) => (
                            <tr
                                key={siswa.id || siswa.siswa_id}
                                className="hover:bg-slate-800/40 transition-colors"
                            >
                                {/* ID */}
                                <td className="px-4 py-3 text-center font-mono text-xs">
                                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                                        {siswa.siswa_id}
                                    </span>
                                </td>

                                {/* NAMA */}
                                <td className="px-4 py-3 font-medium text-white">{siswa.nama}</td>

                                {/* NISN */}
                                <td className="px-4 py-3 font-mono text-xs text-gray-400">{siswa.nisn}</td>

                                {/* KELAS */}
                                <td className="px-4 py-3 text-center">
                                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        {siswa.kelas}
                                    </span>
                                </td>

                                {/* 1. KOLOM KEHADIRAN */}
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getKehadiranBadgeClass(siswa.kategori_kehadiran)}`}>
                                        {siswa.kategori_kehadiran}
                                    </span>
                                    <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                        {siswa.jumlah_kehadiran !== undefined && siswa.jumlah_kehadiran !== null
                                            ? `${siswa.jumlah_kehadiran} Hari`
                                            : siswa.persentase_kehadiran !== undefined && siswa.persentase_kehadiran !== null
                                                ? `${siswa.persentase_kehadiran}%`
                                                : '-'}
                                    </div>
                                </td>

                                {/* 2. KOLOM NILAI */}
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getNilaiBadgeClass(siswa.kategori_nilai)}`}>
                                        {siswa.kategori_nilai}
                                    </span>
                                    <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                        {siswa.rata_rata_nilai !== undefined && siswa.rata_rata_nilai !== null
                                            ? `Nilai: ${siswa.rata_rata_nilai}`
                                            : '-'}
                                    </div>
                                </td>

                                {/* 3. KOLOM PELANGGARAN */}
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getPelanggaranBadgeClass(siswa.kategori_pelanggaran)}`}>
                                        {siswa.kategori_pelanggaran}
                                    </span>
                                    <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                        {siswa.jumlah_pelanggaran !== undefined && siswa.jumlah_pelanggaran !== null
                                            ? `${siswa.jumlah_pelanggaran} Kali`
                                            : '-'}
                                    </div>
                                </td>

                                {/* HASIL PREDIKSI */}
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full ${getRisikoBadgeClass(siswa.status_risiko)}`}>
                                        {siswa.status_risiko}
                                    </span>
                                </td>

                                {/* AKSI */}
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center space-x-2 text-gray-400">
                                        {onView && (
                                            <button
                                                onClick={() => onView(siswa)}
                                                className="p-1 hover:text-sky-400 hover:bg-sky-500/10 rounded transition-colors"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(siswa)}
                                                className="p-1 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                                                title="Edit Data"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(siswa)}
                                                className="p-1 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                                title="Hapus Data"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TabelSiswa;