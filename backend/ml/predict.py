import os
import numpy as np
import joblib
from sklearn.tree import _tree

# Global variables untuk caching model & encoder
_c45_model = None
_nb_model = None
_encoder = None

def load_models():
    """Memuat model C4.5, Naive Bayes, dan OrdinalEncoder dari direktori models/"""
    global _c45_model, _nb_model, _encoder
    if _c45_model is None or _nb_model is None or _encoder is None:
        base_dir = os.path.dirname(__file__)
        c45_path = os.path.join(base_dir, 'models', 'model_c45.pkl')
        nb_path = os.path.join(base_dir, 'models', 'model_naive_bayes.pkl')
        encoder_path = os.path.join(base_dir, 'models', 'encoder.pkl')

        if os.path.exists(c45_path) and os.path.exists(nb_path) and os.path.exists(encoder_path):
            _c45_model = joblib.load(c45_path)
            _nb_model = joblib.load(nb_path)
            _encoder = joblib.load(encoder_path)
        else:
            raise FileNotFoundError(
                "Model files or encoder not found in backend/ml/models/. "
                "Please run train.py first."
            )

def categorize_inputs(kehadiran_num, nilai_num, pelanggaran_num):
    """
    Mengubah data numerik menjadi kategorikal kualitatif sesuai standar Bab IV:
    - Kehadiran: >= 220 ('Sangat Baik'), >= 200 ('Baik'), < 200 ('Kurang')
    - Nilai Rata-rata: >= 85.0 ('Tinggi'), >= 75.0 ('Sedang'), < 75.0 ('Rendah')
    - Pelanggaran: 0 ('Tidak Ada'), <= 2 ('Ringan'), > 2 ('Sedang/Berat')
    """
    try:
        keh = float(kehadiran_num)
    except (ValueError, TypeError):
        keh = 0.0

    try:
        nil = float(nilai_num)
    except (ValueError, TypeError):
        nil = 0.0

    try:
        pel = int(pelanggaran_num)
    except (ValueError, TypeError):
        pel = 0

    # 1. Kategori Kehadiran
    if keh >= 220:
        kategori_kehadiran = "Sangat Baik"
    elif keh >= 200:
        kategori_kehadiran = "Baik"
    else:
        kategori_kehadiran = "Kurang"

    # 2. Kategori Nilai Rata-rata
    if nil >= 85.0:
        kategori_nilai = "Tinggi"
    elif nil >= 75.0:
        kategori_nilai = "Sedang"
    else:
        kategori_nilai = "Rendah"

    # 3. Kategori Pelanggaran
    if pel == 0:
        kategori_pelanggaran = "Tidak Ada"
    elif pel <= 2:
        kategori_pelanggaran = "Ringan"
    else:
        kategori_pelanggaran = "Sedang/Berat"

    return kategori_kehadiran, kategori_nilai, kategori_pelanggaran

def _map_index_to_category(val, category_list):
    """Helper untuk mengonversi indeks integer/string angka ke label kategorikal"""
    try:
        idx = int(val)
        if 0 <= idx < len(category_list):
            return category_list[idx]
    except (ValueError, TypeError):
        pass
    return str(val) if val is not None else category_list[0]

def _build_feature_row(data_dict):
    """
    Membangun list 7 fitur berurutan sesuai skema OrdinalEncoder:
    [Kehadiran, Nilai, Pelanggaran, Pekerjaan Ortua, Penghasilan Ortua, Status SPP, Status Ortua]
    """
    # Ekstraksi atau diskretisasi fitur numerik
    has_numeric = any(k in data_dict for k in ['jumlah_kehadiran', 'kehadiran', 'nilai_rata_rata', 'nilai', 'jumlah_pelanggaran', 'pelanggaran'])
    
    if has_numeric:
        keh_raw = data_dict.get('jumlah_kehadiran', data_dict.get('kehadiran', 220))
        nil_raw = data_dict.get('nilai_rata_rata', data_dict.get('nilai', 80.0))
        pel_raw = data_dict.get('jumlah_pelanggaran', data_dict.get('pelanggaran', 0))
        
        kat_keh, kat_nil, kat_pel = categorize_inputs(keh_raw, nil_raw, pel_raw)
    else:
        kat_keh = data_dict.get('kategori_kehadiran', 'Baik')
        kat_nil = data_dict.get('kategori_nilai', 'Sedang')
        kat_pel = data_dict.get('kategori_pelanggaran', 'Tidak Ada')

    # Pemetaan Kategori Lainnya (Mengatasi pencocokan indeks angka maupun string)
    pekerjaan_cats = ['Buruh/Petani', 'Karyawan Swasta', 'PNS/TNI/Polri', 'Tidak Bekerja', 'Wiraswasta']
    pekerjaan_val = data_dict.get('pekerjaan_orang_tua', data_dict.get('pekerjaan', 'Buruh/Petani'))
    pekerjaan = _map_index_to_category(pekerjaan_val, pekerjaan_cats)
    if pekerjaan == "Buruh":
        pekerjaan = "Buruh/Petani"

    penghasilan_cats = ['< Rp 2.000.000', '> Rp 5.000.000', 'Rp 2.000.000 - Rp 5.000.000']
    penghasilan_val = data_dict.get('penghasilan_orang_tua', data_dict.get('penghasilan', 'Rp 2.000.000 - Rp 5.000.000'))
    penghasilan = _map_index_to_category(penghasilan_val, penghasilan_cats)

    spp_cats = ['Lancar', 'Menunggak 1-2 Bulan', 'Menunggak >2 Bulan']
    spp_val = data_dict.get('status_spp', data_dict.get('spp', 'Lancar'))
    spp = _map_index_to_category(spp_val, spp_cats)

    status_ortu_cats = ['Lengkap', 'Piatu', 'Yatim', 'Yatim Piatu']
    ortu_val = data_dict.get('status_orang_tua', data_dict.get('status_ortu', 'Lengkap'))
    status_ortu = _map_index_to_category(ortu_val, status_ortu_cats)

    return [kat_keh, kat_nil, kat_pel, pekerjaan, penghasilan, spp, status_ortu]

def _compute_hybrid_proba(feature_row):
    """Memproses encoding dan menghitung Soft Voting C4.5 + Naive Bayes"""
    load_models()
    
    encoded_arr = _encoder.transform([feature_row])
    encoded_arr[encoded_arr < 0] = 0

    c45_proba = _c45_model.predict_proba(encoded_arr)[0]
    nb_proba = _nb_model.predict_proba(encoded_arr)[0]

    # Soft Voting Average
    hybrid_proba = (c45_proba + nb_proba) / 2.0
    classes = list(_nb_model.classes_)
    
    predicted_idx = int(np.argmax(hybrid_proba))
    status_risiko = classes[predicted_idx]

    proba_dict = {
        classes[i]: round(float(hybrid_proba[i]) * 100, 2)
        for i in range(len(classes))
    }

    return encoded_arr, status_risiko, proba_dict

def predict_dropout(kehadiran_num, nilai_num, pelanggaran_num, spp, pekerjaan, penghasilan, status_ortu):
    """API Endpoint Prediksi sederhana dengan parameter terpisah"""
    data_dict = {
        'jumlah_kehadiran': kehadiran_num,
        'nilai_rata_rata': nilai_num,
        'jumlah_pelanggaran': pelanggaran_num,
        'status_spp': spp,
        'pekerjaan_orang_tua': pekerjaan,
        'penghasilan_orang_tua': penghasilan,
        'status_orang_tua': status_ortu
    }
    
    feature_row = _build_feature_row(data_dict)
    _, status_risiko, proba_dict = _compute_hybrid_proba(feature_row)
    
    prob_dropout_val = proba_dict.get('Tinggi', 0.0)

    return {
        "status_risiko": status_risiko,
        "probabilitas": proba_dict,
        "prob_dropout": f"{round(prob_dropout_val, 2)}%"
    }

def predict_categorical(features_dict):
    """API Endpoint Prediksi cepat yang mengembalikan string nama kelas hasil prediksi"""
    feature_row = _build_feature_row(features_dict)
    _, status_risiko, _ = _compute_hybrid_proba(feature_row)
    return status_risiko

def predict_with_detail(features_dict):
    """
    API Endpoint Utama UI Modal:
    Mengembalikan data mentah, data terenkode, decision path C4.5 rapi, dan probabilitas hybrid.
    """
    FEATURE_NAMES = [
        'Kategori Kehadiran',
        'Kategori Nilai',
        'Kategori Pelanggaran',
        'Pekerjaan Orang Tua',
        'Penghasilan Orang Tua',
        'Status SPP',
        'Status Orang Tua',
    ]

    feature_row = _build_feature_row(features_dict)
    encoded_arr, status_risiko, proba_dict = _compute_hybrid_proba(feature_row)

    encoded_vals = [int(v) for v in encoded_arr[0]]

    # Data Dictionaries untuk Modal Frontend
    data_raw = {FEATURE_NAMES[i]: feature_row[i] for i in range(len(FEATURE_NAMES))}
    data_encoded = {FEATURE_NAMES[i]: encoded_vals[i] for i in range(len(FEATURE_NAMES))}

    # Extraction Decision Path C4.5 (Format Kualitatif Bab IV)
    tree_ = _c45_model.tree_

    def get_decision_path(sample):
        node = 0
        rules = []
        while tree_.feature[node] != _tree.TREE_UNDEFINED:
            feat_idx = tree_.feature[node]
            feat_name = FEATURE_NAMES[feat_idx] if feat_idx < len(FEATURE_NAMES) else f"Fitur[{feat_idx}]"
            threshold = tree_.threshold[node]
            val = sample[0][feat_idx]
            val_cat = feature_row[feat_idx]
            
            rule_str = f"{feat_name} = '{val_cat}'"
            # Hindari menambahkan rule berurutan yang duplikat di UI
            if not rules or rules[-1] != rule_str:
                rules.append(rule_str)

            if val <= threshold:
                node = tree_.children_left[node]
            else:
                node = tree_.children_right[node]
        return rules

    rules = get_decision_path(encoded_arr)

    return {
        "data_raw": data_raw,
        "data_encoded": data_encoded,
        "prediction_detail": {
            "status_risiko": status_risiko,
            "probabilitas": proba_dict,
            "rules": rules,
            "rule_summary": f"Risiko {status_risiko} terdeteksi via {rules[-1] if rules else 'model C4.5'}"
        }
    }