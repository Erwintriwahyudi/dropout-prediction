"""
Route: /api/preprocessing
Membaca dataset asli, membersihkan data, dan melakukan encoding ordinal.
Mengembalikan statistik dan preview data ter-encode.
"""

import os
import pandas as pd
from flask import Blueprint, jsonify, request
from models import Siswa
from ml.predict import categorize_inputs

preprocessing_bp = Blueprint("preprocessing", __name__)

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "..", "ml", "data_siswa_arridho_lengkap_v3.csv"
)

FEATURE_COLS = [
    "Kategori Kehadiran",
    "Kategori Nilai",
    "Kategori Pelanggaran",
    "Pekerjaan Orang Tua",
    "Penghasilan Orang Tua",
    "Status SPP",
    "Status Orang Tua",
]
TARGET_COL = "Risiko Drop-Out"


@preprocessing_bp.route("/preprocessing/results", methods=["GET"])
@preprocessing_bp.route("/preprocessing/process", methods=["POST"])
def get_preprocessing_stats():
    try:
        logs = []
        logs.append("Memulai preprocessing data...")

        # ── 1. Load dataset ────────────────────────────────────────────────
        # Ambil source dari JSON body atau form-data (multipart)
        source = "db_master"
        if request.method == "POST":
            if request.is_json and request.json:
                source = request.json.get("source", "db_master")
            elif request.form:
                source = request.form.get("source", "db_master")

        if source == "db_master":
            students = Siswa.query.all()
            total_raw = len(students)
            logs.append(f"Data diambil dari Database Master. Total: {total_raw}")
            
            data = []
            for s in students:
                keh_raw = max(0, 240 - (s.jumlah_absensi or 0))
                nil_raw = s.nilai_rata or 0.0
                pel_raw = s.jumlah_pelanggaran or 0
                
                kat_keh, kat_nil, kat_pel = categorize_inputs(keh_raw, nil_raw, pel_raw)
                
                data.append({
                    "Kategori Kehadiran": kat_keh,
                    "Kategori Nilai": kat_nil,
                    "Kategori Pelanggaran": kat_pel,
                    "Pekerjaan Orang Tua": s.pekerjaan_ortu or "Wiraswasta",
                    "Penghasilan Orang Tua": s.penghasilan_ortu or "Rp 2.000.000 - Rp 5.000.000",
                    "Status SPP": s.status_spp or "Lancar",
                    "Status Orang Tua": s.status_ortu or "Lengkap",
                    "Risiko Drop-Out": s.risiko_dropout or "Belum Diprediksi"
                })
            df = pd.DataFrame(data)
        else:
            # Coba ambil file yang di-upload (multipart/form-data)
            uploaded_file = request.files.get("file")
            if uploaded_file and uploaded_file.filename.endswith(".csv"):
                import io
                df = pd.read_csv(io.StringIO(uploaded_file.stream.read().decode("utf-8", errors="replace")))
                logs.append(f"File CSV '{uploaded_file.filename}' berhasil dimuat.")
                
                # Validasi kolom yang diperlukan ada di CSV
                missing_cols = [c for c in FEATURE_COLS if c not in df.columns]
                if missing_cols:
                    return jsonify({
                        "error": f"Kolom berikut tidak ditemukan dalam CSV: {', '.join(missing_cols)}. "
                                 f"Pastikan CSV memiliki kolom: {', '.join(FEATURE_COLS)}",
                        "logs": logs
                    }), 400
            elif os.path.exists(DATASET_PATH):
                df = pd.read_csv(DATASET_PATH)
                logs.append(f"Menggunakan dataset CSV default: {os.path.basename(DATASET_PATH)}")
            else:
                logs.append("[ERROR] Tidak ada file yang di-upload dan dataset default tidak ditemukan.")
                return jsonify({"error": "File CSV tidak ditemukan", "logs": logs}), 404

            total_raw = len(df)
            logs.append(f"Dataset CSV dimuat. Total baris awal: {total_raw}")

        # ── 2. Hitung missing values ───────────────────────────────────────
        missing_count = int(df.isnull().sum().sum())
        # Hanya dropna pada kolom yang ada
        cols_to_check = [c for c in FEATURE_COLS + [TARGET_COL] if c in df.columns]
        df_clean = df.dropna(subset=cols_to_check)
        # Jika TARGET_COL tidak ada, tambahkan default
        if TARGET_COL not in df_clean.columns:
            df_clean = df_clean.copy()
            df_clean[TARGET_COL] = "Tidak Diketahui"
        total_raw = len(df)
        total_clean = len(df_clean)
        logs.append(f"Pembersihan selesai. Missing values dihapus: {missing_count}. Data bersih: {total_clean}")

        # ── 3. Pelatihan Model Baru (jika POST / proses baru dijalankan) ──
        if request.method == "POST":
            from ml.train import train_model_from_df
            logs.append("Menjalankan pelatihan ulang model C4.5 & Naïve Bayes...")
            trained = train_model_from_df(df_clean)
            if trained:
                logs.append("[SUKSES] Model & encoder baru berhasil dilatih dengan data terbaru.")
            else:
                logs.append("[WARNING] Data terlalu sedikit (< 5 baris) untuk melatih model baru. Menggunakan model default.")

        # ── 4. Transformasi Data (Encoding) ──────────────────────────────
        # PENTING: Gunakan encoder yang sama dengan model prediksi (encoder.pkl)
        # agar hasil encoding di halaman ini konsisten dengan hasil di modal siswa.
        import joblib
        encoder_path = os.path.join(os.path.dirname(__file__), "..", "ml", "models", "encoder.pkl")
        
        if not os.path.exists(encoder_path):
            # Fallback: buat encoder baru dari data jika encoder.pkl belum ada
            from sklearn.preprocessing import OrdinalEncoder
            logs.append("[WARNING] encoder.pkl tidak ditemukan, menggunakan OrdinalEncoder baru (hasil mungkin berbeda).")
            encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
            X = df_clean[FEATURE_COLS]
            y = df_clean[TARGET_COL]
            X_encoded = encoder.fit_transform(X)
        else:
            logs.append("Menggunakan encoder terlatih dari model (encoder.pkl) untuk konsistensi.")
            encoder = joblib.load(encoder_path)
            X = df_clean[FEATURE_COLS]
            y = df_clean[TARGET_COL]
            # transform (bukan fit_transform) agar urutan encoding konsisten
            X_encoded = encoder.transform(X)

        # ── 4. Generate Data Preview (ALL rows for client-side pagination) ──────
        data_preview = []
        for i, row in enumerate(X_encoded):
            row_dict = {FEATURE_COLS[j]: round(float(val), 2) for j, val in enumerate(row)}
            row_dict[TARGET_COL] = str(y.iloc[i])
            
            # Add camelCase/snake_case aliases to match frontend table mapping
            # "Kategori Kehadiran" -> "kategori_kehadiran"
            row_dict["kategori_kehadiran"] = row_dict.get("Kategori Kehadiran")
            row_dict["kategori_nilai"] = row_dict.get("Kategori Nilai")
            row_dict["kategori_pelanggaran"] = row_dict.get("Kategori Pelanggaran")
            row_dict["pekerjaan_orang_tua"] = row_dict.get("Pekerjaan Orang Tua")
            row_dict["penghasilan_orang_tua"] = row_dict.get("Penghasilan Orang Tua")
            row_dict["status_orang_tua"] = row_dict.get("Status Orang Tua")
            row_dict["status_spp"] = row_dict.get("Status SPP")
            
            data_preview.append(row_dict)

        # ── 5. Info pipeline preprocessing ────────────────────────────────
        pipeline_info = [
            {
                "step": 1,
                "nama": "Pembersihan Data",
                "deskripsi": "Menghapus baris dengan nilai kosong (missing values) atau data duplikat yang tidak valid.",
                "detail": f"Total data awal: {total_raw} | Data bersih: {total_clean}",
                "icon": "clean",
            },
            {
                "step": 2,
                "nama": "Transformasi Data",
                "deskripsi": "Mengubah data kategorikal (teks) menjadi nilai numerik menggunakan metode Ordinal Encoding.",
                "detail": "OrdinalEncoder(handle_unknown='use_encoded_value')",
                "icon": "encode",
            },
            {
                "step": 3,
                "nama": "Pembagian Data",
                "deskripsi": "Membagi dataset bersih menjadi kelompok data latih (Train) dan data uji (Test).",
                "detail": f"Rasio Split: 80% Latih, 20% Uji | Stratify=True",
                "icon": "split",
            },
        ]

        return jsonify({
            "summary": {
                "total_data_awal": total_raw,
                "data_missing": missing_count,
                "total_data_bersih": total_clean,
                "total_raw": total_raw,
                "total_clean": total_clean,
                "jumlah_fitur": len(FEATURE_COLS),
            },
            "fitur": FEATURE_COLS,
            "pipeline_info": pipeline_info,
            "data": data_preview,
            "logs": logs
        })

    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

@preprocessing_bp.route("/preprocessing/export-csv", methods=["GET"])
def export_preprocessing_csv():
    try:
        if not os.path.exists(DATASET_PATH):
            return jsonify({"error": "Dataset tidak ditemukan"}), 404

        df = pd.read_csv(DATASET_PATH)
        df_clean = df.dropna(subset=FEATURE_COLS + [TARGET_COL])

        from sklearn.preprocessing import OrdinalEncoder
        encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
        
        X = df_clean[FEATURE_COLS]
        y = df_clean[TARGET_COL]
        X_encoded = encoder.fit_transform(X)
        
        # Create a new DataFrame for the encoded data
        encoded_df = pd.DataFrame(X_encoded, columns=FEATURE_COLS)
        encoded_df[TARGET_COL] = y.values
        
        # Convert to CSV
        csv_data = encoded_df.to_csv(index=False)
        
        from flask import Response
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=data_preprocessing_bersih.csv"}
        )

    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
