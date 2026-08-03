from flask import Blueprint, request, jsonify
from models import db, LaporanSiswaBerisiko, Siswa, HasilPrediksiSiswaBerisiko, GuruBK, WaliKelas
from functools import wraps
import jwt
from datetime import datetime
from config import Config

laporan_bp = Blueprint('laporan', __name__)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            current_user_id = data['user_id']
            current_user_role = data.get('role', 'admin')
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user_id, current_user_role, *args, **kwargs)
    return decorated


# ─── ADMIN ENDPOINTS (No Auth Required) ─────────────────────────────────────

@laporan_bp.route('/admin/all', methods=['GET'])
def admin_get_all_laporan():
    """Admin: ambil semua laporan beserta data siswa."""
    try:
        laporan_list = LaporanSiswaBerisiko.query.order_by(LaporanSiswaBerisiko.tanggal.desc()).all()
        result = []
        for l in laporan_list:
            item = l.to_dict()
            # Enrich with prediction detail
            if l.prediksi:
                item['kategori_risiko'] = l.prediksi.kategori_risiko
                item['skor_probabilitas'] = round(l.prediksi.skor_probabilitas * 100, 2) if l.prediksi.skor_probabilitas else None
            result.append(item)
        return jsonify({'laporan': result})
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@laporan_bp.route('/admin/create', methods=['POST'])
def admin_create_laporan():
    """Admin: buat laporan baru dari hasil prediksi yang dipilih."""
    try:
        data = request.get_json()
        prediksi_id = data.get('prediksi_id')
        catatan = data.get('catatan', '').strip()
        rekomendasi = data.get('rekomendasi', '').strip()

        if not prediksi_id:
            return jsonify({'error': 'prediksi_id wajib diisi.'}), 400

        prediksi = HasilPrediksiSiswaBerisiko.query.get(prediksi_id)
        if not prediksi:
            return jsonify({'error': 'Data prediksi tidak ditemukan.'}), 404

        keterangan = f"Catatan: {catatan}"
        if rekomendasi:
            keterangan += f" | Rekomendasi: {rekomendasi}"

        laporan = LaporanSiswaBerisiko(
            prediksi_id=prediksi_id,
            keterangan=keterangan,
            status='Tersimpan',
        )
        db.session.add(laporan)
        db.session.commit()
        return jsonify({'message': 'Laporan berhasil disimpan.', 'laporan': laporan.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@laporan_bp.route('/admin/<int:id>', methods=['DELETE'])
def admin_delete_laporan(id):
    """Admin: hapus laporan berdasarkan ID."""
    try:
        laporan = LaporanSiswaBerisiko.query.get_or_404(id)
        db.session.delete(laporan)
        db.session.commit()
        return jsonify({'message': 'Laporan berhasil dihapus.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@laporan_bp.route('/admin/prediksi-list', methods=['GET'])
def admin_get_prediksi_list():
    """Admin: ambil semua data prediksi siswa untuk modal Tambah Laporan."""
    try:
        records = HasilPrediksiSiswaBerisiko.query.order_by(HasilPrediksiSiswaBerisiko.tanggal_prediksi.desc()).all()
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
                'kategori_risiko': r.kategori_risiko,
                'skor_probabilitas': round(r.skor_probabilitas * 100, 2) if r.skor_probabilitas else None,
                'tanggal_prediksi': r.tanggal_prediksi.strftime('%d/%m/%Y %H:%M') if r.tanggal_prediksi else None,
                'jumlah_absensi': siswa.jumlah_absensi,
                'nilai_rata': siswa.nilai_rata,
                'jumlah_pelanggaran': siswa.jumlah_pelanggaran,
                'status_spp': siswa.status_spp,
                'pekerjaan_ortu': siswa.pekerjaan_ortu,
                'penghasilan_ortu': siswa.penghasilan_ortu,
                'status_ortu': siswa.status_ortu,
            })
        return jsonify({'data': result})
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


# ─── EXISTING ROLE-BASED ENDPOINTS ───────────────────────────────────────────

@laporan_bp.route('/', methods=['GET'])
@token_required
def get_laporan(current_user_id, current_user_role):
    """Guru BK: semua laporan. Wali Kelas: laporan siswa di kelasnya."""
    if current_user_role == 'guru_bk':
        laporan_list = LaporanSiswaBerisiko.query.order_by(LaporanSiswaBerisiko.tanggal.desc()).all()
    elif current_user_role == 'wali_kelas':
        wk = WaliKelas.query.filter_by(user_id=current_user_id).first()
        if not wk:
            return jsonify({'laporan': []})
        siswa_ids = [s.data_id for s in Siswa.query.filter_by(kelas=wk.kelas_diampu).all()]
        prediksi_ids = [p.prediksi_id for p in HasilPrediksiSiswaBerisiko.query.filter(HasilPrediksiSiswaBerisiko.data_id.in_(siswa_ids)).all()]
        laporan_list = LaporanSiswaBerisiko.query.filter(
            LaporanSiswaBerisiko.prediksi_id.in_(prediksi_ids)
        ).order_by(LaporanSiswaBerisiko.tanggal.desc()).all()
    else:
        laporan_list = LaporanSiswaBerisiko.query.order_by(LaporanSiswaBerisiko.tanggal.desc()).all()

    return jsonify({'laporan': [l.to_dict() for l in laporan_list]})


@laporan_bp.route('/', methods=['POST'])
@token_required
def buat_laporan(current_user_id, current_user_role):
    """Guru BK membuat laporan siswa berisiko."""
    if current_user_role not in ('guru_bk', 'admin'):
        return jsonify({'message': 'Akses ditolak. Hanya Guru BK yang dapat membuat laporan.'}), 403

    data = request.get_json()
    student_id = data.get('student_id')
    catatan = data.get('catatan', '').strip()
    rekomendasi = data.get('rekomendasi', '').strip()

    if not student_id or not catatan:
        return jsonify({'message': 'student_id dan catatan wajib diisi.'}), 400

    siswa = Siswa.query.get(student_id)
    if not siswa:
        return jsonify({'message': 'Siswa tidak ditemukan.'}), 404

    # Cari prediksi terbaru untuk siswa ini
    prediksi_terbaru = HasilPrediksiSiswaBerisiko.query.filter_by(data_id=student_id).order_by(HasilPrediksiSiswaBerisiko.tanggal_prediksi.desc()).first()
    if not prediksi_terbaru:
        return jsonify({'message': 'Siswa ini belum diprediksi, tidak bisa dibuat laporan.'}), 400

    laporan = LaporanSiswaBerisiko(
        prediksi_id=prediksi_terbaru.prediksi_id,
        keterangan=f"Catatan: {catatan} | Rekomendasi: {rekomendasi}",
        status='Dikirim',
    )
    db.session.add(laporan)
    db.session.commit()
    return jsonify({'message': 'Laporan berhasil dibuat.', 'laporan': laporan.to_dict()}), 201


@laporan_bp.route('/<int:id>/konfirmasi', methods=['PUT'])
@token_required
def konfirmasi_laporan(current_user_id, current_user_role, id):
    """Wali Kelas mengkonfirmasi laporan."""
    if current_user_role not in ('wali_kelas', 'admin'):
        return jsonify({'message': 'Akses ditolak. Hanya Wali Kelas yang dapat mengkonfirmasi laporan.'}), 403

    laporan = LaporanSiswaBerisiko.query.get_or_404(id)
    if laporan.status == 'Dikonfirmasi':
        return jsonify({'message': 'Laporan sudah dikonfirmasi sebelumnya.'}), 400

    laporan.status = 'Dikonfirmasi'
    db.session.commit()
    return jsonify({'message': 'Laporan berhasil dikonfirmasi.', 'laporan': laporan.to_dict()})


@laporan_bp.route('/siswa-berisiko', methods=['GET'])
@token_required
def get_siswa_berisiko(current_user_id, current_user_role):
    """Daftar siswa berisiko Tinggi atau Sedang — untuk Guru BK."""
    siswa = Siswa.query.filter(
        Siswa.risiko_dropout.in_(['Tinggi', 'Sedang'])
    ).order_by(Siswa.risiko_dropout.asc()).all()

    result = []
    for s in siswa:
        d = s.to_dict()
        prediksi = HasilPrediksiSiswaBerisiko.query.filter_by(data_id=s.data_id).order_by(HasilPrediksiSiswaBerisiko.tanggal_prediksi.desc()).first()
        laporan_aktif = None
        if prediksi:
            laporan_aktif = LaporanSiswaBerisiko.query.filter_by(prediksi_id=prediksi.prediksi_id, status='Dikirim').first()
        d['laporan_aktif'] = laporan_aktif.to_dict() if laporan_aktif else None
        result.append(d)

    return jsonify({'siswa_berisiko': result})
