import os
import joblib
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
from models import db, HasilProsesC45, HasilNaiveBayes
from routes.c45 import get_c45_dataset, FEATURE_NAMES, TARGET_COL

naive_bayes_bp = Blueprint("naive_bayes", __name__)

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")
MODEL_NB_PATH = os.path.join(BASE_DIR, "models", "model_naive_bayes.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "models", "encoder.pkl")

@naive_bayes_bp.route("/naive-bayes/c45-list", methods=["GET"])
def get_c45_list():
    try:
        c45_records = HasilProsesC45.query.order_by(HasilProsesC45.id_hasil_c45.desc()).all()
        list_data = []
        for r in c45_records:
            list_data.append({
                "id_hasil_c45": r.id_hasil_c45,
                "id_preprocessing": r.id_preprocessing,
                "atribut_terpilih": r.atribut_terpilih,
                "status_c45": r.status_c45,
                "created_at": f"Hasil C4.5 #{r.id_hasil_c45} - Prep {r.id_preprocessing}"
            })
        return jsonify(list_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@naive_bayes_bp.route("/naive-bayes/process", methods=["POST"])
def process_naive_bayes():
    try:
        data = request.get_json(silent=True) or {}
        id_hasil_c45 = data.get("id_hasil_c45")

        if not id_hasil_c45:
            return jsonify({"error": "Pilih data hasil C4.5 terlebih dahulu."}), 400

        # Verifikasi data C4.5 ada
        c45_record = HasilProsesC45.query.get(id_hasil_c45)
        if not c45_record:
            return jsonify({"error": "Data hasil C4.5 tidak valid atau tidak ditemukan."}), 404

        logs = []
        logs.append("Mulai proses Naive Bayes...")
        logs.append(f"Membaca data C4.5 terpilih (ID Hasil: {id_hasil_c45})...")

        # Muat model Naive Bayes & encoder
        if not os.path.exists(MODEL_NB_PATH) or not os.path.exists(ENCODER_PATH):
            return jsonify({"error": "Model Naive Bayes belum dilatih. Harap jalankan C4.5 terlebih dahulu."}), 400

        nb_model = joblib.load(MODEL_NB_PATH)
        encoder = joblib.load(ENCODER_PATH)

        # Muat dataset terpreprocessing
        df_clean = get_c45_dataset()
        X = df_clean[FEATURE_NAMES]
        y = df_clean[TARGET_COL]
        X_encoded = encoder.transform(X)

        logs.append("Melakukan perhitungan probabilitas Naive Bayes...")

        # Evaluasi model Naive Bayes
        class_counts = y.value_counts()
        use_stratify = (class_counts >= 2).all() and len(df_clean) >= 5

        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y,
            test_size=0.2,
            random_state=42,
            stratify=y if use_stratify else None
        )

        y_pred = nb_model.predict(X_test)
        class_names = list(nb_model.classes_)

        # Hitung metrik
        accuracy = float(accuracy_score(y_test, y_pred))
        precision = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        recall = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        # Simpan ke Database
        logs.append("Menyimpan hasil probabilitas ke database...")
        new_nb = HasilNaiveBayes(
            id_hasil_c45=id_hasil_c45,
            nilai_peluang=round(accuracy * 100, 2)
        )
        db.session.add(new_nb)
        db.session.commit()

        logs.append("Menyimpan hasil selesai.")
        
        return jsonify({
            "status": "success",
            "message": "Proses Naive Bayes berhasil diselesaikan.",
            "logs": logs
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

@naive_bayes_bp.route("/naive-bayes/results", methods=["GET"])
def get_naive_bayes_results():
    try:
        # Cek record hasil NB terakhir
        latest_nb = HasilNaiveBayes.query.order_by(HasilNaiveBayes.id_probabilitas.desc()).first()
        if not latest_nb:
            return jsonify({
                "error": "Hasil Naive Bayes belum tersedia. Harap jalankan proses Naive Bayes terlebih dahulu.",
                "model_ready": False
            }), 404

        if not os.path.exists(MODEL_NB_PATH) or not os.path.exists(ENCODER_PATH):
            return jsonify({
                "error": "Model Naive Bayes pkl tidak ditemukan.",
                "model_ready": False
            }), 404

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

        y_pred = nb_model.predict(X_test)
        class_names = list(nb_model.classes_)

        # Metrik
        accuracy = round(accuracy_score(y_test, y_pred) * 100, 2)
        precision = round(precision_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
        recall = round(recall_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)
        f1 = round(f1_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2)

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred, labels=class_names)
        
        # Mapping confusion matrix for display.
        cm_data = []
        for i, row in enumerate(cm):
            for j, val in enumerate(row):
                cm_data.append({
                    "actual": class_names[i],
                    "predicted": class_names[j],
                    "count": int(val)
                })

        # Hitung Probabilitas Prior
        total_data = len(y_train)
        prior_probs = []
        if total_data > 0:
            for cls in class_names:
                cls_count = int(np.sum(y_train == cls))
                prior_probs.append({
                    "label": f"{cls} (P(C))",
                    "value": round(cls_count / total_data, 4)
                })

        return jsonify({
            "model_ready": True,
            "id_probabilitas": latest_nb.id_probabilitas,
            "id_hasil_c45": latest_nb.id_hasil_c45,
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1_score": f1,
            },
            "class_names": class_names,
            "confusion_matrix": cm_data,
            "prior_probabilities": prior_probs,
            "total_samples": len(df_clean)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
