import os
import joblib
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
from models import db, Siswa, HasilProsesC45, HasilPrediksiSiswaBerisiko
from routes.c45 import get_c45_dataset, FEATURE_NAMES, TARGET_COL
from ml.predict import load_models, _build_feature_row, _compute_hybrid_proba, categorize_inputs

hybrid_bp = Blueprint("hybrid", __name__)

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")
MODEL_C45_PATH = os.path.join(BASE_DIR, "models", "model_c45.pkl")
MODEL_NB_PATH = os.path.join(BASE_DIR, "models", "model_naive_bayes.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "models", "encoder.pkl")

# File flag for tracking if hybrid has been processed
HYBRID_FLAG_PATH = os.path.join(BASE_DIR, "models", "hybrid_processed.flag")

@hybrid_bp.route("/hybrid/process", methods=["POST"])
def process_hybrid():
    try:
        data = request.get_json(silent=True) or {}
        id_hasil_c45 = data.get("id_hasil_c45")

        if not id_hasil_c45:
            # Auto-fetch the latest C4.5
            latest_c45 = HasilProsesC45.query.order_by(HasilProsesC45.id_hasil_c45.desc()).first()
            if not latest_c45:
                return jsonify({"error": "Harap jalankan proses C4.5 terlebih dahulu."}), 400
            id_hasil_c45 = latest_c45.id_hasil_c45

        logs = []
        logs.append("Mulai proses Hybrid...")
        logs.append("Menggabungkan hasil C4.5 dan Probabilitas Naive Bayes...")

        # Load models
        load_models()

        # Update predictions for all students in the database using the hybrid model
        students = Siswa.query.all()
        for s in students:
            # Prep inputs
            keh_raw = max(0, 240 - (s.jumlah_absensi or 0))
            nil_raw = s.nilai_rata or 0.0
            pel_raw = s.jumlah_pelanggaran or 0
            
            kat_keh, kat_nil, kat_pel = categorize_inputs(keh_raw, nil_raw, pel_raw)
            
            predict_input = {
                'kategori_kehadiran': kat_keh,
                'kategori_nilai': kat_nil,
                'kategori_pelanggaran': kat_pel,
                'pekerjaan_orang_tua': s.pekerjaan_ortu or "Wiraswasta",
                'penghasilan_orang_tua': s.penghasilan_ortu or "Rp 2.000.000 - Rp 5.000.000",
                'status_spp': s.status_spp or "Lancar",
                'status_orang_tua': s.status_ortu or "Lengkap",
            }
            
            feature_row = _build_feature_row(predict_input)
            _, status_risiko, proba_dict = _compute_hybrid_proba(feature_row)
            winning_prob = float(proba_dict.get(status_risiko, 0.0))

            # 1. Update Siswa
            s.risiko_dropout = status_risiko

            # 2. Save/Update HasilPrediksiSiswaBerisiko
            pred_record = HasilPrediksiSiswaBerisiko.query.filter_by(data_id=s.data_id).first()
            if pred_record:
                pred_record.kategori_risiko = status_risiko
                pred_record.skor_probabilitas = winning_prob
            else:
                pred_record = HasilPrediksiSiswaBerisiko(
                    data_id=s.data_id,
                    siswa_id=s.siswa_id,
                    kategori_risiko=status_risiko,
                    skor_probabilitas=winning_prob
                )
                db.session.add(pred_record)

        logs.append("Menghitung matriks evaluasi...")
        # Evaluasi Hybrid model (accuracy, precision, recall, f1)
        df_clean = get_c45_dataset()
        X = df_clean[FEATURE_NAMES]
        y = df_clean[TARGET_COL]

        # Simpan bendera status proses hybrid
        with open(HYBRID_FLAG_PATH, "w") as f:
            f.write(str(id_hasil_c45))

        db.session.commit()
        logs.append("Menyimpan hasil akhir hybrid ke database...")
        logs.append("Selesai")

        return jsonify({
            "status": "success",
            "message": "Proses Hybrid berhasil diselesaikan.",
            "logs": logs
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

@hybrid_bp.route("/hybrid/results", methods=["GET"])
def get_hybrid_results():
    try:
        if not os.path.exists(HYBRID_FLAG_PATH):
            return jsonify({
                "error": "Hasil Hybrid belum tersedia. Harap jalankan proses Hybrid terlebih dahulu.",
                "model_ready": False
            }), 404

        # Load models
        load_models()
        c45_model = joblib.load(MODEL_C45_PATH)
        nb_model = joblib.load(MODEL_NB_PATH)
        encoder = joblib.load(ENCODER_PATH)

        df_clean = get_c45_dataset()
        X = df_clean[FEATURE_NAMES]
        y = df_clean[TARGET_COL]
        X_encoded = encoder.transform(X)

        # Evaluasi
        class_counts = y.value_counts()
        use_stratify = (class_counts >= 2).all() and len(df_clean) >= 5

        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y,
            test_size=0.2,
            random_state=42,
            stratify=y if use_stratify else None
        )

        class_names = list(nb_model.classes_)

        # Hitung prediksi untuk test set menggunakan C4.5
        c45_pred = c45_model.predict(X_test)
        c45_acc = round(accuracy_score(y_test, c45_pred) * 100, 2)

        # Hitung prediksi untuk test set menggunakan Naive Bayes
        nb_pred = nb_model.predict(X_test)
        nb_acc = round(accuracy_score(y_test, nb_pred) * 100, 2)

        # Hitung prediksi untuk test set menggunakan Hybrid (Soft Voting)
        hybrid_preds = []
        c45_probas = c45_model.predict_proba(X_test)
        nb_probas = nb_model.predict_proba(X_test)

        for i in range(len(X_test)):
            hybrid_proba = (c45_probas[i] + nb_probas[i]) / 2.0
            pred_idx = np.argmax(hybrid_proba)
            hybrid_preds.append(class_names[pred_idx])

        # Metrik Hybrid
        accuracy = round(accuracy_score(y_test, hybrid_preds) * 100, 2)
        precision = round(precision_score(y_test, hybrid_preds, average="weighted", zero_division=0) * 100, 2)
        recall = round(recall_score(y_test, hybrid_preds, average="weighted", zero_division=0) * 100, 2)
        f1 = round(f1_score(y_test, hybrid_preds, average="weighted", zero_division=0) * 100, 2)

        # Confusion Matrix Hybrid
        cm = confusion_matrix(y_test, hybrid_preds, labels=class_names)
        cm_data = []
        for i, row in enumerate(cm):
            for j, val in enumerate(row):
                cm_data.append({
                    "actual": class_names[i],
                    "predicted": class_names[j],
                    "count": int(val)
                })

        return jsonify({
            "model_ready": True,
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1_score": f1,
            },
            "class_names": class_names,
            "confusion_matrix": cm_data,
            "comparisons": [
                {"label": "C4.5 Decision Tree", "value": c45_acc, "color": "bg-amber-500"},
                {"label": "Naive Bayes Classifier", "value": nb_acc, "color": "bg-purple-500"},
                {"label": "Hybrid Model (C4.5 + NB)", "value": accuracy, "color": "bg-emerald-500", "highlight": True}
            ]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
