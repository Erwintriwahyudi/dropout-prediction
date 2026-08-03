import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';

import { getPredictionDetail, savePrediction } from '../services/predict';

interface PredictionResult {
    data_raw: Record<string, string>;
    data_encoded: Record<string, number>;
    prediction_detail: {
        status_risiko: string;
        probabilitas: {
            'Risiko Rendah'?: number;
            'Risiko Sedang'?: number;
            'Risiko Tinggi'?: number;
        };
        rules: string[];
        rule_summary: string;
    };
}

export default function FormSimulasiPrediksi() {
    const [formData, setFormData] = useState({
        nisn: '',
        nama_siswa: '',
        kelas: '',
        tahun_ajaran: '2026/2027',
        jumlah_kehadiran: 220,
        nilai_rata_rata: 80.0,
        jumlah_pelanggaran: 0,
        pekerjaan_orang_tua: 'Buruh/Petani',
        penghasilan_orang_tua: 'Rp 2.000.000 - Rp 5.000.000',
        status_spp: 'Lancar',
        status_orang_tua: 'Lengkap',
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name.includes('jumlah') || name.includes('nilai') ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const data = await getPredictionDetail(formData);
            setResult(data);
        } catch (err: any) {
            alert(err.message || 'Terjadi kesalahan koneksi ke server backend ML.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);
        try {
            // Kita ambil probabilitas dari class status_risiko yang diprediksi
            const riskProb = result.prediction_detail.probabilitas[`Risiko ${result.prediction_detail.status_risiko}` as keyof typeof result.prediction_detail.probabilitas] || 0;
            
            await savePrediction({
                nisn: formData.nisn || '0000000000',
                nama: formData.nama_siswa,
                kelas: formData.kelas,
                tahun_ajaran: formData.tahun_ajaran,
                jumlah_kehadiran: formData.jumlah_kehadiran,
                rata_rata_nilai: formData.nilai_rata_rata,
                jumlah_pelanggaran: formData.jumlah_pelanggaran,
                pekerjaan_ortu: formData.pekerjaan_orang_tua,
                penghasilan_ortu: formData.penghasilan_orang_tua,
                status_spp: formData.status_spp,
                status_ortu: formData.status_orang_tua,
                status_risiko: result.prediction_detail.status_risiko,
                probabilitas: riskProb,
            });
            alert('Prediksi berhasil disimpan ke database!');
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan prediksi.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setFormData({
            nisn: '',
            nama_siswa: '',
            kelas: '',
            tahun_ajaran: '2026/2027',
            jumlah_kehadiran: 220,
            nilai_rata_rata: 80.0,
            jumlah_pelanggaran: 0,
            pekerjaan_orang_tua: 'Buruh/Petani',
            penghasilan_orang_tua: 'Rp 2.000.000 - Rp 5.000.000',
            status_spp: 'Lancar',
            status_orang_tua: 'Lengkap',
        });
        setResult(null);
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <Play className="w-5 h-5 text-indigo-400" /> Form Simulasi Prediksi Dropout Siswa
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                    Khusus akses **Wali Kelas** & **Admin**. Masukkan indikator siswa untuk menguji klasifikasi hybrid C4.5 + Naive Bayes.
                </p>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Identitas Siswa */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">NISN</label>
                            <input
                                type="text"
                                name="nisn"
                                value={formData.nisn}
                                onChange={handleChange}
                                placeholder="Contoh: 0041234567"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nama Siswa</label>
                            <input
                                type="text"
                                name="nama_siswa"
                                value={formData.nama_siswa}
                                onChange={handleChange}
                                placeholder="Contoh: Titin Novitasari"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Kelas</label>
                            <input
                                type="text"
                                name="kelas"
                                value={formData.kelas}
                                onChange={handleChange}
                                placeholder="Contoh: 7A"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tahun Ajaran</label>
                            <input
                                type="text"
                                name="tahun_ajaran"
                                value={formData.tahun_ajaran}
                                onChange={handleChange}
                                placeholder="Contoh: 2026/2027"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Indikator Akademik & Perilaku */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Jumlah Kehadiran <span className="text-slate-500 text-[10px]">(≥220: Sangat Baik, 200-219: Baik, &lt;200: Kurang)</span>
                        </label>
                        <input
                            type="number"
                            name="jumlah_kehadiran"
                            value={formData.jumlah_kehadiran}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Nilai Rata-rata <span className="text-slate-500 text-[10px]">(≥85: Tinggi, 75-84: Sedang, &lt;75: Rendah)</span>
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            name="nilai_rata_rata"
                            value={formData.nilai_rata_rata}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Jumlah Pelanggaran <span className="text-slate-500 text-[10px]">(0: Tidak Ada, 1-2: Ringan, &gt;2: Sedang/Berat)</span>
                        </label>
                        <input
                            type="number"
                            name="jumlah_pelanggaran"
                            value={formData.jumlah_pelanggaran}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* Indikator Sosial Ekonomi */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Pekerjaan Orang Tua</label>
                        <select
                            name="pekerjaan_orang_tua"
                            value={formData.pekerjaan_orang_tua}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="Buruh/Petani">Buruh/Petani</option>
                            <option value="Karyawan Swasta">Karyawan Swasta</option>
                            <option value="PNS/TNI/Polri">PNS/TNI/Polri</option>
                            <option value="Tidak Bekerja">Tidak Bekerja</option>
                            <option value="Wiraswasta">Wiraswasta</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Penghasilan Orang Tua</label>
                        <select
                            name="penghasilan_orang_tua"
                            value={formData.penghasilan_orang_tua}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="< Rp 2.000.000">&lt; Rp 2.000.000</option>
                            <option value="Rp 2.000.000 - Rp 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                            <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status SPP</label>
                        <select
                            name="status_spp"
                            value={formData.status_spp}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="Lancar">Lancar</option>
                            <option value="Menunggak 1-2 Bulan">Menunggak 1-2 Bulan</option>
                            <option value="Menunggak >2 Bulan">Menunggak &gt;2 Bulan</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status Orang Tua</label>
                        <select
                            name="status_orang_tua"
                            value={formData.status_orang_tua}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="Lengkap">Lengkap</option>
                            <option value="Yatim">Yatim</option>
                            <option value="Piatu">Piatu</option>
                            <option value="Yatim Piatu">Yatim Piatu</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg flex items-center gap-2 transition"
                        >
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition"
                        >
                            {loading ? 'Memproses...' : <><Play className="w-4 h-4" /> Jalankan Prediksi</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Result Display Box */}
            {result && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl animate-fade-in">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Eye className="w-5 h-5 text-emerald-400" /> Hasil Simulasi: {formData.nama_siswa || 'Siswa'} ({formData.kelas || 'S-00X'})
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.prediction_detail.status_risiko === 'Tinggi' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                result.prediction_detail.status_risiko === 'Sedang' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                            Risiko {result.prediction_detail.status_risiko}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(result.prediction_detail.probabilitas).map(([key, val]) => (
                            <div key={key} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <p className="text-xs text-slate-400 font-semibold">{key}</p>
                                <p className="text-2xl font-black text-white mt-1">{val}%</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
                        <span className="font-bold text-indigo-400">Ringkasan Rule C4.5:</span> {result.prediction_detail.rule_summary}
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition shadow-lg shadow-emerald-900/50"
                        >
                            {saving ? 'Menyimpan...' : <><CheckCircle2 className="w-4 h-4" /> Simpan Prediksi</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}