import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import CategoricalNB
from sklearn.preprocessing import OrdinalEncoder
from sklearn.tree import DecisionTreeClassifier
from sklearn.utils import resample


def train_model_from_df(df):
    """
    Melatih model C4.5 dan Naive Bayes menggunakan DataFrame yang diberikan.
    Menyimpan model & encoder ke direktori ml/models/.
    """
    feature_cols = [
        "Kategori Kehadiran",
        "Kategori Nilai",
        "Kategori Pelanggaran",
        "Pekerjaan Orang Tua",
        "Penghasilan Orang Tua",
        "Status SPP",
        "Status Orang Tua",
    ]
    target_col = "Risiko Drop-Out"

    # Bersihkan data
    df_clean = df.dropna(subset=feature_cols + [target_col])
    
    # Jika data terlalu sedikit, kombinasikan dengan dataset default agar training stabil
    # dan mencegah error split/stratify pada sample kecil.
    if len(df_clean) < 100:
        base_dir = os.path.dirname(__file__)
        csv_path = os.path.join(base_dir, "..", "data_siswa_arridho_lengkap_v3.csv")
        # Jika tidak ketemu di .., coba di base_dir langsung
        if not os.path.exists(csv_path):
            csv_path = os.path.join(base_dir, "data_siswa_arridho_lengkap_v3.csv")
            
        if os.path.exists(csv_path):
            df_csv = pd.read_csv(csv_path)
            df_clean = pd.concat([df_csv, df_clean], ignore_index=True)

    if len(df_clean) < 5:
        return False

    X = df_clean[feature_cols]
    y = df_clean[target_col]

    # Split dataset
    class_counts = y.value_counts()
    use_stratify = (class_counts >= 2).all() and len(df_clean) >= 5

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y if use_stratify else None
    )

    # Oversampling jika ada variasi kelas
    train_df = pd.concat([X_train, y_train], axis=1)
    classes = y_train.unique()

    if len(classes) > 1:
        max_samples = class_counts.max()
        dfs = []
        for cls in classes:
            df_cls = train_df[train_df[target_col] == cls]
            if len(df_cls) > 0:
                df_cls_over = resample(
                    df_cls, replace=True, n_samples=max_samples, random_state=42
                )
                dfs.append(df_cls_over)
        train_balanced = pd.concat(dfs)
        X_train_bal = train_balanced[feature_cols]
        y_train_bal = train_balanced[target_col]
    else:
        X_train_bal = X_train
        y_train_bal = y_train

    # Encoding
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    X_train_encoded = encoder.fit_transform(X_train_bal)

    # Latih C4.5
    c45_model = DecisionTreeClassifier(criterion="entropy", random_state=42)
    c45_model.fit(X_train_encoded, y_train_bal)

    # Latih Naive Bayes
    nb_model = CategoricalNB()
    # Mengatasi keterbatasan CategoricalNB ketika training set tidak mencakup semua kategori yang didefinisikan encoder
    nb_model.fit(X_train_encoded, y_train_bal)

    # Simpan model
    base_dir = os.path.dirname(__file__)
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(c45_model, os.path.join(models_dir, "model_c45.pkl"))
    joblib.dump(nb_model, os.path.join(models_dir, "model_naive_bayes.pkl"))
    joblib.dump(encoder, os.path.join(models_dir, "encoder.pkl"))
    joblib.dump(feature_cols, os.path.join(models_dir, "feature_cols.pkl"))
    
    # Hapus cache model global di predict agar model baru langsung termuat pada request berikutnya
    import ml.predict as pred
    pred._c45_model = None
    pred._nb_model = None
    pred._encoder = None

    return True


def main():
  print("=" * 65)
  print(" PROSES PELATIHAN MODEL C4.5 & NAÏVE BAYES - SKRIPSI AR-RIDHO")
  print("=" * 65)

  # 1. LOAD DATASET
  dataset_path = "data_siswa_arridho_lengkap_v3.csv"
  if not os.path.exists(dataset_path):
    print(f"[ERROR] File '{dataset_path}' tidak ditemukan!")
    return

  df = pd.read_csv(dataset_path)
  print(f"[INFO] Berhasil memuat dataset. Total data: {len(df)} baris.")

  success = train_model_from_df(df)
  if success:
      print("=" * 65)
      print("[SUKSES] Seluruh model dan encoder berhasil disimpan di folder 'models/'")
      print("=" * 65)


if __name__ == "__main__":
  main()


if __name__ == "__main__":
  main()