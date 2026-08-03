"""
Route: /api/c45
Membaca model C4.5 yang sudah dilatih dan mengembalikan:
- Metrik evaluasi (accuracy, precision, recall, f1, max_depth, total rules)
- Semua aturan IF-THEN yang diekstraksi dari pohon keputusan
- Data distribusi kelas untuk chart
- Perhitungan Entropy, Gain, & Gain Ratio Tiap Atribut sesuai Bab IV Skripsi
"""

import os
import joblib
import numpy as np
import pandas as pd
import math
from flask import Blueprint, jsonify, request
from sklearn.tree import _tree
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.model_selection import train_test_split
from models import db, Siswa, HasilPreprocessingData, HasilProsesC45

c45_bp = Blueprint("c45", __name__)

FEATURE_NAMES = [
    "Kategori Kehadiran",
    "Kategori Nilai",
    "Kategori Pelanggaran",
    "Pekerjaan Orang Tua",
    "Penghasilan Orang Tua",
    "Status SPP",
    "Status Orang Tua",
]
TARGET_COL = "Risiko Drop-Out"

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")
DATASET_PATH = os.path.join(BASE_DIR, "data_siswa_arridho_lengkap_v3.csv")
MODEL_C45_PATH = os.path.join(BASE_DIR, "models", "model_c45.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "models", "encoder.pkl")
UPLOADED_DATASET_PATH = os.path.join(BASE_DIR, "models", "last_uploaded_c45_dataset.csv")


def calculate_gain_ratios(df, feature_cols, target_col):
    """
    Menghitung Entropy, Gain, Split Info, dan Gain Ratio 
    untuk tiap atribut sesuai dengan rumus algoritma C4.5.
    """
    total_samples = len(df)
    if total_samples == 0:
        return 0.0, {}, []

    # 1. Entropy Total
    target_counts = df[target_col].value_counts()
    entropy_total = 0.0
    for count in target_counts:
        p = count / total_samples
        if p > 0:
            entropy_total -= p * math.log2(p)

    attribute_stats = []
    
    # 2. Entropy, Gain, & Gain Ratio tiap Atribut
    for col in feature_cols:
        col_counts = df[col].value_counts()
        split_info = 0.0
        entropy_attr = 0.0

        for val, count in col_counts.items():
            p_val = count / total_samples
            if p_val > 0:
                split_info -= p_val * math.log2(p_val)

            # Subset entropy
            subset = df[df[col] == val]
            subset_len = len(subset)
            subset_counts = subset[target_col].value_counts()
            subset_entropy = 0.0
            
            for s_count in subset_counts:
                p_s = s_count / subset_len
                if p_s > 0:
                    subset_entropy -= p_s * math.log2(p_s)
            
            entropy_attr += p_val * subset_entropy

        gain = entropy_total - entropy_attr
        gain_ratio = gain / split_info if split_info > 0 else 0.0

        attribute_stats.append({
            "attribute": col,
            "entropy": round(entropy_attr, 4),
            "gain": round(gain, 4),
            "split_info": round(split_info, 4),
            "gain_ratio": round(gain_ratio, 4)
        })

    # Urutkan atribut berdasarkan Gain Ratio tertinggi (terbaik untuk root node)
    attribute_stats.sort(key=lambda x: x["gain_ratio"], reverse=True)
    return round(entropy_total, 4), target_counts.to_dict(), attribute_stats


def extract_rules_from_tree(tree_model, feature_names, class_names):
    """
    Mengekstrak semua aturan IF-THEN dari Decision Tree sklearn
    ke dalam format teks yang human-readable.
    """
    tree_ = tree_model.tree_
    rules = []

    def recurse(node, conditions):
        if tree_.feature[node] == _tree.TREE_UNDEFINED:
            class_idx = np.argmax(tree_.value[node][0])
            class_name = class_names[class_idx]
            total_samples = int(tree_.n_node_samples[node])
            class_samples = int(tree_.value[node][0][class_idx])
            confidence = round(class_samples / total_samples * 100, 1) if total_samples > 0 else 0.0

            if conditions:
                rule_text = " AND ".join(conditions)
                rule_text = f"IF {rule_text} THEN Risiko Drop-Out = '{class_name}'"
                rules.append({
                    "text": rule_text,
                    "conclusion": class_name,
                    "confidence": f"{confidence}%",
                    "support": total_samples,
                })
        else:
            feat_idx = tree_.feature[node]
            feat_name = feature_names[feat_idx] if feat_idx < len(feature_names) else f"Fitur[{feat_idx}]"
            threshold = tree_.threshold[node]

            # Cabang kiri (≤ threshold)
            left_cond = conditions + [f"{feat_name} ≤ {threshold:.1f}"]
            recurse(tree_.children_left[node], left_cond)

            # Cabang kanan (> threshold)
            right_cond = conditions + [f"{feat_name} > {threshold:.1f}"]
            recurse(tree_.children_right[node], right_cond)

    recurse(0, [])
    rules.sort(key=lambda r: float(r["confidence"].replace("%", "")), reverse=True)
    return rules


def export_tree_structure(tree_model, feature_names, class_names):
    """
    Serialisasi model decision tree scikit-learn ke struktur JSON nested
    untuk visualisasi interaktif di React frontend.
    """
    tree_ = tree_model.tree_

    def recurse(node, depth):
        if tree_.feature[node] == _tree.TREE_UNDEFINED:
            class_idx = np.argmax(tree_.value[node][0])
            class_name = class_names[class_idx]
            total_samples = int(tree_.n_node_samples[node])
            class_samples = int(tree_.value[node][0][class_idx])
            confidence = round(class_samples / total_samples * 100, 1) if total_samples > 0 else 0.0
            
            return {
                "name": f"Risiko: {class_name}",
                "is_leaf": True,
                "class_name": class_name,
                "samples": total_samples,
                "confidence": f"{confidence}%",
                "depth": depth
            }
        else:
            feat_idx = tree_.feature[node]
            feat_name = feature_names[feat_idx] if feat_idx < len(feature_names) else f"Fitur[{feat_idx}]"
            threshold = tree_.threshold[node]
            
            left_child = recurse(tree_.children_left[node], depth + 1)
            right_child = recurse(tree_.children_right[node], depth + 1)
            
            return {
                "name": feat_name,
                "is_leaf": False,
                "threshold": float(threshold),
                "samples": int(tree_.n_node_samples[node]),
                "depth": depth,
                "children": [
                    {
                        "condition": f"≤ {threshold:.1f}",
                        "node": left_child
                    },
                    {
                        "condition": f"> {threshold:.1f}",
                        "node": right_child
                    }
                ]
            }

    return recurse(0, 0)


def get_c45_dataset():
    """Helper untuk memuat dataset terpreprocessing dari DB atau CSV."""
    # Jika ada dataset CSV yang baru saja diupload oleh admin, gunakan itu.
    if os.path.exists(UPLOADED_DATASET_PATH):
        df = pd.read_csv(UPLOADED_DATASET_PATH)
        df_clean = df.dropna(subset=FEATURE_NAMES)
        if TARGET_COL not in df_clean.columns:
            df_clean = df_clean.copy()
            df_clean[TARGET_COL] = "Sedang"
        return df_clean

    from ml.predict import categorize_inputs
    students = Siswa.query.all()
    db_data = []
    for s in students:
        keh_raw = max(0, 240 - (s.jumlah_absensi or 0))
        nil_raw = s.nilai_rata or 0.0
        pel_raw = s.jumlah_pelanggaran or 0
        kat_keh, kat_nil, kat_pel = categorize_inputs(keh_raw, nil_raw, pel_raw)
        db_data.append({
            "Kategori Kehadiran": kat_keh,
            "Kategori Nilai": kat_nil,
            "Kategori Pelanggaran": kat_pel,
            "Pekerjaan Orang Tua": s.pekerjaan_ortu or "Wiraswasta",
            "Penghasilan Orang Tua": s.penghasilan_ortu or "Rp 2.000.000 - Rp 5.000.000",
            "Status SPP": s.status_spp or "Lancar",
            "Status Orang Tua": s.status_ortu or "Lengkap",
            TARGET_COL: s.risiko_dropout or "Sedang",
        })

    df = pd.DataFrame(db_data)
    if len(df) < 100:
        if os.path.exists(DATASET_PATH):
            df_csv = pd.read_csv(DATASET_PATH)
            df = pd.concat([df_csv, df], ignore_index=True)
            
    df_clean = df.dropna(subset=FEATURE_NAMES)
    if TARGET_COL not in df_clean.columns:
        df_clean = df_clean.copy()
        df_clean[TARGET_COL] = "Sedang"
    return df_clean


@c45_bp.route("/c45/results", methods=["GET"])
def get_c45_results():
    try:
        if not os.path.exists(MODEL_C45_PATH) or not os.path.exists(ENCODER_PATH):
            return jsonify({
                "error": "Model C4.5 belum dilatih. Jalankan proses training terlebih dahulu.",
                "model_ready": False
            }), 404

        c45_model = joblib.load(MODEL_C45_PATH)
        encoder = joblib.load(ENCODER_PATH)

        df_clean = get_c45_dataset()
        X = df_clean[FEATURE_NAMES]
        y = df_clean[TARGET_COL]
        X_encoded = encoder.transform(X)

        # ── Split & Evaluasi Metrik ─────────────────────────────────────
        class_counts = y.value_counts()
        use_stratify = (class_counts >= 2).all() and len(df_clean) >= 5

        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y,
            test_size=0.2,
            random_state=42,
            stratify=y if use_stratify else None
        )
        y_pred = c45_model.predict(X_test)
        class_names = list(c45_model.classes_)

        accuracy  = round(accuracy_score(y_test, y_pred) * 100, 2)
        precision = round(precision_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
        recall    = round(recall_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
        f1        = round(f1_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
        max_depth = int(c45_model.get_depth())

        # ── Ekstraksi Aturan IF-THEN ───────────────────────────────────
        rules = extract_rules_from_tree(c45_model, FEATURE_NAMES, class_names)
        total_rules = len(rules)

        # ── Distribusi kelas untuk chart ───────────────────────────────
        class_distribution = y.value_counts().to_dict()

        # ── Perhitungan Entropy & Gain Ratio ───────────────────────────
        entropy_total, target_counts, gain_ratios = calculate_gain_ratios(df_clean, FEATURE_NAMES, TARGET_COL)

        # ── Classification Report per kelas ────────────────────────────
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        per_class = []
        for cls in class_names:
            if cls in report:
                per_class.append({
                    "class": cls,
                    "precision": round(report[cls]["precision"] * 100, 1),
                    "recall": round(report[cls]["recall"] * 100, 1),
                    "f1": round(report[cls]["f1-score"] * 100, 1),
                    "support": int(report[cls]["support"]),
                })

        return jsonify({
            "model_ready": True,
            "dataset_info": {
                "total_data": len(df_clean),
                "total_training": len(X_train),
                "total_testing": len(X_test),
                "split_ratio": "80:20",
                "fitur": FEATURE_NAMES,
                "kelas": class_names,
            },
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1_score": f1,
                "total_rules": total_rules,
                "max_depth": max_depth,
            },
            "per_class_metrics": per_class,
            "class_distribution": class_distribution,
            "rules": rules,
            "calculation_c45": {
                "entropy_total": entropy_total,
                "target_counts": target_counts,
                "gain_ratios": gain_ratios
            },
            "tree_structure": export_tree_structure(c45_model, FEATURE_NAMES, class_names)
        })

    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@c45_bp.route("/c45/process", methods=["POST"])
def process_c45_training():
    """
    Jalankan proses pembentukan model C4.5
    sesuai langkah-langkah di Activity Diagram.
    Mendukung dua sumber data:
    - db_master: Data siswa dari database
    - csv_upload: File CSV yang diupload admin
    """
    try:
        logs = []
        logs.append("Memulai proses pembentukan Pohon C4.5...")

        # ── Deteksi sumber data (JSON atau form-data) ─────────────────────────
        source = None
        if request.content_type and "multipart/form-data" in request.content_type:
            source = request.form.get("source", "db_master")
        elif request.is_json:
            source = request.get_json(silent=True).get("source", "db_master")
        else:
            source = "db_master"

        # 1. Load dataset terpreprocessing
        if source == "csv_upload":
            # Ambil file dari request
            file = request.files.get("file")
            if not file or not file.filename.endswith(".csv"):
                return jsonify({"error": "File CSV tidak ditemukan atau format tidak valid."}), 400
            
            # Simpan file secara permanen di server untuk dibaca di endpoint GET /results
            file.seek(0)
            file.save(UPLOADED_DATASET_PATH)
            
            df_clean = pd.read_csv(UPLOADED_DATASET_PATH)
            df_clean = df_clean.dropna(subset=FEATURE_NAMES)
            if TARGET_COL not in df_clean.columns:
                df_clean = df_clean.copy()
                df_clean[TARGET_COL] = "Sedang"
            logs.append(f"File CSV diupload & disimpan. Total data bersih: {len(df_clean)} baris.")
        else:
            # Hapus file CSV upload lama jika kembali menggunakan db_master
            if os.path.exists(UPLOADED_DATASET_PATH):
                try:
                    os.remove(UPLOADED_DATASET_PATH)
                except Exception:
                    pass
            df_clean = get_c45_dataset()
            logs.append(f"Memilih dataset preprocessing dari database. Total data: {len(df_clean)} baris.")

        # 2. Menghitung jumlah total kasus tiap kelas
        target_counts = df_clean[TARGET_COL].value_counts().to_dict()
        if len(target_counts) < 2:
            return jsonify({
                "error": f"Dataset hanya memiliki 1 kelas target ({list(target_counts.keys())[0]}). "
                         "Algoritma C4.5 membutuhkan minimal 2 kelas target yang berbeda (misal: Rendah, Sedang, Tinggi) "
                         "untuk membentuk pohon keputusan. Pastikan kolom 'Risiko Drop-Out' pada CSV Anda memiliki variasi data.",
                "logs": logs
            }), 400
        logs.append(f"Menghitung jumlah total kasus tiap kelas: {target_counts}")

        # 3. Menghitung Nilai Entropy Total
        entropy_total, _, gain_ratios = calculate_gain_ratios(df_clean, FEATURE_NAMES, TARGET_COL)
        logs.append(f"Menghitung Nilai Entropy Total: {entropy_total}")

        # 4. Menghitung Entropy, Gain, & Gain Ratio Tiap Atribut
        logs.append("Menghitung Entropy, Gain, & Gain Ratio untuk tiap atribut selesai.")

        # 5. Membentuk Pohon Keputusan & Aturan IF-THEN (Train & save model)
        from ml.train import train_model_from_df
        logs.append("Melatih algoritma C4.5 untuk membentuk pohon keputusan...")
        success = train_model_from_df(df_clean)

        if not success:
            return jsonify({"error": "Gagal melatih model karena data terlalu sedikit.", "logs": logs}), 400

        # 6. Menyimpan Model Pohon Keputusan ke Database
        latest_prep = HasilPreprocessingData.query.order_by(HasilPreprocessingData.id_preprocessing.desc()).first()
        id_prep = latest_prep.id_preprocessing if latest_prep else 1

        new_c45_log = HasilProsesC45(
            id_preprocessing=id_prep,
            atribut_terpilih=", ".join([g["attribute"] for g in gain_ratios[:3]]),
            status_c45="Tersimpan di Database"
        )
        db.session.add(new_c45_log)
        db.session.commit()
        
        logs.append("Menyimpan Model Pohon Keputusan ke database berhasil.")

        return jsonify({
            "status": "success",
            "message": "Proses C4.5 berhasil diselesaikan berdasarkan Activity Diagram.",
            "logs": logs
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

