from flask import Blueprint, request, jsonify
from models import db, Siswa, HasilPreprocessingData, HasilProsesC45, HasilNaiveBayes, HasilPrediksiSiswaBerisiko
from ml.predict import predict_with_detail
from routes.students import token_required
import json

predict_bp = Blueprint('predict', __name__)


@predict_bp.route('/results', methods=['GET'])
def get_prediction_results():
    """Ambil semua hasil prediksi akhir siswa dari database untuk halaman Hasil Prediksi."""
    try:
        records = HasilPrediksiSiswaBerisiko.query \
            .order_by(HasilPrediksiSiswaBerisiko.tanggal_prediksi.desc()) \
            .all()

        result = []
        for r in records:
            siswa = r.siswa
            if not siswa:
                continue
            result.append({
                'prediksi_id': r.prediksi_id,
                'siswa_id': r.siswa_id,
                'nama_lengkap': siswa.nama_lengkap,
                'kelas': siswa.kelas,
                'tahun_ajaran': siswa.tahun_ajaran,
                'jumlah_absensi': siswa.jumlah_absensi,
                'nilai_rata': siswa.nilai_rata,
                'jumlah_pelanggaran': siswa.jumlah_pelanggaran,
                'pekerjaan_ortu': siswa.pekerjaan_ortu,
                'penghasilan_ortu': siswa.penghasilan_ortu,
                'status_spp': siswa.status_spp,
                'status_ortu': siswa.status_ortu,
                'kategori_risiko': r.kategori_risiko,
                'skor_probabilitas': round(r.skor_probabilitas * 100, 2) if r.skor_probabilitas is not None else None,
                'tanggal_prediksi': r.tanggal_prediksi.strftime('%d/%m/%Y %H:%M') if r.tanggal_prediksi else None,
            })

        # Summary counts
        total = len(result)
        tinggi = sum(1 for r in result if r['kategori_risiko'] == 'Tinggi')
        sedang = sum(1 for r in result if r['kategori_risiko'] == 'Sedang')
        rendah = sum(1 for r in result if r['kategori_risiko'] == 'Rendah')

        return jsonify({
            'data': result,
            'summary': {
                'total': total,
                'tinggi': tinggi,
                'sedang': sedang,
                'rendah': rendah,
            }
        })
    except Exception as e:
        import traceback
        return jsonify({'success': False, 'message': str(e), 'trace': traceback.format_exc()}), 500


@predict_bp.route('/detail', methods=['POST'])
@predict_bp.route('/predict-detail', methods=['POST'])
def get_prediction_detail():
    """Hitung prediksi tanpa menyimpan ke database — untuk simulasi."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Data input tidak ditemukan'}), 400

    try:
        result = predict_with_detail(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@predict_bp.route('/save', methods=['POST'])
@token_required
def predict_student(current_user_id):
    """Simpan siswa + hasil prediksi ke tabel-tabel sesuai ERD."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Data input tidak ditemukan'}), 400

    try:
        nisn = data.get('nisn')
        
        jumlah_kehadiran = float(data.get('jumlah_kehadiran', 0))
        jumlah_absensi = max(0, int(240 - jumlah_kehadiran))

        predict_input = {
            'jumlah_kehadiran': jumlah_kehadiran,
            'nilai_rata_rata': float(data.get('rata_rata_nilai', data.get('nilai_rata_rata', 0))),
            'jumlah_pelanggaran': int(data.get('jumlah_pelanggaran', 0)),
            'pekerjaan_orang_tua': data.get('pekerjaan_ortu', 'Wiraswasta'),
            'penghasilan_orang_tua': data.get('penghasilan_ortu', 'Rp 2.000.000 - Rp 5.000.000'),
            'status_spp': data.get('status_spp', 'Lancar'),
            'status_orang_tua': data.get('status_ortu', 'Lengkap'),
        }

        detail = predict_with_detail(predict_input)
        status_risiko = detail['prediction_detail']['status_risiko']
        probabilitas = detail['prediction_detail']['probabilitas']

        # 1. Simpan atau Update Data Siswa
        student = Siswa.query.filter_by(nisn=nisn).first() if nisn else None
        
        if not student:
            # Generate siswa_id
            next_num = Siswa.query.count() + 1
            while True:
                siswa_id = f"S-{next_num:03d}"
                if not Siswa.query.filter_by(siswa_id=siswa_id).first():
                    break
                next_num += 1
        
        if student:
            student.nama_lengkap = data.get('nama', student.nama_lengkap)
            student.kelas = data.get('kelas', student.kelas)
            student.tahun_ajaran = data.get('tahun_ajaran', student.tahun_ajaran)
            student.jumlah_absensi = jumlah_absensi
            student.nilai_rata = float(data.get('rata_rata_nilai', data.get('nilai_rata_rata', student.nilai_rata or 0)))
            student.jumlah_pelanggaran = int(data.get('jumlah_pelanggaran', student.jumlah_pelanggaran or 0))
            student.pekerjaan_ortu = data.get('pekerjaan_ortu', student.pekerjaan_ortu)
            student.penghasilan_ortu = data.get('penghasilan_ortu', student.penghasilan_ortu)
            student.status_spp = data.get('status_spp', student.status_spp)
            student.status_ortu = data.get('status_ortu', student.status_ortu)
            student.risiko_dropout = status_risiko
        else:
            student = Siswa(
                siswa_id=siswa_id,
                nisn=nisn,
                nama_lengkap=data.get('nama'),
                kelas=data.get('kelas'),
                tahun_ajaran=data.get('tahun_ajaran', '2026/2027'),
                jumlah_absensi=jumlah_absensi,
                nilai_rata=float(data.get('rata_rata_nilai', data.get('nilai_rata_rata', 0))),
                jumlah_pelanggaran=int(data.get('jumlah_pelanggaran', 0)),
                pekerjaan_ortu=data.get('pekerjaan_ortu'),
                penghasilan_ortu=data.get('penghasilan_ortu'),
                status_spp=data.get('status_spp'),
                status_ortu=data.get('status_ortu'),
                risiko_dropout=status_risiko
            )
            db.session.add(student)
            db.session.flush()
        
        # 3. Simpan Hasil Preprocessing
        preprocessing = HasilPreprocessingData(
            data_id=student.data_id,
            raw_data_json=json.dumps(data),
            encoded_data_json=json.dumps({'status': 'encoded'})
        )
        db.session.add(preprocessing)
        db.session.flush()

        # 4. Simpan Hasil C4.5
        hasil_c45 = HasilProsesC45(
            id_preprocessing=preprocessing.id_preprocessing,
            atribut_terpilih="Semua Atribut",
            status_c45=status_risiko
        )
        db.session.add(hasil_c45)
        db.session.flush()

        # 5. Simpan Hasil Naive Bayes
        winning_prob = float(probabilitas.get(status_risiko, 0.0))
        
        hasil_nb = HasilNaiveBayes(
            id_hasil_c45=hasil_c45.id_hasil_c45,
            nilai_peluang=winning_prob
        )
        db.session.add(hasil_nb)
        db.session.flush()

        # 6. Simpan Hasil Prediksi (Hybrid)
        hasil_prediksi = HasilPrediksiSiswaBerisiko(
            data_id=student.data_id,
            siswa_id=student.siswa_id,
            kategori_risiko=status_risiko,
            skor_probabilitas=winning_prob
        )
        db.session.add(hasil_prediksi)

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Data simulasi dan seluruh tahapan ERD berhasil disimpan.',
            'prediksi_id': hasil_prediksi.prediksi_id,
            'data_raw': detail.get('data_raw'),
            'data_encoded': detail.get('data_encoded'),
            'prediction_detail': detail.get('prediction_detail')
        }), 201

    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({"success": False, "message": str(e), "trace": traceback.format_exc()}), 500